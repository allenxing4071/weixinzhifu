// 订单管理路由模块
const express = require('express');
const router = express.Router();
const {
  validatePagination,
  validatePaymentHistory,
  validateOrderId
} = require('../middlewares/validation');
const { requireAdmin } = require('../utils/jwt');
const { logOperation } = require('../utils/logger');

// ==================== 获取订单统计数据 ====================
router.get("/stats", async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: "数据库未连接" });
    }

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalAmount
      FROM payment_orders
    `);

    res.json({
      success: true,
      data: stats[0] || { total: 0, paid: 0, pending: 0, cancelled: 0, totalAmount: 0 }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取订单列表（管理后台） ====================
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const status = req.query.status;
    const merchantId = req.query.merchantId;
    const userId = req.query.userId;
    const search = req.query.search;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    let params = [];

    const conditions = [];
    
    // 搜索功能：搜索订单ID、商户名称、用户昵称
    if (search) {
      conditions.push('(o.id LIKE ? OR o.merchant_name LIKE ? OR u.nickname LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (merchantId) {
      conditions.push('o.merchant_id = ?');
      params.push(merchantId);
    }
    if (userId) {
      conditions.push('o.user_id = ?');
      params.push(userId);
    }
    if (startDate) {
      conditions.push('o.created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('o.created_at <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // 优化：使用LEFT JOIN一次性获取订单和用户信息
    const [orders] = await pool.query(`
      SELECT
        o.id,
        o.user_id as userId,
        o.merchant_id as merchantId,
        o.merchant_name as merchantName,
        o.merchant_category as merchantCategory,
        o.amount,
        o.points_awarded as pointsAwarded,
        o.payment_method as paymentMethod,
        o.status,
        o.wechat_order_id as wechatOrderId,
        o.paid_at as paidAt,
        o.created_at as createdAt,
        o.updated_at as updatedAt,
        u.nickname as userNickname,
        u.phone as userPhone
      FROM payment_orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM payment_orders o ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        list: orders.map(order => ({
          ...order,
          amount: order.amount / 100 // 转换为元
        })),
        pagination: {
          page,
          pageSize,
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取订单详情 ====================
router.get('/:id', validateOrderId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;

    const [orders] = await pool.execute(`
      SELECT
        o.id,
        o.user_id as userId,
        o.merchant_id as merchantId,
        o.merchant_name as merchantName,
        o.merchant_category as merchantCategory,
        o.amount,
        o.points_awarded as pointsAwarded,
        o.payment_method as paymentMethod,
        o.status,
        o.wechat_order_id as wechatOrderId,
        o.paid_at as paidAt,
        o.created_at as createdAt,
        o.updated_at as updatedAt,
        u.nickname as userNickname,
        u.phone as userPhone,
        u.avatar as userAvatar
      FROM payment_orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const order = orders[0];

    // 获取关联的积分记录
    const [pointsRecords] = await pool.execute(`
      SELECT
        id,
        points_change as pointsChange,
        record_type as recordType,
        description,
        created_at as createdAt
      FROM points_records
      WHERE related_order_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...order,
        amount: order.amount / 100,
        pointsRecords
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取用户订单历史（小程序） ====================
router.get('/user/history', validatePaymentHistory, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const merchantId = req.query.merchantId;
    const status = req.query.status;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.id];

    if (merchantId) {
      whereClause += ' AND merchant_id = ?';
      params.push(merchantId);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [records] = await pool.query(`
      SELECT
        id,
        merchant_id as merchantId,
        merchant_name as merchantName,
        merchant_category as merchantCategory,
        amount,
        points_awarded as pointsEarned,
        status,
        paid_at as paidAt,
        created_at as createdAt
      FROM payment_orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM payment_orders ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        records: records.map(record => ({
          ...record,
          amount: record.amount / 100
        })),
        pagination: {
          page,
          pageSize,
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取用户商户消费统计（小程序） ====================
router.get('/user/merchant-stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }

    const [stats] = await pool.execute(`
      SELECT
        merchant_id as merchantId,
        merchant_name as merchantName,
        merchant_category as merchantCategory,
        COUNT(*) as orderCount,
        SUM(amount) as totalAmount,
        SUM(points_awarded) as totalPoints,
        MAX(paid_at) as lastVisit
      FROM payment_orders
      WHERE user_id = ? AND status = 'paid'
      GROUP BY merchant_id, merchant_name, merchant_category
      ORDER BY totalAmount DESC
    `, [req.user.id]);

    const formattedStats = stats.map(stat => ({
      ...stat,
      totalAmount: stat.totalAmount / 100
    }));

    const summary = {
      totalMerchants: formattedStats.length,
      totalAmount: formattedStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
      totalOrders: formattedStats.reduce((sum, stat) => sum + stat.orderCount, 0),
      totalPoints: formattedStats.reduce((sum, stat) => sum + stat.totalPoints, 0)
    };

    res.json({
      success: true,
      data: {
        merchantGroups: formattedStats,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 退款订单（管理后台） ====================
router.post('/:id/refund', requireAdmin, validateOrderId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 获取订单信息
      const [orders] = await connection.execute(
        'SELECT * FROM payment_orders WHERE id = ?',
        [id]
      );

      if (orders.length === 0) {
        throw new Error('订单不存在');
      }

      const order = orders[0];

      if (order.status !== 'paid') {
        throw new Error('只能退款已支付的订单');
      }

      // 更新订单状态
      await connection.execute(
        'UPDATE payment_orders SET status = "refunded", updated_at = NOW() WHERE id = ?',
        [id]
      );

      // 扣减用户积分
      if (order.points_awarded > 0) {
        // 创建退款积分记录
        const recordId = `points_refund_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await connection.execute(`
          INSERT INTO points_records
          (id, user_id, points_change, record_type, related_order_id, merchant_id, merchant_name, description)
          VALUES (?, ?, ?, 'admin_adjust', ?, ?, ?, ?)
        `, [
          recordId,
          order.user_id,
          -order.points_awarded,
          order.id,
          order.merchant_id,
          order.merchant_name,
          `订单退款，扣减积分（原因：${reason || '未说明'}）`
        ]);

        // 更新用户积分
        await connection.execute(`
          UPDATE user_points
          SET available_points = available_points - ?,
              total_spent = total_spent + ?
          WHERE user_id = ?
        `, [order.points_awarded, order.points_awarded, order.user_id]);
      }

      await connection.commit();

      logOperation('Refund Order', req.user.id, {
        orderId: id,
        amount: order.amount,
        points: order.points_awarded,
        reason
      });

      res.json({
        success: true,
        message: '订单退款成功',
        data: {
          orderId: id,
          refundAmount: order.amount / 100,
          refundPoints: order.points_awarded
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
