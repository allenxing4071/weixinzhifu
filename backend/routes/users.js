// 用户管理路由模块
const express = require('express');
const router = express.Router();
const { validatePagination, validateUserId, validateAdjustPoints } = require('../middlewares/validation');
const { requireAdmin } = require('../utils/jwt');
const { logOperation } = require('../utils/logger');

// 所有用户管理接口需要管理员权限
router.use(requireAdmin);

// ==================== 获取用户统计数据 ====================
router.get('/stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN up.available_points > 0 THEN 1 END) as activeUsers,
        COALESCE(SUM(up.available_points), 0) as totalPoints,
        COALESCE(SUM(up.total_earned), 0) as totalEarned,
        COALESCE(SUM(up.total_spent), 0) as totalSpent
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
    `);

    res.json({
      success: true,
      data: stats[0] || { total: 0, activeUsers: 0, totalPoints: 0, totalEarned: 0, totalSpent: 0 }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取用户列表 ====================
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const search = req.query.search;
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE u.nickname LIKE ? OR u.phone LIKE ?';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // 优化：使用LEFT JOIN一次性获取用户和积分信息
    const [users] = await pool.query(`
      SELECT
        u.id,
        u.wechat_id as wechatId,
        u.nickname,
        u.avatar,
        u.phone,
        u.status,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        COALESCE(up.available_points, 0) as availablePoints,
        COALESCE(up.total_earned, 0) as totalEarned,
        COALESCE(up.total_spent, 0) as totalSpent,
        COUNT(DISTINCT CASE WHEN po.status = 'paid' THEN po.id END) as orderCount,
        COALESCE(SUM(CASE WHEN po.status = 'paid' THEN po.amount ELSE 0 END), 0) as totalAmount
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      LEFT JOIN payment_orders po ON u.id = po.user_id
      ${whereClause}
      GROUP BY u.id, u.wechat_id, u.nickname, u.avatar, u.phone, u.status, u.created_at, u.updated_at,
               up.available_points, up.total_earned, up.total_spent
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM users u ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        list: users.map(user => ({
          ...user,
          totalAmount: user.totalAmount / 100 // 转换为元
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

// ==================== 获取用户详情 ====================
router.get('/:id', validateUserId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;

    // 获取用户基本信息和积分信息
    const [users] = await pool.execute(`
      SELECT
        u.id,
        u.wechat_id as wechatId,
        u.nickname,
        u.avatar,
        u.phone,
        u.status,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        COALESCE(up.available_points, 0) as availablePoints,
        COALESCE(up.total_earned, 0) as totalEarned,
        COALESCE(up.total_spent, 0) as totalSpent
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 获取订单统计（按状态分组）
    const [orderStats] = await pool.execute(`
      SELECT
        COUNT(*) as totalOrders,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidOrders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingOrders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledOrders,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN points_awarded ELSE 0 END), 0) as totalPoints
      FROM payment_orders
      WHERE user_id = ?
    `, [id]);

    // 获取商户消费统计（最多5个）
    const [merchantStats] = await pool.execute(`
      SELECT
        merchant_id as merchantId,
        merchant_name as merchantName,
        merchant_category as merchantCategory,
        COUNT(*) as orderCount,
        SUM(amount) as totalAmount,
        SUM(points_awarded) as totalPoints
      FROM payment_orders
      WHERE user_id = ? AND status = 'paid'
      GROUP BY merchant_id, merchant_name, merchant_category
      ORDER BY totalAmount DESC
      LIMIT 5
    `, [id]);

    // 获取最近积分记录（最多10条）
    const [pointsHistory] = await pool.execute(`
      SELECT
        id,
        points_change as pointsChange,
        record_type as recordType,
        merchant_name as merchantName,
        description,
        created_at as createdAt
      FROM points_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    // 获取最近订单（最多10条）
    const [recentOrders] = await pool.execute(`
      SELECT
        id,
        merchant_name as merchantName,
        amount,
        points_awarded as pointsAwarded,
        status,
        created_at as createdAt
      FROM payment_orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    // 返回扁平化的数据结构，与前端期望的格式匹配
    res.json({
      success: true,
      data: {
        // 基本信息
        ...user,
        // 订单统计
        orderStats: {
          totalOrders: orderStats[0].totalOrders || 0,
          paidOrders: orderStats[0].paidOrders || 0,
          pendingOrders: orderStats[0].pendingOrders || 0,
          cancelledOrders: orderStats[0].cancelledOrders || 0,
          totalAmount: orderStats[0].totalAmount || 0,
          totalPoints: orderStats[0].totalPoints || 0
        },
        // 商户统计
        merchantStats: merchantStats.map(stat => ({
          ...stat,
          totalAmount: stat.totalAmount || 0
        })),
        // 积分历史
        pointsHistory: pointsHistory || [],
        // 最近订单
        recentOrders: recentOrders.map(order => ({
          ...order,
          amount: order.amount || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 切换用户状态 ====================
router.put('/:id/status', validateUserId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态参数无效，必须是 active 或 locked'
      });
    }

    // 检查用户是否存在
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户状态
    await pool.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    logOperation('Update User Status', req.user.id, {
      userId: id,
      newStatus: status
    });

    res.json({
      success: true,
      message: `用户状态已更新为${status === 'active' ? '正常' : '锁定'}`,
      data: { userId: id, status }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 调整用户积分 ====================
router.post('/:id/adjust-points', validateAdjustPoints, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;
    const { points, reason } = req.body;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 检查用户是否存在
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        throw new Error('用户不存在');
      }

      // 如果是扣减积分，检查余额是否足够
      if (points < 0) {
        const [pointsData] = await connection.execute(
          'SELECT available_points FROM user_points WHERE user_id = ?',
          [id]
        );

        const currentPoints = pointsData.length > 0 ? pointsData[0].available_points : 0;
        if (currentPoints + points < 0) {
          throw new Error('积分余额不足');
        }
      }

      // 创建积分记录
      const recordId = `points_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await connection.execute(`
        INSERT INTO points_records
        (id, user_id, points_change, record_type, description)
        VALUES (?, ?, ?, 'admin_adjust', ?)
      `, [recordId, id, points, reason]);

      // 更新用户积分
      if (points > 0) {
        await connection.execute(`
          INSERT INTO user_points (user_id, available_points, total_earned, total_spent)
          VALUES (?, ?, ?, 0)
          ON DUPLICATE KEY UPDATE
          available_points = available_points + ?,
          total_earned = total_earned + ?
        `, [id, points, points, points, points]);
      } else {
        await connection.execute(`
          INSERT INTO user_points (user_id, available_points, total_earned, total_spent)
          VALUES (?, 0, 0, ?)
          ON DUPLICATE KEY UPDATE
          available_points = available_points + ?,
          total_spent = total_spent + ?
        `, [id, Math.abs(points), points, Math.abs(points)]);
      }

      await connection.commit();

      logOperation('Adjust User Points', req.user.id, {
        userId: id,
        points,
        reason
      });

      res.json({
        success: true,
        message: '积分调整成功',
        data: {
          userId: id,
          pointsChange: points,
          reason
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
