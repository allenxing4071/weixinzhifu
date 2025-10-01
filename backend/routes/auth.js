// 认证路由模块
const express = require('express');
const router = express.Router();
const { validateLogin, validateWechatLogin } = require('../middlewares/validation');
const { loginLimiter } = require('../middlewares/rateLimiter');
const { generateToken } = require('../utils/jwt');
const { logOperation, logSecurityEvent } = require('../utils/logger');

// ==================== 管理员登录 ====================
router.post('/admin/login', loginLimiter, validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // TODO: 从数据库验证管理员账户，使用bcrypt验证密码
    // const admin = await findAdminByUsername(username);
    // const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    // 临时硬编码验证（仅供测试）
    if (username === 'admin' && password === 'admin123') {
      const adminInfo = {
        id: 'admin_001',
        type: 'admin',
        username: 'admin'
      };

      const token = generateToken(adminInfo);

      logOperation('Admin Login', adminInfo.id, { username });

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          adminInfo: {
            id: adminInfo.id,
            username: 'admin',
            realName: '超级管理员'
          }
        }
      });
    } else {
      logSecurityEvent('Failed Admin Login Attempt', {
        username,
        ip: req.ip
      });

      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    next(error);
  }
});

// ==================== 小程序微信登录 ====================
router.post('/wechat-login', validateWechatLogin, async (req, res, next) => {
  try {
    const { code } = req.body;

    // TODO: 调用微信API获取openid
    // const wechatUser = await wechatService.getOpenId(code);

    // 模拟微信用户数据
    const wechatUser = {
      openid: `wx_openid_${Date.now()}`,
      nickname: '微信用户' + Math.floor(Math.random() * 1000),
      avatar: 'https://example.com/avatar.jpg'
    };

    // TODO: 从数据库查询或创建用户
    const user = {
      id: 'user_test_001',
      wechat_id: wechatUser.openid,
      nickname: wechatUser.nickname,
      avatar: wechatUser.avatar
    };

    const token = generateToken(user);

    logOperation('WeChat Login', user.id, { openid: wechatUser.openid });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          openid: user.wechat_id
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取用户信息 ====================
router.get('/user-info', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      });
    }

    // TODO: 从数据库查询用户信息
    res.json({
      success: true,
      data: {
        id: req.user.id,
        nickname: '积分测试用户',
        avatar: 'https://example.com/avatar.jpg',
        phone: '13800138001',
        openid: req.user.wechatId
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 管理员登出 ====================
router.post('/admin/logout', (req, res) => {
  if (req.user) {
    logOperation('Admin Logout', req.user.id);
  }

  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router;
