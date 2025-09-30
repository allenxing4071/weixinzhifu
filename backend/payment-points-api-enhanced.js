// 支付记录和积分API服务 - 最终修复版
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 数据库连接配置
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'points_app_dev',
  charset: 'utf8mb4'
};

let dbConnection;

// 初始化数据库连接
async function initDatabase() {
  try {
    dbConnection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功 (127.0.0.1:3306)');
    
    const [testResult] = await dbConnection.execute('SELECT 1 as test');
    console.log('✅ 数据库测试查询成功:', testResult[0]);
    
    return dbConnection;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    dbConnection = null;
    return null;
  }
}

// Token验证
function generateToken(user) {
  return `token_${user.id}_${Date.now()}`;
}

function verifyToken(token) {
  if (token && token.startsWith('token_')) {
    return { id: 'user_test_001', wechatId: 'wx_test_001' };
  }
  return null;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ success: false, message: '无效的认证令牌' });
  }

  req.user = user;
  next();
}

// 积分计算函数
function calculatePoints(amount, merchantId) {
  const basePoints = Math.floor(amount / 100 * 0.1);
  return Math.max(basePoints, 1);
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '支付记录和积分API服务运行正常（最终版）',
    timestamp: new Date().toISOString(),
    database: dbConnection ? '已连接' : '离线模式',
    features: ['管理后台', '小程序API', '用户认证', '积分系统', '支付系统', '支付记录', '积分记录']
  });
});

// =====================
// 管理后台API
// =====================

app.post('/api/v1/admin/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    const token = generateToken({ id: 'admin_001', type: 'admin' });
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        adminInfo: {
          id: 'admin_001',
          username: 'admin',
          realName: '超级管理员'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

app.get('/api/v1/admin/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1250,
      totalMerchants: 5,
      totalOrders: 3420,
      totalPoints: 156780,
      dailyStats: {
        newUsers: 12,
        newOrders: 45,
        pointsAwarded: 2300
      }
    }
  });
});

// =====================
// 小程序API
// =====================

app.post('/api/v1/auth/wechat-login', async (req, res) => {
  const { code } = req.body;
  
  console.log('🔑 微信登录请求, code:', code);
  
  const wechatUser = {
    openid: `wx_openid_${Date.now()}`,
    nickname: '微信用户' + Math.floor(Math.random() * 1000),
    avatar: 'https://example.com/avatar.jpg'
  };
  
  const user = {
    id: 'user_test_001',
    wechat_id: wechatUser.openid,
    nickname: wechatUser.nickname,
    avatar: wechatUser.avatar
  };
  
  const token = generateToken(user);
  
  console.log('✅ 微信登录成功:', user.nickname);
  
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
});

app.get('/api/v1/auth/user-info', authenticateToken, (req, res) => {
  console.log('👤 获取用户信息请求, userId:', req.user.id);
  
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
});

// =====================
// 积分系统API
// =====================

app.get('/api/v1/points/balance', authenticateToken, async (req, res) => {
  console.log('💰 获取积分余额请求, userId:', req.user.id);
  
  try {
    if (dbConnection) {
      const [pointsData] = await dbConnection.execute(
        'SELECT available_points, total_earned, total_spent FROM user_points WHERE user_id = ?',
        [req.user.id]
      );
      
      if (pointsData.length > 0) {
        const points = pointsData[0];
        console.log('✅ 真实积分数据:', points);
        
        res.json({
          success: true,
          data: {
            balance: points.available_points,
            totalEarned: points.total_earned,
            totalSpent: points.total_spent,
            expiringPoints: 0
          }
        });
      } else {
        res.json({
          success: true,
          data: { balance: 0, totalEarned: 0, totalSpent: 0, expiringPoints: 0 }
        });
      }
    } else {
      console.log('⚠️ 数据库离线，使用模拟数据');
      res.json({
        success: true,
        data: { balance: 1288, totalEarned: 2000, totalSpent: 712, expiringPoints: 50 }
      });
    }
  } catch (error) {
    console.error('获取积分余额错误:', error);
    res.status(500).json({ success: false, message: '获取积分余额失败' });
  }
});

