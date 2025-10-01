// JWT Token管理工具
const jwt = require('jsonwebtoken');
const { logSecurityEvent } = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_in_production_environment';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 生成Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      type: user.type || 'user',
      wechatId: user.wechat_id
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// 验证Token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token已过期');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('无效的Token');
    } else {
      throw error;
    }
  }
}

// 认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    logSecurityEvent('Invalid Token Attempt', {
      ip: req.ip,
      error: error.message
    });

    return res.status(403).json({
      success: false,
      message: error.message || '无效或过期的认证令牌'
    });
  }
}

// 管理员权限中间件
function requireAdmin(req, res, next) {
  if (!req.user || req.user.type !== 'admin') {
    logSecurityEvent('Unauthorized Admin Access Attempt', {
      ip: req.ip,
      userId: req.user?.id,
      userType: req.user?.type
    });

    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin
};
