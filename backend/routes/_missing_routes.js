// 临时添加缺失的路由端点
// 这些端点需要添加到对应的路由文件中

// === merchants.js 需要添加 ===
// 在文件开头添加这个路由
/*
router.get('/stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled
      FROM merchants
    `);

    res.json({
      success: true,
      data: stats[0] || { total: 0, active: 0, pending: 0, disabled: 0 }
    });
  } catch (error) {
    next(error);
  }
});
*/

// === orders.js 需要添加 ===
/*
router.get('/stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
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
*/

// === points路由需要修改挂载路径 ===
// server-optimized.js 中应该是:
// app.use('/api/v1/admin/points', authenticateToken, pointsRoutes);
// 而不是:
// app.use('/api/v1/points', authenticateToken, pointsRoutes);