app.get('/api/v1/points/history', authenticateToken, async (req, res) => {
  const { page = 1, pageSize = 20, type = 'all' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  console.log('📋 获取积分历史请求, userId:', req.user.id);
  
  try {
    if (dbConnection) {
      let whereClause = 'WHERE user_id = ?';
      let params = [req.user.id];
      
      if (type !== 'all') {
        whereClause += ' AND record_type = ?';
        params.push(type);
      }
      
      const [records] = await dbConnection.execute(
        `SELECT id, points_change, record_type, related_order_id, merchant_id, merchant_name, description, created_at 
         FROM points_records ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
      
      console.log(`✅ 查询到 ${records.length} 条积分记录`);
      
      // 为每条记录添加支付金额信息
      const enrichedRecords = [];
      for (const record of records) {
        let orderAmount = null;
        if (record.related_order_id) {
          const [orderData] = await dbConnection.execute(
            'SELECT amount FROM payment_orders WHERE id = ?',
            [record.related_order_id]
          );
          if (orderData.length > 0) {
            orderAmount = orderData[0].amount / 100;
          }
        }
        
        enrichedRecords.push({
          id: record.id,
          pointsChange: record.points_change,
          type: record.record_type,
          merchantName: record.merchant_name,
          orderAmount: orderAmount,
          description: record.description,
          createdAt: record.created_at
        });
      }
      
      const [countResult] = await dbConnection.execute(
        `SELECT COUNT(*) as total FROM points_records ${whereClause}`,
        params
      );
      
      res.json({
        success: true,
        data: {
          records: enrichedRecords,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: countResult[0].total
          }
        }
      });
    } else {
      console.log('⚠️ 数据库离线，使用模拟数据');
      const mockRecords = [
        {
          id: 'record_001',
          pointsChange: 50,
          type: 'payment_reward',
          merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
          orderAmount: 500.00,
          description: '在仁寿县怀仁街道云锦汇会所消费获得积分',
          createdAt: '2025-09-26T10:30:00Z'
        }
      ];
      
      res.json({
        success: true,
        data: {
          records: mockRecords,
          pagination: { page: 1, pageSize: 20, total: 1 }
        }
      });
    }
  } catch (error) {
    console.error('获取积分历史错误:', error);
    res.status(500).json({ success: false, message: '获取积分历史失败' });
  }
});

// =====================
// 支付记录API（修复SQL参数）
// =====================

app.get('/api/v1/payments/history', authenticateToken, async (req, res) => {
  const { page = 1, pageSize = 20, merchantId, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  
  console.log('💳 获取支付记录请求, userId:', req.user.id);
  
  try {
    if (dbConnection) {
      let whereClause = 'WHERE user_id = ?';
      let params = [req.user.id];
      
      if (merchantId) {
        whereClause += ' AND merchant_id = ?';
        params.push(merchantId);
      }
      
      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }
      
      // 修复：先查询记录，再查询总数
      const [records] = await dbConnection.execute(
        `SELECT id, merchant_id, merchant_name, merchant_category, amount, points_awarded, status, paid_at, created_at 
         FROM payment_orders ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
        params
      );
      
      console.log(`✅ 查询到 ${records.length} 条支付记录`);
      
      const formattedRecords = records.map(record => ({
        orderId: record.id,
        merchantId: record.merchant_id,
        merchantName: record.merchant_name,
        merchantCategory: record.merchant_category,
        amount: record.amount / 100,
        pointsEarned: record.points_awarded,
        status: record.status,
        paidAt: record.paid_at,
        createdAt: record.created_at
      }));
      
      const [countResult] = await dbConnection.execute(
        `SELECT COUNT(*) as total FROM payment_orders ${whereClause}`,
        params
      );
      
      res.json({
        success: true,
        data: {
          records: formattedRecords,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total: countResult[0].total
          }
        }
      });
    } else {
      console.log('⚠️ 数据库离线，使用模拟数据');
      res.json({
        success: true,
        data: {
          records: [],
          pagination: { page: 1, pageSize: 20, total: 0 }
        }
      });
    }
  } catch (error) {
    console.error('获取支付记录错误:', error);
    res.status(500).json({ success: false, message: '获取支付记录失败' });
  }
});

