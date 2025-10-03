// 支付记录和积分API服务 - 优化版本 v2.0.0
// 优化内容：
// 1. 数据库连接池化
// 2. 修复SQL注入漏洞（参数化查询）
// 3. JWT Token安全
// 4. 环境变量配置
// 5. 解决N+1查询问题
// 6. 统一数据格式（金额和字段命名）
// 7. 请求验证中间件
// 8. 限流保护
// 9. 日志系统
// 10. 模块化路由

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { logger, requestLogger, errorLogger } = require('./utils/logger');
const { authenticateToken } = require('./utils/jwt');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 请求日志
app.use(requestLogger);

// CORS配置 - 从环境变量读取允许的域名
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API通用限流
app.use('/api', apiLimiter);

// ==================== 数据库连接池 ====================
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'points_app_dev',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

let pool;

async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);

    // 测试连接
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    // 将pool挂载到app.locals，供所有路由使用
    app.locals.pool = pool;

    logger.info('✅ 数据库连接池初始化成功');
    return true;
  } catch (error) {
    logger.error('❌ 数据库连接失败:', error);
    pool = null;
    return false;
  }
}

// ==================== 健康检查 ====================
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (pool) {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'error';
  }

  res.json({
    success: true,
    message: '支付记录和积分API服务运行正常（优化版）',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    features: ['管理后台', '小程序API', '用户认证', '积分系统', '支付系统'],
    version: '2.0.0-optimized',
    uptime: process.uptime()
  });
});

// ==================== 路由模块 ====================
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
const merchantsRoutes = require('./routes/merchants');
const ordersRoutes = require('./routes/orders');
const pointsRoutes = require('./routes/points');
const paymentsRoutes = require('./routes/payments');
const adminUsersRoutes = require('./routes/admin-users');
const databaseRoutes = require('./routes/database');

// 挂载认证路由（无需Token）
app.use('/api/v1/auth', authRoutes);

// 挂载需要认证的路由
app.use('/api/v1/admin/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/v1/admin/users', authenticateToken, usersRoutes);
app.use('/api/v1/admin/merchants', authenticateToken, merchantsRoutes);
app.use('/api/v1/admin/orders', authenticateToken, ordersRoutes);
app.use('/api/v1/admin/admin-users', authenticateToken, adminUsersRoutes); // 路由内部已有requireAdmin中间件
app.use('/api/v1/admin/points', authenticateToken, pointsRoutes); // 管理后台积分管理
app.use('/api/v1/admin/database', authenticateToken, databaseRoutes); // 数据库管理(新增)
app.use('/api/v1/payments', authenticateToken, paymentsRoutes);

// ==================== 404处理 ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.path
  });
});

// ==================== 错误处理 ====================
app.use(errorLogger);
app.use((err, req, res, next) => {
  logger.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message,
    errorCode: err.errorCode || null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== 启动服务 ====================
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      logger.info(`✅ 服务器启动成功，端口: ${PORT}`);
      logger.info(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔒 CORS允许来源: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    logger.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 优雅退出处理
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，开始优雅退出');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，开始优雅退出');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

startServer();

module.exports = app;
