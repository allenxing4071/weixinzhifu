// 积分管理路由模块
const express = require('express');
const router = express.Router();
const { validatePointsHistory } = require('../middlewares/validation');

// ==================== 获取积分记录列表（管理后台） ====================
router.get('/', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const search = req.query.search;
    const recordType = req.query.recordType;
    const merchantId = req.query.merchantId;
    const offset = (page - 1) * pageSize;

    // 构建WHERE条件
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(u.nickname LIKE ? OR pr.merchant_name LIKE ? OR pr.description LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (recordType && recordType !== 'all') {
      whereConditions.push('pr.record_type = ?');
      params.push(recordType);
    }

    if (merchantId && merchantId !== 'all') {
      whereConditions.push('pr.merchant_id = ?');
      params.push(merchantId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [records] = await pool.query(`
      SELECT
        pr.id,
        pr.user_id as userId,
        u.nickname as userName,
        pr.record_type as type,
        pr.points_change as amount,
        pr.merchant_name as merchantName,
        pr.description,
        pr.created_at as createdAt
      FROM points_records pr
      LEFT JOIN users u ON pr.user_id = u.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM points_records pr 
      LEFT JOIN users u ON pr.user_id = u.id
      ${whereClause}
    `, params);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        list: records,
        pagination: { page, pageSize, total }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取积分余额（小程序） ====================
router.get('/balance', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }

    const [pointsData] = await pool.execute(
      'SELECT available_points, total_earned, total_spent FROM user_points WHERE user_id = ?',
      [req.user.id]
    );

    if (pointsData.length > 0) {
      const points = pointsData[0];
      res.json({
        success: true,
        data: {
          balance: points.available_points,
          totalEarned: points.total_earned,
          totalSpent: points.total_spent,
          expiringPoints: 0 // TODO: 实现积分过期功能
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          expiringPoints: 0
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

// ==================== 获取积分记录（小程序） ====================
router.get('/history', validatePointsHistory, async (req, res, next) => {
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
    const type = req.query.type || 'all';
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE pr.user_id = ?';
    let params = [req.user.id];

    if (type !== 'all') {
      whereClause += ' AND pr.record_type = ?';
      params.push(type);
    }

    // 优化：使用LEFT JOIN一次性获取订单金额，避免N+1查询
    const [records] = await pool.query(`
      SELECT
        pr.id,
        pr.points_change as pointsChange,
        pr.record_type as type,
        pr.related_order_id as relatedOrderId,
        pr.merchant_id as merchantId,
        pr.merchant_name as merchantName,
        pr.description,
        pr.created_at as createdAt,
        po.amount as orderAmount
      FROM points_records pr
      LEFT JOIN payment_orders po ON pr.related_order_id = po.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const enrichedRecords = records.map(record => ({
      id: record.id,
      pointsChange: record.pointsChange,
      type: record.type,
      merchantName: record.merchantName,
      orderAmount: record.orderAmount ? record.orderAmount / 100 : null,
      description: record.description,
      createdAt: record.createdAt
    }));

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM points_records pr ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        records: enrichedRecords,
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

// ==================== 获取积分统计（管理后台） ====================
router.get('/stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    // 总体统计
    const [stats] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(available_points), 0) FROM user_points) as totalAvailable,
        (SELECT COALESCE(SUM(total_earned), 0) FROM user_points) as totalEarned,
        (SELECT COALESCE(SUM(total_spent), 0) FROM user_points) as totalSpent,
        (SELECT COUNT(*) FROM points_records WHERE record_type = 'payment_reward') as rewardRecords,
        (SELECT COUNT(*) FROM points_records WHERE record_type = 'mall_consumption') as consumptionRecords,
        (SELECT COUNT(*) FROM points_records WHERE record_type = 'admin_adjust') as adminRecords
    `);

    // 每日积分发放趋势（最近30天）
    const [dailyTrends] = await pool.query(`
      SELECT
        DATE(created_at) as date,
        SUM(CASE WHEN points_change > 0 THEN points_change ELSE 0 END) as earned,
        SUM(CASE WHEN points_change < 0 THEN ABS(points_change) ELSE 0 END) as spent
      FROM points_records
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        trends: dailyTrends
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
