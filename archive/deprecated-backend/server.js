// 支付记录和积分API服务 - 模块化重构版本
// Version: 2.0.0
// 优化内容：
// - 数据库连接池化
// - SQL注入防护
// - JWT Token安全
// - 环境变量配置
// - N+1查询优化
// - 统一数据格式
// - 请求验证
// - 日志系统
// - 限流保护
// - 路由模块化

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

// 工具和中间件
const { authenticateToken } = require('./utils/jwt');
const { requestLogger, errorLogger, logger } = require('./utils/logger');
const { apiLimiter } = require('./middlewares/rateLimiter');

// 路由模块
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const merchantRoutes = require('./routes/merchants');
const orderRoutes = require('./routes/orders');
const pointsRoutes = require('./routes/points');
const paymentsRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const adminUsersRoutes = require('./routes/admin-users');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS配置
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 请求日志
app.use(requestLogger);

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

    // 将连接池存储到app.locals供路由使用
    app.locals.pool = pool;

    logger.info('✅ 数据库连接池初始化成功', {
      host: dbConfig.host,
      database: dbConfig.database,
      connectionLimit: dbConfig.connectionLimit
    });

    return true;
  } catch (error) {
    logger.error('❌ 数据库连接失败', {
      error: error.message,
      host: dbConfig.host,
      database: dbConfig.database
    });
    pool = null;
    return false;
  }
}

// ==================== 健康检查 ====================
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    if (pool) {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      dbStatus = 'connected';
    }
  } catch (error) {
    dbStatus = 'error';
    dbError = error.message;
  }

  const health = {
    success: true,
    message: '支付记录和积分API服务运行正常（模块化重构版）',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      error: dbError
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform
    },
    features: [
      '管理后台',
      '小程序API',
      '用户认证',
      '积分系统',
      '支付系统',
      '日志系统',
      '限流保护'
    ]
  };

  const statusCode = dbStatus === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ==================== API路由配置 ====================

// API限流（应用到所有API路由）
app.use('/api', apiLimiter);

// 认证路由（无需token）
app.use('/api/v1/auth', authRoutes);

// 以下路由需要认证
app.use('/api/v1/admin/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/v1/admin/users', authenticateToken, userRoutes);
app.use('/api/v1/admin/merchants', authenticateToken, merchantRoutes);
app.use('/api/v1/admin/orders', authenticateToken, orderRoutes);
app.use('/api/v1/admin/admin-users', adminUsersRoutes);

// 小程序API路由（需要认证）
app.use('/api/v1/points', authenticateToken, pointsRoutes);
app.use('/api/v1/payments', authenticateToken, paymentsRoutes);
app.use('/api/v1/orders', authenticateToken, orderRoutes);

// 公开商户查询（无需认证）
app.use('/api/v1/merchants', merchantRoutes);

// ==================== 404处理 ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.path,
    method: req.method
  });
});

// ==================== 错误处理 ====================
app.use(errorLogger);

app.use((err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : undefined
  });
});

// ==================== 优雅关闭 ====================
process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，准备关闭服务器...');

  if (pool) {
    try {
      await pool.end();
      logger.info('数据库连接池已关闭');
    } catch (error) {
      logger.error('关闭数据库连接池失败', { error: error.message });
    }
  }

  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，准备关闭服务器...');

  if (pool) {
    try {
      await pool.end();
      logger.info('数据库连接池已关闭');
    } catch (error) {
      logger.error('关闭数据库连接池失败', { error: error.message });
    }
  }

  process.exit(0);
});

// ==================== 启动服务 ====================
async function startServer() {
  try {
    const dbConnected = await initDatabase();

    if (!dbConnected) {
      logger.warn('⚠️  数据库未连接，服务将以降级模式启动');
    }

    app.listen(PORT, () => {
      logger.info(`✅ 服务器启动成功`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        allowedOrigins: allowedOrigins.join(', '),
        database: dbConnected ? 'connected' : 'disconnected'
      });

      console.log('\n===========================================');
      console.log(`🚀 支付积分API服务 v2.0.0 启动成功`);
      console.log(`📡 端口: ${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 数据库: ${dbConnected ? '✅ 已连接' : '❌ 未连接'}`);
      console.log(`🔒 CORS: ${allowedOrigins.join(', ')}`);
      console.log(`📝 健康检查: http://localhost:${PORT}/health`);
      console.log('===========================================\n');
    });
  } catch (error) {
    logger.error('❌ 服务启动失败', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// 只有直接运行此文件时才启动服务器（便于测试）
if (require.main === module) {
  startServer();
}

module.exports = app;
