// 日志管理工具
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // 添加额外的元数据
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // 添加错误堆栈
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 写入所有日志到 combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // 写入错误日志到 error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // 写入访问日志到 access.log
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 在开发环境下，同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 请求日志中间件
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 记录请求开始
  logger.http(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(logLevel, `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
      ip: req.ip,
      userId: req.user?.id,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

// 错误日志中间件
function errorLogger(err, req, res, next) {
  logger.error(`Error in ${req.method} ${req.url}`, {
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body
  });

  next(err);
}

// 业务操作日志记录器
function logOperation(operation, userId, details = {}) {
  logger.info(`Operation: ${operation}`, {
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
}

// 安全事件日志记录器
function logSecurityEvent(event, details = {}) {
  logger.warn(`Security Event: ${event}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  logOperation,
  logSecurityEvent
};