app.get('/api/v1/payments/merchant-stats', authenticateToken, async (req, res) => {
  console.log('📊 获取商户消费统计, userId:', req.user.id);
  
  try {
    if (dbConnection) {
      const [stats] = await dbConnection.execute(
        `SELECT 
          merchant_id, 
          merchant_name, 
          merchant_category,
          COUNT(*) as order_count,
          SUM(amount) as total_amount,
          SUM(points_awarded) as total_points,
          MAX(paid_at) as last_visit
         FROM payment_orders 
         WHERE user_id = ? AND status = 'paid'
         GROUP BY merchant_id, merchant_name, merchant_category
         ORDER BY total_amount DESC`,
        [req.user.id]
      );
      
      console.log(`✅ 查询到 ${stats.length} 个商户的统计数据`);
      
      const formattedStats = stats.map(stat => ({
        merchantId: stat.merchant_id,
        merchantName: stat.merchant_name,
        merchantCategory: stat.merchant_category,
        orderCount: stat.order_count,
        totalAmount: stat.total_amount / 100,
        totalPoints: stat.total_points,
        lastVisit: stat.last_visit
      }));
      
      const summary = {
        totalMerchants: formattedStats.length,
        totalAmount: formattedStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
        totalOrders: formattedStats.reduce((sum, stat) => sum + stat.orderCount, 0),
        totalPoints: formattedStats.reduce((sum, stat) => sum + stat.totalPoints, 0)
      };
      
      res.json({
        success: true,
        data: {
          merchantGroups: formattedStats,
          summary: summary
        }
      });
    } else {
      console.log('⚠️ 数据库离线，使用模拟数据');
      res.json({
        success: true,
        data: {
          merchantGroups: [],
          summary: { totalMerchants: 0, totalAmount: 0, totalOrders: 0, totalPoints: 0 }
        }
      });
    }
  } catch (error) {
    console.error('获取商户统计错误:', error);
    res.status(500).json({ success: false, message: '获取商户统计失败' });
  }
});

// =====================
// 支付系统API
// =====================

