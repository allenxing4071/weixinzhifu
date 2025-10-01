// 仪表盘路由模块
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../utils/jwt');

// 所有仪表盘接口需要管理员权限
router.use(requireAdmin);

// ==================== 获取仪表盘统计数据 ====================
router.get('/stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const connection = await pool.getConnection();

    try {
      // 查询所有统计数据（优化：一次性获取，避免多次查询）
      const [stats] = await connection.query(`
        SELECT
          (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE status = 'paid') as totalUsers,
          (SELECT COUNT(*) FROM merchants WHERE status = 'active') as activeMerchants,
          (SELECT COUNT(*) FROM payment_orders WHERE status = 'paid') as totalOrders,
          (SELECT COALESCE(SUM(amount), 0) FROM payment_orders WHERE status = 'paid') as totalAmount,
          (SELECT COALESCE(SUM(available_points), 0) FROM user_points) as totalPoints,
          (SELECT COALESCE(SUM(points_awarded), 0) FROM payment_orders
           WHERE status = 'paid' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as monthlyPoints
      `);

      // 今日数据
      const [todayStats] = await connection.query(`
        SELECT
          (SELECT COUNT(*) FROM payment_orders WHERE DATE(created_at) = CURDATE() AND status = 'paid') as orders,
          (SELECT COALESCE(SUM(amount), 0) FROM payment_orders WHERE DATE(created_at) = CURDATE() AND status = 'paid') as revenue,
          (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE DATE(created_at) = CURDATE()) as newUsers,
          (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE DATE(created_at) = CURDATE() AND status = 'paid') as activeUsers,
          (SELECT COUNT(*) FROM merchants WHERE DATE(created_at) = CURDATE()) as newMerchants
      `);

      // 最近7天交易趋势
      const [weeklyTrends] = await connection.query(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as orders,
          SUM(amount) as revenue
        FROM payment_orders
        WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      // 商户类别分布
      const [categoryStats] = await connection.query(`
        SELECT
          m.business_category as category,
          COUNT(DISTINCT m.id) as count,
          COALESCE(SUM(o.amount), 0) as total_revenue
        FROM merchants m
        LEFT JOIN payment_orders o ON m.id = o.merchant_id AND o.status = 'paid'
        WHERE m.status = 'active'
        GROUP BY m.business_category
        ORDER BY total_revenue DESC
        LIMIT 10
      `);

      // 最新订单（最近5笔）- 优化：一次JOIN查询
      const [recentOrders] = await connection.query(`
        SELECT
          o.id,
          o.amount,
          o.points_awarded as pointsAwarded,
          o.merchant_name as merchantName,
          o.status,
          o.created_at as createdAt,
          u.nickname as userNickname
        FROM payment_orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);

      // 待处理商户申请
      const [pendingMerchants] = await connection.query(`
        SELECT
          id,
          merchant_name as name,
          contact_person as contactPerson,
          contact_phone as contactPhone,
          business_category as category,
          created_at as createdAt
        FROM merchants
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT 5
      `);

      const overview = stats[0];
      const today = todayStats[0];

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers: overview.totalUsers || 0,
            activeMerchants: overview.activeMerchants || 0,
            monthlyRevenue: overview.totalAmount / 100 || 0,
            monthlyOrders: overview.totalOrders || 0,
            monthlyPoints: overview.monthlyPoints || 0,
            totalPoints: overview.totalPoints || 0
          },
          today: {
            orders: today.orders || 0,
            revenue: today.revenue / 100 || 0,
            newUsers: today.newUsers || 0,
            activeUsers: today.activeUsers || 0,
            newMerchants: today.newMerchants || 0
          },
          trends: {
            weekly: weeklyTrends.map(item => ({
              date: item.date,
              orders: item.orders,
              revenue: item.revenue / 100
            })),
            merchantCategories: categoryStats.map(item => ({
              category: item.category || '未分类',
              count: item.count,
              revenue: item.total_revenue / 100 || 0
            }))
          },
          quickAccess: {
            recentOrders: recentOrders.map(order => ({
              id: order.id,
              amount: order.amount / 100,
              pointsAwarded: order.pointsAwarded,
              merchantName: order.merchantName,
              userNickname: order.userNickname || '未知用户',
              status: order.status,
              createdAt: order.createdAt
            })),
            pendingMerchants: pendingMerchants
          },
          system: {
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime(),
            lastUpdated: new Date().toISOString()
          }
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

// ==================== 获取实时数据（轮询使用） ====================
router.get('/realtime', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    // 今日实时数据
    const [realtime] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM payment_orders WHERE DATE(created_at) = CURDATE() AND status = 'paid') as todayOrders,
        (SELECT COALESCE(SUM(amount), 0) FROM payment_orders WHERE DATE(created_at) = CURDATE() AND status = 'paid') as todayRevenue,
        (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE DATE(created_at) = CURDATE() AND status = 'paid') as todayActiveUsers,
        (SELECT COUNT(*) FROM payment_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) as last5MinOrders
    `);

    res.json({
      success: true,
      data: {
        ...realtime[0],
        todayRevenue: realtime[0].todayRevenue / 100,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
