// 支付记录和积分API服务 - 最终修复版
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件 - 增加请求体大小限制到 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
    
    const [testResult] = await dbConnection.execute('SELECT 1 as test');
    
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

// 积分计算函数：1元=1分，小数舍去
function calculatePoints(amount, merchantId) {
  // amount是以分为单位，除以100得到元，向下取整得到积分
  // 例：1234分(¥12.34) → 12积分
  return Math.floor(amount / 100);
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

app.get('/api/v1/admin/dashboard/stats', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    
    // 查询统计数据
    const [usersCount] = await dbConnection.query('SELECT COUNT(DISTINCT user_id) as count FROM payment_orders WHERE status = "paid"');
    const [merchantsCount] = await dbConnection.query('SELECT COUNT(*) as count FROM merchants WHERE status = "active"');
    const [ordersCount] = await dbConnection.query('SELECT COUNT(*) as count FROM payment_orders WHERE status = "paid"');
    const [totalAmount] = await dbConnection.query('SELECT SUM(amount) as total FROM payment_orders WHERE status = "paid"');
    const [totalPoints] = await dbConnection.query('SELECT SUM(available_points) as total FROM user_points');
    
    // 本月积分发放总数
    const [monthlyPoints] = await dbConnection.query('SELECT SUM(points_awarded) as total FROM payment_orders WHERE status = "paid" AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())');
    
    // 今日数据
    const today = new Date().toISOString().split('T')[0];
    const [todayOrders] = await dbConnection.query('SELECT COUNT(*) as count FROM payment_orders WHERE DATE(created_at) = ? AND status = "paid"', [today]);
    const [todayAmount] = await dbConnection.query('SELECT SUM(amount) as total FROM payment_orders WHERE DATE(created_at) = ? AND status = "paid"', [today]);
    const [todayNewUsers] = await dbConnection.query('SELECT COUNT(DISTINCT user_id) as count FROM payment_orders WHERE DATE(created_at) = ?', [today]);
    const [todayActiveUsers] = await dbConnection.query('SELECT COUNT(DISTINCT user_id) as count FROM payment_orders WHERE DATE(created_at) = ? AND status = "paid"', [today]);
    const [todayNewMerchants] = await dbConnection.query('SELECT COUNT(*) as count FROM merchants WHERE DATE(created_at) = ?', [today]);
    
    // 最近7天交易趋势
    const [weeklyTrends] = await dbConnection.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(amount) as revenue
      FROM payment_orders 
      WHERE status = "paid" AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    
    // 商户类别分布
    const [categoryStats] = await dbConnection.query(`
      SELECT 
        m.business_category as category,
        COUNT(DISTINCT m.id) as count,
        COALESCE(SUM(o.amount), 0) as total_revenue
      FROM merchants m
      LEFT JOIN payment_orders o ON CAST(m.id AS CHAR) = CAST(o.merchant_id AS CHAR) AND o.status = "paid"
      WHERE m.status = "active"
      GROUP BY m.business_category
      ORDER BY total_revenue DESC
    `);
    
    // 最新订单（最近5笔）
    const [recentOrders] = await dbConnection.query(`
      SELECT 
        o.id,
        o.amount,
        o.points_awarded as pointsAwarded,
        o.merchant_name as merchantName,
        o.status,
        o.created_at as createdAt,
        u.nickname as userNickname
      FROM payment_orders o
      LEFT JOIN users u ON CAST(o.user_id AS CHAR) = CAST(u.id AS CHAR)
      ORDER BY o.created_at DESC
      LIMIT 5
    `);
    
    // 待处理商户申请
    const [pendingMerchants] = await dbConnection.query(`
      SELECT 
        id,
        merchant_name as name,
        contact_person as contactPerson,
        contact_phone as contactPhone,
        business_category as category,
        created_at as createdAt
      FROM merchants
      WHERE status = "pending"
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: usersCount[0].count || 0,
          activeMerchants: merchantsCount[0].count || 0,
          monthlyRevenue: (totalAmount[0].total || 0) / 100,
          monthlyOrders: ordersCount[0].count || 0,
          monthlyPoints: monthlyPoints[0].total || 0,
          totalPoints: totalPoints[0].total || 0
        },
        today: {
          orders: todayOrders[0].count || 0,
          revenue: (todayAmount[0].total || 0) / 100,
          newUsers: todayNewUsers[0].count || 0,
          activeUsers: todayActiveUsers[0].count || 0,
          newMerchants: todayNewMerchants[0].count || 0
        },
        trends: {
          weekly: weeklyTrends.map(item => ({
            date: item.date,
            orders: item.orders,
            revenue: item.revenue
          })),
          merchantCategories: categoryStats.map(item => ({
            category: item.category || '未分类',
            count: item.count,
            revenue: (item.total_revenue || 0) / 100
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
          pendingMerchants: pendingMerchants.map(merchant => ({
            id: merchant.id,
            name: merchant.name,
            contactPerson: merchant.contactPerson,
            contactPhone: merchant.contactPhone,
            category: merchant.category,
            createdAt: merchant.createdAt
          }))
        },
        system: {
          status: 'healthy',
          database: 'connected',
          uptime: process.uptime(),
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ success: false, message: '获取仪表盘数据失败', error: error.message });
  }
});

// =====================
// 小程序API
// =====================

app.post('/api/v1/auth/wechat-login', async (req, res) => {
  const { code } = req.body;
  
  
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
  
  try {
    if (dbConnection) {
      const [pointsData] = await dbConnection.execute(
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
    
    // 获取商户列表及统计数据
    const [merchants] = await dbConnection.query(`
      SELECT 
        m.id, 
        m.merchant_name as name, 
        m.merchant_no as wechatMchId, 
        m.business_category as category,
        m.contact_person as contactPerson,
        m.contact_phone as contactPhone,
        m.qr_code as qrCode, 
        m.status, 
        m.created_at as createdAt, 
        m.updated_at as updatedAt,
        COUNT(DISTINCT o.user_id) as userCount,
        COUNT(CASE WHEN o.status='paid' THEN 1 END) as orderCount,
        COALESCE(SUM(CASE WHEN o.status='paid' THEN o.amount ELSE 0 END), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN o.status='paid' THEN o.points_awarded ELSE 0 END), 0) as totalPoints
      FROM merchants m
      LEFT JOIN payment_orders o ON CAST(m.id AS CHAR) = CAST(o.merchant_id AS CHAR)
      GROUP BY m.id, m.merchant_name, m.merchant_no, m.business_category, m.contact_person, m.contact_phone, m.qr_code, m.status, m.created_at, m.updated_at
      ORDER BY totalAmount DESC, m.created_at DESC 
      LIMIT ${pageSize} OFFSET ${offset}
    `);
    
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
    console.error('获取商户列表失败:', error);
    res.status(500).json({ success: false, message: '获取商户列表失败', error: error.message });
  }
});

app.get('/api/v1/admin/merchants/stats', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    const [stats] = await dbConnection.execute(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status = "inactive" THEN 1 ELSE 0 END) as inactive, SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending FROM merchants'
    );
    
    // 强制转换为数字
    const result = {
      total: parseInt(stats[0].total) || 0,
      active: parseInt(stats[0].active) || 0,
      inactive: parseInt(stats[0].inactive) || 0,
      pending: parseInt(stats[0].pending) || 0
    };
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取商户统计失败:', error);
    res.status(500).json({ success: false, message: '获取商户统计失败', error: error.message });
  }
});

app.get('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    
    const merchantId = req.params.id;
    
    // 获取商户基本信息
    const [merchants] = await dbConnection.execute(
      'SELECT * FROM merchants WHERE id = ?',
      [merchantId]
    );
    
    if (merchants.length === 0) {
      return res.status(404).json({ success: false, message: '商户不存在' });
    }
    
    // 获取商户统计数据
    const [stats] = await dbConnection.execute(`
      SELECT 
        COUNT(DISTINCT user_id) as userCount,
        COUNT(CASE WHEN status='paid' THEN 1 END) as paidOrders,
        COUNT(CASE WHEN status='pending' THEN 1 END) as pendingOrders,
        COUNT(CASE WHEN status='cancelled' THEN 1 END) as cancelledOrders,
        COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN status='paid' THEN points_awarded ELSE 0 END), 0) as totalPoints
      FROM payment_orders
      WHERE merchant_id = ?
    `, [merchantId]);
    
    // 获取最近10笔订单
    const [recentOrders] = await dbConnection.execute(`
      SELECT 
        o.id,
        o.user_id as userId,
        u.nickname as userNickname,
        o.amount,
        o.points_awarded as pointsAwarded,
        o.status,
        o.created_at as createdAt,
        o.paid_at as paidAt
      FROM payment_orders o
      LEFT JOIN users u ON CAST(o.user_id AS CHAR) = CAST(u.id AS CHAR)
      WHERE o.merchant_id = ?
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [merchantId]);
    
    // 获取消费用户TOP10
    const [topUsers] = await dbConnection.execute(`
      SELECT 
        u.id as userId,
        u.nickname,
        COUNT(*) as orderCount,
        COALESCE(SUM(CASE WHEN o.status='paid' THEN o.amount ELSE 0 END), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN o.status='paid' THEN o.points_awarded ELSE 0 END), 0) as totalPoints
      FROM payment_orders o
      LEFT JOIN users u ON CAST(o.user_id AS CHAR) = CAST(u.id AS CHAR)
      WHERE o.merchant_id = ? AND o.status='paid'
      GROUP BY u.id, u.nickname
      ORDER BY totalAmount DESC
      LIMIT 10
    `, [merchantId]);
    
    res.json({ 
      success: true, 
      data: {
        ...merchants[0],
        stats: stats[0],
        recentOrders: recentOrders,
        topUsers: topUsers
      }
    });
  } catch (error) {
    console.error('获取商户详情失败:', error);
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
    
    // 获取搜索和筛选参数
    const { status, merchantId, search, dateFrom, dateTo } = req.query;
    
    // 构建WHERE条件
    let whereConditions = [];
    let queryParams = [];
    
    if (status) {
      whereConditions.push('o.status = ?');
      queryParams.push(status);
    }
    
    if (merchantId) {
      whereConditions.push('CAST(o.merchant_id AS CHAR) = ?');
      queryParams.push(merchantId);
    }
    
    if (search) {
      whereConditions.push('(CAST(o.id AS CHAR) LIKE ? OR m.merchant_name LIKE ? OR u.nickname LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (dateFrom) {
      whereConditions.push('o.created_at >= ?');
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      whereConditions.push('o.created_at <= ?');
      queryParams.push(dateTo + ' 23:59:59');
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // 查询订单列表（带用户和商户信息）
    const [orders] = await dbConnection.query(`
      SELECT 
        o.id,
        o.user_id as userId,
        o.merchant_id as merchantId,
        o.merchant_name as merchantName,
        o.amount,
        o.points_awarded as pointsAwarded,
        o.payment_method as paymentMethod,
        o.status,
        o.wechat_order_id as wechatOrderId,
        o.paid_at as paidAt,
        o.created_at as createdAt,
        o.updated_at as updatedAt,
        u.nickname as userNickname,
        u.phone as userPhone,
        u.avatar as userAvatar,
        m.merchant_name as actualMerchantName,
        m.contact_person as merchantContact,
        m.contact_phone as merchantPhone,
        m.status as merchantStatus
      FROM payment_orders o
      LEFT JOIN users u ON CAST(o.user_id AS CHAR) = CAST(u.id AS CHAR)
      LEFT JOIN merchants m ON CAST(o.merchant_id AS CHAR) = CAST(m.id AS CHAR)
      ${whereClause}
      ORDER BY o.created_at DESC 
      LIMIT ${pageSize} OFFSET ${offset}
    `, queryParams);
    
    // 查询总数
    const [total] = await dbConnection.query(`
      SELECT COUNT(*) as count 
      FROM payment_orders o
      LEFT JOIN users u ON CAST(o.user_id AS CHAR) = CAST(u.id AS CHAR)
      LEFT JOIN merchants m ON CAST(o.merchant_id AS CHAR) = CAST(m.id AS CHAR)
      ${whereClause}
    `, queryParams);
    
    res.json({ 
      success: true, 
      data: orders,
      pagination: {
        page,
        pageSize,
        total: parseInt(total[0].count) || 0
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败', error: error.message });
  }
});

app.get('/api/v1/admin/orders/stats', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    
    const [stats] = await dbConnection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidCount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledCount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN points_awarded ELSE 0 END), 0) as totalPoints,
        ROUND(COUNT(CASE WHEN status = 'paid' THEN 1 END) * 100.0 / COUNT(*), 2) as successRate
      FROM payment_orders
    `);
    
    // 强制转换为数字
    const result = {
      total: parseInt(stats[0].total) || 0,
      paidCount: parseInt(stats[0].paidCount) || 0,
      pendingCount: parseInt(stats[0].pendingCount) || 0,
      cancelledCount: parseInt(stats[0].cancelledCount) || 0,
      totalAmount: parseInt(stats[0].totalAmount) || 0,
      totalPoints: parseInt(stats[0].totalPoints) || 0,
      successRate: parseFloat(stats[0].successRate) || 0
    };
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取订单统计失败:', error);
    res.status(500).json({ success: false, message: '获取订单统计失败', error: error.message });
  }
});

app.get('/api/v1/admin/orders/:id', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    
    const orderId = req.params.id;
    
    // 查询订单详情（包含用户和商户信息）
    const [orders] = await dbConnection.execute(`
      SELECT 
        o.*,
        u.id as user_id,
        u.nickname as user_nickname,
        u.phone as user_phone,
        u.avatar as user_avatar,
        u.wechat_id as user_wechat_id,
        m.id as merchant_id,
        m.merchant_name as merchant_name,
        m.merchant_no as merchant_no,
        m.business_category as merchant_category,
        m.contact_person as merchant_contact,
        m.contact_phone as merchant_phone,
        m.status as merchant_status
      FROM payment_orders o
      LEFT JOIN users u ON CAST(o.user_id AS CHAR) = CAST(u.id AS CHAR)
      LEFT JOIN merchants m ON CAST(o.merchant_id AS CHAR) = CAST(m.id AS CHAR)
      WHERE CAST(o.id AS CHAR) = ?
    `, [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 查询该用户的积分信息
    const [userPoints] = await dbConnection.execute(`
      SELECT 
        available_points as availablePoints,
        total_earned as totalEarned,
        total_spent as totalSpent
      FROM user_points
      WHERE CAST(user_id AS CHAR) = ?
    `, [order.user_id]);
    
    // 组装完整的订单详情
    const orderDetail = {
      // 订单基本信息
      id: order.id,
      userId: order.user_id,
      merchantId: order.merchant_id,
      amount: order.amount,
      pointsAwarded: order.points_awarded,
      paymentMethod: order.payment_method,
      status: order.status,
      wechatOrderId: order.wechat_order_id,
      paidAt: order.paid_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      
      // 用户信息
      userInfo: {
        id: order.user_id,
        nickname: order.user_nickname || '未知用户',
        phone: order.user_phone,
        avatar: order.user_avatar,
        wechatId: order.user_wechat_id,
        points: userPoints.length > 0 ? userPoints[0] : { availablePoints: 0, totalEarned: 0, totalSpent: 0 }
      },
      
      // 商户信息
      merchantInfo: {
        id: order.merchant_id,
        name: order.merchant_name || '未知商户',
        merchantNo: order.merchant_no,
        category: order.merchant_category,
        contact: order.merchant_contact,
        phone: order.merchant_phone,
        status: order.merchant_status
      }
    };
    
    res.json({ success: true, data: orderDetail });
  } catch (error) {
    console.error('获取订单详情失败:', error);
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
    
    const [users] = await dbConnection.query(`
      SELECT 
        u.id, 
        u.wechat_id as wechatId, 
        u.nickname, 
        u.avatar as avatarUrl, 
        u.phone,
        u.status,
        COALESCE(up.available_points, 0) as availablePoints,
        COALESCE(up.total_earned, 0) as totalEarned,
        COALESCE(up.total_spent, 0) as totalSpent,
        (SELECT COUNT(*) FROM payment_orders WHERE user_id = u.id AND status = 'paid') as orderCount,
        (SELECT COALESCE(SUM(amount), 0) FROM payment_orders WHERE user_id = u.id AND status = 'paid') as totalAmount,
        u.created_at as createdAt, 
        u.updated_at as updatedAt 
      FROM users u 
      LEFT JOIN user_points up ON CAST(u.id AS CHAR) = CAST(up.user_id AS CHAR)
      ORDER BY u.created_at DESC 
      LIMIT ${pageSize} OFFSET ${offset}
    `);
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
    const userId = req.params.id;
    
    // 获取用户基本信息和积分信息
    const [users] = await dbConnection.execute(`
      SELECT 
        u.id, 
        u.wechat_id as wechatId, 
        u.nickname, 
        u.avatar as avatarUrl, 
        u.phone,
        u.status,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        COALESCE(up.available_points, 0) as availablePoints,
        COALESCE(up.total_earned, 0) as totalEarned,
        COALESCE(up.total_spent, 0) as totalSpent
      FROM users u
      LEFT JOIN user_points up ON CAST(u.id AS CHAR) = CAST(up.user_id AS CHAR)
      WHERE u.id = ?
    `, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 获取用户的订单列表（最近10笔）
    const [orders] = await dbConnection.execute(`
      SELECT 
        id,
        merchant_name as merchantName,
        amount,
        points_awarded as pointsAwarded,
        status,
        created_at as createdAt
      FROM payment_orders
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);
    
    // 获取用户的积分记录（最近10条）
    const [pointsRecords] = await dbConnection.execute(`
      SELECT 
        id,
        points_change as pointsChange,
        record_type as recordType,
        merchant_name as merchantName,
        description,
        created_at as createdAt
      FROM points_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);
    
    // 统计数据 - 详细的订单统计
    const [orderStats] = await dbConnection.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidOrders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingOrders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledOrders,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalAmount
      FROM payment_orders
      WHERE user_id = ?
    `, [userId]);
    
    // 商户消费统计（按商户分组）
    const [merchantStats] = await dbConnection.execute(`
      SELECT 
        merchant_id as merchantId,
        merchant_name as merchantName,
        COUNT(*) as orderCount,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(points_awarded), 0) as totalPoints
      FROM payment_orders
      WHERE user_id = ? AND status = 'paid'
      GROUP BY merchant_id, merchant_name
      ORDER BY totalAmount DESC
    `, [userId]);
    
    res.json({ 
      success: true, 
      data: {
        ...users[0],
        orders: orders,
        pointsRecords: pointsRecords,
        merchantStats: merchantStats,
        orderStats: orderStats[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户详情失败', error: error.message });
  }
});

// 修改用户状态 (锁定/解锁)
app.put('/api/v1/admin/users/:id/status', async (req, res) => {
  try {
    if (!dbConnection) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }
    
    const userId = req.params.id;
    const { status } = req.body;
    
    // 验证状态值
    if (!status || !['active', 'locked'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }
    
    // 更新用户状态
    const [result] = await dbConnection.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ 
      success: true, 
      message: `用户已${status === 'active' ? '解锁' : '锁定'}`,
      data: { userId, status }
    });
  } catch (error) {
    console.error('修改用户状态失败:', error);
    res.status(500).json({ success: false, message: '修改用户状态失败', error: error.message });
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

    // JOIN users表获取用户昵称，JOIN user_points获取当前积分余额
    const [points] = await dbConnection.query(`
      SELECT
        pr.id,
        pr.user_id as userId,
        u.nickname as userNickname,
        u.phone as userPhone,
        u.avatar as userAvatar,
        pr.points_change as pointsChange,
        pr.record_type as recordType,
        pr.related_order_id as relatedOrderId,
        pr.merchant_id as merchantId,
        pr.merchant_name as merchantName,
        pr.description,
        pr.created_at as createdAt,
        up.available_points as currentBalance
      FROM points_records pr
      LEFT JOIN users u ON CAST(pr.user_id AS CHAR) = CAST(u.id AS CHAR)
      LEFT JOIN user_points up ON CAST(pr.user_id AS CHAR) = CAST(up.user_id AS CHAR)
      ORDER BY pr.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);

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
    console.error('获取积分记录失败:', error);
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
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

startServer();