app.post('/api/v1/payments/create', authenticateToken, async (req, res) => {
  const { merchantId, amount, description = '商户收款' } = req.body;
  
  console.log('💳 创建支付订单请求, userId:', req.user.id, 'merchantId:', merchantId, 'amount:', amount);
  
  try {
    if (dbConnection) {
      const [merchantData] = await dbConnection.execute(
        'SELECT id, merchant_name, business_category FROM merchants WHERE id = ?',
        [merchantId]
      );
      
      if (merchantData.length === 0) {
        return res.status(404).json({ success: false, message: '商户不存在' });
      }
      
      const merchant = merchantData[0];
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const pointsAwarded = calculatePoints(amount, merchantId);
      
      await dbConnection.execute(
        `INSERT INTO payment_orders 
         (id, user_id, merchant_id, merchant_name, merchant_category, amount, points_awarded, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [orderId, req.user.id, merchantId, merchant.merchant_name, merchant.business_category, amount, pointsAwarded]
      );
      
      const paymentData = {
        orderId: orderId,
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        nonceStr: Math.random().toString(36).substring(2, 15),
        packageStr: `prepay_id=wx${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
        signType: 'RSA',
        paySign: 'mock_pay_sign_' + Math.random().toString(36).substring(2, 15),
        expectedPoints: pointsAwarded,
        merchantName: merchant.merchant_name
      };
      
      console.log('✅ 支付订单创建成功:', orderId, '预计积分:', pointsAwarded);
      
      res.json({
        success: true,
        message: '支付订单创建成功',
        data: paymentData
      });
    } else {
      res.json({
        success: true,
        message: '支付订单创建成功（测试模式）',
        data: {
          orderId: `order_test_${Date.now()}`,
          timeStamp: Math.floor(Date.now() / 1000).toString(),
          nonceStr: 'test_nonce_str',
          packageStr: 'prepay_id=test_prepay_id',
          signType: 'RSA',
          paySign: 'test_pay_sign',
          expectedPoints: 10,
          merchantName: '测试商户'
        }
      });
    }
  } catch (error) {
    console.error('创建支付订单错误:', error);
    res.status(500).json({ success: false, message: '创建支付订单失败' });
  }
});

app.post('/api/v1/payments/mock-success', authenticateToken, async (req, res) => {
  const { orderId } = req.body;
  
  console.log('🎉 模拟支付成功回调, orderId:', orderId);
  
  try {
    if (dbConnection) {
      const [updateResult] = await dbConnection.execute(
        'UPDATE payment_orders SET status = "paid", paid_at = NOW() WHERE id = ? AND user_id = ?',
        [orderId, req.user.id]
      );
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '订单不存在或权限不足' });
      }
      
      const [orderData] = await dbConnection.execute(
        'SELECT * FROM payment_orders WHERE id = ?',
        [orderId]
      );
      
      const order = orderData[0];
      
      const pointsRecordId = `points_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await dbConnection.execute(
        `INSERT INTO points_records 
         (id, user_id, points_change, record_type, related_order_id, merchant_id, merchant_name, description) 
         VALUES (?, ?, ?, 'payment_reward', ?, ?, ?, ?)`,
        [
          pointsRecordId,
          order.user_id,
          order.points_awarded,
          order.id,
          order.merchant_id,
          order.merchant_name,
          `在${order.merchant_name}消费获得积分`
        ]
      );
      
      await dbConnection.execute(
        `UPDATE user_points 
         SET available_points = available_points + ?, 
             total_earned = total_earned + ? 
         WHERE user_id = ?`,
        [order.points_awarded, order.points_awarded, order.user_id]
      );
      
      console.log('✅ 支付成功处理完成, 积分已发放:', order.points_awarded);
      
      res.json({
        success: true,
        message: '支付成功，积分已发放',
        data: {
          orderId: order.id,
          pointsAwarded: order.points_awarded,
          merchantName: order.merchant_name
        }
      });
    } else {
      res.json({
        success: true,
        message: '支付成功（测试模式）',
        data: { pointsAwarded: 10 }
      });
    }
  } catch (error) {
    console.error('支付成功回调错误:', error);
    res.status(500).json({ success: false, message: '支付回调处理失败' });
  }
});

// =====================
// 商户查询API
// =====================

app.get('/api/v1/merchants/:id', async (req, res) => {
  const { id } = req.params;
  
  console.log('🏪 获取商户信息请求, merchantId:', id);
  
  try {
    if (dbConnection) {
      const [merchants] = await dbConnection.execute(
        'SELECT id, merchant_name, sub_mch_id, business_category, status FROM merchants WHERE id = ?',
        [id]
      );
      
      if (merchants.length > 0) {
        const merchant = merchants[0];
        res.json({
          success: true,
          data: {
            id: merchant.id,
            name: merchant.merchant_name,
            subMchId: merchant.sub_mch_id,
            businessCategory: merchant.business_category,
            status: merchant.status
          }
        });
      } else {
        res.status(404).json({ success: false, message: '商户不存在' });
      }
    } else {
      const mockMerchants = {
        'merchant_real_001': {
          id: 'merchant_real_001',
          name: '仁寿县怀仁街道云锦汇会所（个体工商户）',
          subMchId: '1900138001',
          businessCategory: '休闲娱乐',
          status: 'active'
        }
      };
      
      const merchant = mockMerchants[id];
      if (merchant) {
        res.json({ success: true, data: merchant });
      } else {
        res.status(404).json({ success: false, message: '商户不存在' });
      }
    }
  } catch (error) {
    console.error('获取商户信息错误:', error);
    res.status(500).json({ success: false, message: '获取商户信息失败' });
  }
});

// ==================== 管理后台 - 商户管理API ====================
app.get('/api/v1/admin/merchants', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const offset = (page - 1) * pageSize;
    
    const [merchants] = await dbConnection.query(
      'SELECT id, merchant_name as name, merchant_no as wechatMchId, qr_code as qrCode, status, created_at as createdAt, updated_at as updatedAt FROM merchants ORDER BY created_at DESC LIMIT ' + pageSize + ' OFFSET ' + offset
    );
    const [total] = await dbConnection.query('SELECT COUNT(*) as count FROM merchants');
    
    res.json({ 
      success: true, 
      data: merchants,
      pagination: {
        page,
        pageSize,
        total: total[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取商户列表失败', error: error.message });
  }
});

app.get('/api/v1/admin/merchants/stats', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const [stats] = await dbConnection.execute(
      'SELECT COUNT(*) as total, SUM(status = "active") as active, SUM(status = "inactive") as inactive FROM merchants'
    );
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取商户统计失败', error: error.message });
  }
});

app.get('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const [merchants] = await dbConnection.execute(
      'SELECT * FROM merchants WHERE id = ?',
      [req.params.id]
    );
    if (merchants.length === 0) {
      return res.status(404).json({ success: false, message: '商户不存在' });
    }
    res.json({ success: true, data: merchants[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取商户详情失败', error: error.message });
  }
});

app.post('/api/v1/admin/merchants', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const { name, wechatMchId, qrCode } = req.body;
    const [result] = await dbConnection.execute(
      'INSERT INTO merchants (name, wechatMchId, qrCode, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [name, wechatMchId, qrCode, 'active']
    );
    res.json({ success: true, data: { id: result.insertId, message: '商户创建成功' } });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建商户失败', error: error.message });
  }
});

app.put('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const { name, wechatMchId, qrCode, status } = req.body;
    await dbConnection.execute(
      'UPDATE merchants SET name = ?, wechatMchId = ?, qrCode = ?, status = ?, updatedAt = NOW() WHERE id = ?',
      [name, wechatMchId, qrCode, status, req.params.id]
    );
    res.json({ success: true, message: '商户更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新商户失败', error: error.message });
  }
});

app.delete('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    await dbConnection.execute('DELETE FROM merchants WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '商户删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除商户失败', error: error.message });
  }
});

// ==================== 管理后台 - 订单管理API ====================
app.get('/api/v1/admin/orders', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    
    const [orders] = await dbConnection.query(
      'SELECT id, user_id as userId, merchant_id as merchantId, merchant_name as merchantName, amount, points_awarded as pointsAwarded, payment_method as paymentMethod, status, wechat_order_id as wechatOrderId, paid_at as paidAt, created_at as createdAt, updated_at as updatedAt FROM payment_orders ORDER BY created_at DESC LIMIT ' + pageSize + ' OFFSET ' + offset
    );
    const [total] = await dbConnection.query('SELECT COUNT(*) as count FROM payment_orders');
    
    res.json({ 
      success: true, 
      data: orders,
      pagination: {
        page,
        pageSize,
        total: total[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取订单列表失败', error: error.message });
  }
});

app.get('/api/v1/admin/orders/stats', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const [stats] = await dbConnection.execute(
      'SELECT COUNT(*) as total, SUM(amount) as totalAmount, SUM(status = "paid") as successCount FROM payment_orders'
    );
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取订单统计失败', error: error.message });
  }
});

app.get('/api/v1/admin/orders/:id', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const [orders] = await dbConnection.execute(
      'SELECT * FROM payment_orders WHERE id = ?',
      [req.params.id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    res.json({ success: true, data: orders[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取订单详情失败', error: error.message });
  }
});

// ==================== 管理后台 - 用户管理API ====================
app.get('/api/v1/admin/users', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const offset = (page - 1) * pageSize;
    
    const [users] = await dbConnection.query(
      'SELECT u.id, u.wechat_id as wechatId, u.nickname, u.avatar as avatarUrl, COALESCE(up.available_points, 0) as totalPoints, u.created_at as createdAt, u.updated_at as updatedAt FROM users u LEFT JOIN user_points up ON u.id = up.user_id ORDER BY u.created_at DESC LIMIT ' + pageSize + ' OFFSET ' + offset
    );
    const [total] = await dbConnection.query('SELECT COUNT(*) as count FROM users');
    
    res.json({ 
      success: true, 
      data: users,
      pagination: {
        page,
        pageSize,
        total: total[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户列表失败', error: error.message });
  }
});

app.get('/api/v1/admin/users/:id', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const [users] = await dbConnection.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户详情失败', error: error.message });
  }
});

// ==================== 管理后台 - 积分管理API ====================
app.get('/api/v1/admin/points', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    
    const [points] = await dbConnection.query(
      'SELECT id, user_id as userId, points_change as pointsChange, record_type as recordType, related_order_id as relatedOrderId, merchant_id as merchantId, merchant_name as merchantName, description, created_at as createdAt FROM points_records ORDER BY created_at DESC LIMIT ' + pageSize + ' OFFSET ' + offset
    );
    const [total] = await dbConnection.query('SELECT COUNT(*) as count FROM points_records');
    
    res.json({ 
      success: true, 
      data: points,
      pagination: {
        page,
        pageSize,
        total: total[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取积分记录失败', error: error.message });
  }
});

// ==================== 管理后台 - 管理员用户管理API ====================
app.get('/api/v1/admin/admin-users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // 模拟数据
    const adminUsers = [
      {
        id: 'admin-1',
        username: 'admin',
        realName: '超级管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        status: 'active',
        roleCode: 'super_admin',
        roleName: '超级管理员',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }
    ];
    
    res.json({ 
      success: true, 
      data: adminUsers,
      pagination: {
        page,
        pageSize,
        total: adminUsers.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取管理员列表失败', error: error.message });
  }
});

// 启动服务
async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log('🚀 支付记录和积分API服务启动成功（增强版）');
      console.log(`📊 管理后台API: http://localhost:${PORT}/api/v1/admin/`);
      console.log(`📱 小程序API: http://localhost:${PORT}/api/v1/`);
      console.log(`💳 支付记录API: http://localhost:${PORT}/api/v1/payments/`);
      console.log(`💰 积分记录API: http://localhost:${PORT}/api/v1/points/`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

startServer();
