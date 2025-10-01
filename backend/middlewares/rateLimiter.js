// 限流中间件
const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/logger');

// API通用限流 - 每分钟100次
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('API Rate Limit Exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });

    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// 登录限流 - 每分钟5次
const loginLimiter = rateLimit({
  windowMs: 60000, // 1分钟
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  skipSuccessfulRequests: true, // 成功的请求不计数
  message: {
    success: false,
    message: '登录尝试次数过多，请5分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('Login Rate Limit Exceeded', {
      ip: req.ip,
      username: req.body?.username
    });

    res.status(429).json({
      success: false,
      message: '登录尝试次数过多，请稍后再试',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// 支付创建限流 - 每分钟10次
const paymentLimiter = rateLimit({
  windowMs: 60000, // 1分钟
  max: 10,
  message: {
    success: false,
    message: '支付创建请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('Payment Rate Limit Exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });

    res.status(429).json({
      success: false,
      message: '支付创建请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// 短信验证码限流 - 每小时10次
const smsLimiter = rateLimit({
  windowMs: 3600000, // 1小时
  max: 10,
  message: {
    success: false,
    message: '验证码发送次数过多，请1小时后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  loginLimiter,
  paymentLimiter,
  smsLimiter
};
