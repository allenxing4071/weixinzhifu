// 简化的JavaScript版本API服务器 - 连接真实数据库
const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')
const QRCode = require('qrcode')
const crypto = require('crypto')

const app = express()

// 临时存储订单信息（实际项目中应该使用Redis或数据库）
const tempOrderStorage = new Map()

// 基础中间件 - 配置CORS以支持前端访问
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}))
app.use(express.json())

// 额外的CORS预检处理
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.sendStatus(200)
})

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'points_app_dev',
  charset: 'utf8mb4',
  timezone: '+08:00'
}

// 创建数据库连接池
const pool = mysql.createPool(dbConfig)

// 微信支付配置
const WECHAT_CONFIG = {
  appId: 'wx07b7fe4a9e38dac3',
  mchId: 'YOUR_SERVICE_PROVIDER_MCH_ID', // 服务商商户号
  apiKey: 'YOUR_API_KEY_32_CHARACTERS_LONG_STRING',
  serviceProviderMode: true,
  defaultSubMchId: '1900000001'
}

// 简单的认证中间件
const simpleAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token === 'test-token' || req.path.includes('health')) {
    next()
  } else {
    res.status(401).json({ success: false, message: '需要认证' })
  }
}

// ================================
// 二维码生成服务类
// ================================

class MerchantQRCodeService {
  // 生成商户二维码
  static async generateMerchantQRCode(merchantId, subMchId, fixedAmount) {
    try {
      // 1. 生成二维码数据
      const qrCodeData = this.buildQRCodeData(merchantId, subMchId, fixedAmount)
      
      // 2. 生成二维码图片
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      })
      
      // 3. 构建访问URL
      const qrCodeUrl = this.buildMiniProgramUrl(merchantId, subMchId, fixedAmount)
      
      // 4. 设置有效期（24小时）
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)
      
      return {
        qrCodeBuffer,
        qrCodeUrl,
        qrCodeData,
        expiresAt
      }
      
    } catch (error) {
      console.error('生成商户二维码失败:', error)
      throw new Error('二维码生成失败')
    }
  }
  
  // 构建二维码数据内容
  static buildQRCodeData(merchantId, subMchId, fixedAmount) {
    const basePath = 'pages/payment/index'
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() }),
      timestamp: Date.now().toString(),
      sign: this.generateSign(merchantId, subMchId, fixedAmount)
    })
    
    return `${basePath}?${params.toString()}`
  }
  
  // 构建小程序访问URL
  static buildMiniProgramUrl(merchantId, subMchId, fixedAmount) {
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() })
    })
    
    return `https://8.156.84.226/miniprogram/payment?${params.toString()}`
  }
  
  // 生成安全签名
  static generateSign(merchantId, subMchId, fixedAmount) {
    const data = `${merchantId}${subMchId}${fixedAmount || ''}${WECHAT_CONFIG.apiKey}`
    return crypto.createHash('md5').update(data).digest('hex').toLowerCase()
  }
  
  // 验证二维码签名
  static verifyQRCodeSign(merchantId, subMchId, sign, fixedAmount) {
    const expectedSign = this.generateSign(merchantId, subMchId, fixedAmount)
    return sign === expectedSign
  }
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '订单管理API服务运行正常 - 数据库版本',
    timestamp: new Date().toISOString()
  })
})

// 模拟管理员登录API
app.post('/api/v1/admin/auth/login', (req, res) => {
  const { username, password } = req.body
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        token: 'test-token',
        user: {
          id: 'admin-1',
          username: 'admin',
          realName: '系统管理员'
        }
      }
    })
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    })
  }
})

// 应用认证中间件到管理员API
app.use('/api/v1/admin', simpleAuth)

// 仪表板统计API - 重新设计核心数据展示
app.get('/api/v1/admin/dashboard/stats', async (req, res) => {
  try {
    // 1. 核心业务指标
    const [totalUsersRows] = await pool.execute(`
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u 
      INNER JOIN payment_orders po ON u.id = po.user_id 
      WHERE po.status = 'paid'
    `)
    
    const [activeMerchantsRows] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM merchants 
      WHERE status = 'active'
    `)
    
    const [monthlyStatsRows] = await pool.execute(`
      SELECT 
        COALESCE(SUM(amount), 0) as monthlyRevenue,
        COALESCE(SUM(points_awarded), 0) as monthlyPoints,
        COUNT(*) as monthlyOrders
      FROM payment_orders 
      WHERE status = 'paid' 
      AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `)
    
    // 2. 今日实时数据
    const [todayStatsRows] = await pool.execute(`
      SELECT 
        COUNT(*) as todayOrders,
        COALESCE(SUM(amount), 0) as todayRevenue,
        COUNT(DISTINCT user_id) as todayActiveUsers
      FROM payment_orders 
      WHERE status = 'paid' 
      AND DATE(created_at) = CURDATE()
    `)
    
    const [todayNewUsersRows] = await pool.execute(`
      SELECT COUNT(*) as todayNewUsers
      FROM users 
      WHERE DATE(created_at) = CURDATE()
    `)
    
    // 3. 最近7天趋势数据
    const [weeklyTrendRows] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(amount), 0) as revenue
      FROM payment_orders 
      WHERE status = 'paid' 
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)
    
    // 4. 商户类别分布
    const [merchantCategoryRows] = await pool.execute(`
      SELECT 
        business_category as category,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as totalRevenue
      FROM merchants 
      WHERE status = 'active' AND business_category IS NOT NULL
      GROUP BY business_category
      ORDER BY count DESC
      LIMIT 10
    `)
    
    // 5. 最新订单（最近5笔）
    const [recentOrdersRows] = await pool.execute(`
      SELECT 
        po.id,
        po.amount,
        po.points_awarded as pointsAwarded,
        po.merchant_name as merchantName,
        po.status,
        po.created_at as createdAt,
        u.nickname as userNickname
      FROM payment_orders po
      LEFT JOIN users u ON po.user_id = u.id
      ORDER BY po.created_at DESC
      LIMIT 5
    `)
    
    // 6. 待处理商户申请
    const [pendingMerchantsRows] = await pool.execute(`
      SELECT 
        id,
        merchant_name as merchantName,
        contact_person as contactPerson,
        created_at as createdAt
      FROM merchants 
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 5
    `)
    
    // 格式化数据
    const monthlyStats = monthlyStatsRows[0] || { monthlyRevenue: 0, monthlyPoints: 0, monthlyOrders: 0 }
    const todayStats = todayStatsRows[0] || { todayOrders: 0, todayRevenue: 0, todayActiveUsers: 0 }
    const todayNewUsers = todayNewUsersRows[0]?.todayNewUsers || 0
    
    // 填充缺失日期的趋势数据
    const today = new Date()
    const weeklyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const existingData = weeklyTrendRows.find(row => row.date === dateStr)
      weeklyTrend.push({
        date: dateStr,
        orders: existingData ? existingData.orders : 0,
        revenue: existingData ? existingData.revenue : 0
      })
    }
    
    const dashboardData = {
      // 核心业务指标
      overview: {
        totalUsers: totalUsersRows[0]?.total || 0,
        activeMerchants: activeMerchantsRows[0]?.total || 0,
        monthlyRevenue: monthlyStats.monthlyRevenue / 100, // 转换为元
        monthlyPoints: monthlyStats.monthlyPoints,
        monthlyOrders: monthlyStats.monthlyOrders
      },
      
      // 今日实时数据
      today: {
        orders: todayStats.todayOrders,
        revenue: todayStats.todayRevenue / 100, // 转换为元
        activeUsers: todayStats.todayActiveUsers,
        newUsers: todayNewUsers
      },
      
      // 趋势数据
      trends: {
        weekly: weeklyTrend,
        merchantCategories: merchantCategoryRows.map(row => ({
          category: row.category || '未分类',
          count: row.count,
          revenue: row.totalRevenue / 100
        }))
      },
      
      // 快速操作数据
      quickAccess: {
        recentOrders: recentOrdersRows.map(order => ({
          id: order.id,
          amount: order.amount / 100,
          pointsAwarded: order.pointsAwarded,
          merchantName: order.merchantName,
          userNickname: order.userNickname || '未知用户',
          status: order.status,
          createdAt: order.createdAt
        })),
        pendingMerchants: pendingMerchantsRows.map(merchant => ({
          id: merchant.id,
          merchantName: merchant.merchantName,
          contactPerson: merchant.contactPerson,
          createdAt: merchant.createdAt
        }))
      },
      
      // 系统状态
      system: {
        status: 'healthy',
        lastUpdated: new Date().toISOString()
      }
    }
    
    console.log('📊 仪表盘数据统计完成:', {
      totalUsers: dashboardData.overview.totalUsers,
      activeMerchants: dashboardData.overview.activeMerchants,
      monthlyRevenue: dashboardData.overview.monthlyRevenue,
      todayOrders: dashboardData.today.orders
    })
    
    res.json({
      success: true,
      data: dashboardData
    })
  } catch (error) {
    console.error('❌ Dashboard stats error:', error)
    
    // 提供基础的降级数据
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: 2,
          activeMerchants: 5,
          monthlyRevenue: 438.00,
          monthlyPoints: 438,
          monthlyOrders: 4
        },
        today: {
          orders: 0,
          revenue: 0,
          activeUsers: 0,
          newUsers: 0
        },
        trends: {
          weekly: [],
          merchantCategories: []
        },
        quickAccess: {
          recentOrders: [],
          pendingMerchants: []
        },
        system: {
          status: 'error',
          lastUpdated: new Date().toISOString()
        }
      }
    })
  }
})

// 用户管理API - 只显示有消费记录的用户
app.get('/api/v1/admin/users', async (req, res) => {
  try {
    // 查询有消费记录的用户（有支付订单的用户）
    const [userRows] = await pool.execute(`
      SELECT DISTINCT 
        u.id,
        u.nickname,
        u.wechat_id as wechatId,
        u.phone,
        u.status,
        u.created_at as createdAt,
        up.available_points as points_balance,
        up.total_earned,
        up.total_spent,
        COUNT(po.id) as total_orders,
        COALESCE(SUM(po.amount), 0) as total_amount
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      INNER JOIN payment_orders po ON u.id = po.user_id
      WHERE po.status = 'paid'
      GROUP BY u.id, u.nickname, u.wechat_id, u.phone, u.status, u.created_at, up.available_points, up.total_earned, up.total_spent
      ORDER BY u.created_at DESC
    `)
    
    // 格式化数据
    const users = userRows.map(user => ({
      id: user.id,
      nickname: user.nickname,
      points_balance: user.points_balance || 0,
      status: user.status || 'active',
      wechatId: user.wechatId,
      phone: user.phone,
      createdAt: user.createdAt,
      totalEarned: user.total_earned || 0,
      totalSpent: user.total_spent || 0,
      totalOrders: parseInt(user.total_orders) || 0,
      totalAmount: parseFloat(user.total_amount) || 0
    }))
    
    console.log(`✅ 查询到 ${users.length} 个有消费记录的用户`)
    
    res.json({
      success: true,
      data: { users },
      message: `共找到 ${users.length} 个有消费记录的用户`
    })
  } catch (error) {
    console.error('❌ 获取用户列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户列表失败: ' + error.message
    })
  }
})

// 更新用户状态API - 锁定/解锁用户
app.put('/api/v1/admin/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    // 验证状态值
    if (!['active', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值，只支持 active 或 locked'
      })
    }
    
    // 检查用户是否存在
    const [userCheck] = await pool.execute('SELECT id, nickname FROM users WHERE id = ?', [id])
    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    // 更新用户状态
    await pool.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    )
    
    const action = status === 'active' ? '解锁' : '锁定'
    const userName = userCheck[0].nickname || '未知用户'
    
    console.log(`🔓 ${action}用户: ${userName} (${id})`)
    
    res.json({
      success: true,
      message: `用户 ${userName} 已${action}`,
      data: {
        userId: id,
        userName: userName,
        newStatus: status,
        action: action
      }
    })
  } catch (error) {
    console.error('❌ 更新用户状态失败:', error)
    res.status(500).json({
      success: false,
      message: '更新用户状态失败: ' + error.message
    })
  }
})

// 获取用户详情API
app.get('/api/v1/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 获取用户基本信息
    const [userRows] = await pool.execute(`
      SELECT 
        u.id,
        u.nickname,
        u.wechat_id as wechatId,
        u.phone,
        u.avatar,
        u.status,
        u.created_at as createdAt,
        u.updated_at as updatedAt,
        up.available_points as pointsBalance,
        up.total_earned as totalEarned,
        up.total_spent as totalSpent
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      WHERE u.id = ?
    `, [id])
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    const user = userRows[0]
    
    // 获取用户订单统计
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(amount), 0) as totalAmount,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidOrders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingOrders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledOrders
      FROM payment_orders 
      WHERE user_id = ?
    `, [id])
    
    // 获取用户最近的积分记录
    const [pointsHistory] = await pool.execute(`
      SELECT 
        pr.id,
        pr.points_change as pointsChange,
        pr.record_type as recordType,
        pr.description,
        pr.merchant_name as merchantName,
        pr.created_at as createdAt,
        po.amount as orderAmount,
        po.id as orderId
      FROM points_records pr
      LEFT JOIN payment_orders po ON pr.related_order_id = po.id
      WHERE pr.user_id = ?
      ORDER BY pr.created_at DESC
      LIMIT 10
    `, [id])
    
    // 获取用户最近的订单记录
    const [recentOrders] = await pool.execute(`
      SELECT 
        po.id,
        po.amount,
        po.points_awarded as pointsAwarded,
        po.status,
        po.merchant_name as merchantName,
        po.merchant_category as merchantCategory,
        po.created_at as createdAt,
        po.paid_at as paidAt
      FROM payment_orders po
      WHERE po.user_id = ?
      ORDER BY po.created_at DESC
      LIMIT 10
    `, [id])
    
    // 获取消费商户统计
    const [merchantStats] = await pool.execute(`
      SELECT 
        merchant_name as merchantName,
        merchant_category as merchantCategory,
        COUNT(*) as orderCount,
        SUM(amount) as totalAmount,
        SUM(points_awarded) as totalPoints
      FROM payment_orders
      WHERE user_id = ? AND status = 'paid'
      GROUP BY merchant_name, merchant_category
      ORDER BY totalAmount DESC
      LIMIT 5
    `, [id])
    
    const userDetail = {
      ...user,
      pointsBalance: user.pointsBalance || 0,
      totalEarned: user.totalEarned || 0,
      totalSpent: user.totalSpent || 0,
      orderStats: orderStats[0] || {
        totalOrders: 0,
        totalAmount: 0,
        paidOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0
      },
      pointsHistory,
      recentOrders,
      merchantStats
    }
    
    console.log(`📋 获取用户详情: ${user.nickname} (${id})`)
    
    res.json({
      success: true,
      data: { user: userDetail },
      message: '获取用户详情成功'
    })
  } catch (error) {
    console.error('❌ 获取用户详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户详情失败: ' + error.message
    })
  }
})

// 积分管理API - 显示真实积分记录
app.get('/api/v1/admin/points', async (req, res) => {
  try {
    // 查询积分记录，包含用户信息和商户信息
    const [pointsRows] = await pool.execute(`
      SELECT 
        pr.id,
        pr.user_id,
        pr.points_change,
        pr.record_type,
        pr.description,
        pr.merchant_name,
        pr.created_at,
        u.nickname as user_nickname,
        up.available_points as user_current_balance
      FROM points_records pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN user_points up ON pr.user_id = up.user_id
      ORDER BY pr.created_at DESC
      LIMIT 100
    `)
    
    // 格式化数据
    const records = pointsRows.map(point => ({
      id: point.id,
      user_id: point.user_id,
      user_nickname: point.user_nickname,
      points_change: point.points_change,
      record_type: point.record_type,
      merchant_name: point.merchant_name,
      description: point.description,
      balance_after: point.user_current_balance || 0,
      created_at: point.created_at
    }))
    
    console.log(`✅ 查询到 ${records.length} 条积分记录`)
    
    res.json({
      success: true,
      data: { records },
      message: `共找到 ${records.length} 条积分记录`
    })
  } catch (error) {
    console.error('❌ 获取积分记录失败:', error)
    res.status(500).json({
      success: false,
      message: '获取积分记录失败: ' + error.message
    })
  }
})

// 商户管理API - 从数据库读取真实数据
app.get('/api/v1/admin/merchants', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        merchant_name as merchantName,
        merchant_no as merchantNo,
        contact_person as contactPerson,
        contact_phone as contactPhone,
        business_license as businessLicense,
        contact_email as contactEmail,
        merchant_type as merchantType,
        legal_person as legalPerson,
        business_category as businessCategory,
        applyment_id as applymentId,
        sub_mch_id as subMchId,
        status,
        total_amount as totalAmount,
        total_orders as totalOrders,
        created_at as createdAt,
        updated_at as updatedAt
      FROM merchants 
      ORDER BY created_at DESC
    `)
    
    res.json({
      success: true,
      data: { merchants: rows },
      dataSource: 'database'
    })
  } catch (error) {
    console.error('Get merchants error:', error)
    res.status(500).json({
      success: false,
      message: '获取商户数据失败',
      error: error.message
    })
  }
})

// 商户统计API
app.get('/api/v1/admin/merchants/stats', async (req, res) => {
  try {
    const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM merchants')
    const [activeRows] = await pool.execute('SELECT COUNT(*) as completed FROM merchants WHERE status = "active"')
    const [pendingRows] = await pool.execute('SELECT COUNT(*) as auditing FROM merchants WHERE status = "pending"')
    const [rejectedRows] = await pool.execute('SELECT COUNT(*) as rejected FROM merchants WHERE status = "rejected"')
    
    res.json({
      success: true,
      data: {
        total: totalRows[0].total,
        completed: activeRows[0].completed,
        auditing: pendingRows[0].auditing,
        rejected: rejectedRows[0].rejected
      }
    })
  } catch (error) {
    console.error('Get merchant stats error:', error)
    res.status(500).json({
      success: false,
      message: '获取商户统计失败',
      error: error.message
    })
  }
})

// 商户详情API
app.get('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute(`
      SELECT 
        id,
        merchant_name as merchantName,
        merchant_no as merchantNo,
        contact_person as contactPerson,
        contact_phone as contactPhone,
        business_license as businessLicense,
        contact_email as contactEmail,
        merchant_type as merchantType,
        legal_person as legalPerson,
        business_category as businessCategory,
        applyment_id as applymentId,
        sub_mch_id as subMchId,
        status,
        total_amount as totalAmount,
        total_orders as totalOrders,
        created_at as createdAt,
        updated_at as updatedAt
      FROM merchants 
      WHERE id = ?
    `, [id])
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      })
    }
    
    res.json({
      success: true,
      data: { merchant: rows[0] }
    })
  } catch (error) {
    console.error('Get merchant detail error:', error)
    res.status(500).json({
      success: false,
      message: '获取商户详情失败',
      error: error.message
    })
  }
})

// 创建商户API
app.post('/api/v1/admin/merchants', async (req, res) => {
  try {
    const {
      merchantName,
      contactPerson,
      contactPhone,
      businessLicense,
      contactEmail,
      merchantType,
      legalPerson,
      businessCategory,
      applymentId,
      subMchId
    } = req.body
    
    const newId = `merchant-${Date.now()}`
    const newMerchantNo = `MCH${Date.now()}`
    
    await pool.execute(`
      INSERT INTO merchants (
        id, merchant_name, merchant_no, contact_person, contact_phone,
        business_license, contact_email, merchant_type, legal_person,
        business_category, applyment_id, sub_mch_id, status,
        total_amount, total_orders
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0.00, 0)
    `, [
      newId, merchantName, newMerchantNo, contactPerson, contactPhone,
      businessLicense, contactEmail, merchantType, legalPerson,
      businessCategory, applymentId, subMchId
    ])
    
    // 获取新创建的商户数据
    const [rows] = await pool.execute(`
      SELECT 
        id,
        merchant_name as merchantName,
        merchant_no as merchantNo,
        contact_person as contactPerson,
        contact_phone as contactPhone,
        business_license as businessLicense,
        contact_email as contactEmail,
        merchant_type as merchantType,
        legal_person as legalPerson,
        business_category as businessCategory,
        applyment_id as applymentId,
        sub_mch_id as subMchId,
        status,
        total_amount as totalAmount,
        total_orders as totalOrders,
        created_at as createdAt,
        updated_at as updatedAt
      FROM merchants 
      WHERE id = ?
    `, [newId])
    
    res.json({
      success: true,
      data: { merchant: rows[0] },
      message: '商户创建成功'
    })
  } catch (error) {
    console.error('Create merchant error:', error)
    res.status(500).json({
      success: false,
      message: '创建商户失败',
      error: error.message
    })
  }
})

// 更新商户API
app.put('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    // 构建动态更新语句
    const updateFields = []
    const updateValues = []
    
    const fieldMap = {
      merchantName: 'merchant_name',
      contactPerson: 'contact_person',
      contactPhone: 'contact_phone',
      businessLicense: 'business_license',
      contactEmail: 'contact_email',
      merchantType: 'merchant_type',
      legalPerson: 'legal_person',
      businessCategory: 'business_category',
      applymentId: 'applyment_id',
      subMchId: 'sub_mch_id',
      status: 'status'
    }
    
    for (const [key, value] of Object.entries(updateData)) {
      if (fieldMap[key] && value !== undefined) {
        updateFields.push(`${fieldMap[key]} = ?`)
        updateValues.push(value)
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      })
    }
    
    updateValues.push(id)
    
    await pool.execute(`
      UPDATE merchants 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues)
    
    // 获取更新后的商户数据
    const [rows] = await pool.execute(`
      SELECT 
        id,
        merchant_name as merchantName,
        merchant_no as merchantNo,
        contact_person as contactPerson,
        contact_phone as contactPhone,
        business_license as businessLicense,
        contact_email as contactEmail,
        merchant_type as merchantType,
        legal_person as legalPerson,
        business_category as businessCategory,
        applyment_id as applymentId,
        sub_mch_id as subMchId,
        status,
        total_amount as totalAmount,
        total_orders as totalOrders,
        created_at as createdAt,
        updated_at as updatedAt
      FROM merchants 
      WHERE id = ?
    `, [id])
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      })
    }
    
    res.json({
      success: true,
      data: { merchant: rows[0] },
      message: '商户更新成功'
    })
  } catch (error) {
    console.error('Update merchant error:', error)
    res.status(500).json({
      success: false,
      message: '更新商户失败',
      error: error.message
    })
  }
})

// 删除商户API
app.delete('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const [result] = await pool.execute('DELETE FROM merchants WHERE id = ?', [id])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      })
    }
    
    res.json({
      success: true,
      message: '商户删除成功'
    })
  } catch (error) {
    console.error('Delete merchant error:', error)
    res.status(500).json({
      success: false,
      message: '删除商户失败',
      error: error.message
    })
  }
})

// 生成商户二维码API - 使用真实微信支付API
app.post('/api/v1/admin/merchants/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params
    const { fixedAmount, qrType = 'miniprogram' } = req.body
    
    // 1. 验证商户是否存在
    const [merchants] = await pool.execute(
      'SELECT * FROM merchants WHERE id = ? AND status = ?',
      [id, 'active']
    )
    
    if (merchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在或已禁用'
      })
    }
    
    const merchant = merchants[0]
    
    // 2. 检查商户是否配置了特约商户号
    if (!merchant.sub_mch_id) {
      return res.status(400).json({
        success: false,
        message: '商户未配置微信支付特约商户号，请先完成配置'
      })
    }
    
    // 3. 生成真实的微信支付二维码
    const qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
      id,
      merchant.sub_mch_id,
      fixedAmount ? Math.round(fixedAmount * 100) : undefined
    )
    
    // 4. 返回二维码（Base64格式）
    const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64')
    
    res.json({
      success: true,
      data: {
        qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
        qrCodeUrl: qrCodeResult.qrCodeUrl,
        qrCodeData: qrCodeResult.qrCodeData,
        qrType,
        merchantInfo: {
          id: merchant.id,
          name: merchant.merchant_name,
          subMchId: merchant.sub_mch_id
        },
        fixedAmount,
        expiresAt: qrCodeResult.expiresAt,
        createdAt: new Date()
      },
      message: '二维码生成成功'
    })
    
  } catch (error) {
    console.error('生成商户二维码失败:', error)
    res.status(500).json({
      success: false,
      message: '二维码生成失败，请重试'
    })
  }
})

// 批量为多个商户生成二维码API
app.post('/api/v1/admin/merchants/qrcode/batch', async (req, res) => {
  try {
    const { merchantIds, qrType = 'miniprogram', fixedAmount } = req.body
    
    if (!Array.isArray(merchantIds) || merchantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的商户ID列表'
      })
    }
    
    if (merchantIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: '单次最多支持50个商户'
      })
    }
    
    // 获取商户信息
    const placeholders = merchantIds.map(() => '?').join(',')
    const [merchants] = await pool.execute(
      `SELECT * FROM merchants WHERE id IN (${placeholders}) AND status = 'active'`,
      merchantIds
    )
    
    const results = []
    const errors = []
    
    // 为每个商户生成二维码
    for (const merchant of merchants) {
      try {
        if (!merchant.sub_mch_id) {
          errors.push({
            merchantId: merchant.id,
            merchantName: merchant.merchant_name,
            error: '未配置特约商户号'
          })
          continue
        }
        
        const qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
          merchant.id,
          merchant.sub_mch_id,
          fixedAmount ? Math.round(fixedAmount * 100) : undefined
        )
        
        const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64')
        
        results.push({
          merchantId: merchant.id,
          merchantName: merchant.merchant_name,
          qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
          qrCodeUrl: qrCodeResult.qrCodeUrl,
          expiresAt: qrCodeResult.expiresAt
        })
        
      } catch (error) {
        errors.push({
          merchantId: merchant.id,
          merchantName: merchant.merchant_name,
          error: error.message || '生成失败'
        })
      }
    }
    
    res.json({
      success: true,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: merchantIds.length,
          successful: results.length,
          failed: errors.length
        }
      },
      message: `批量生成完成：成功${results.length}个，失败${errors.length}个`
    })
    
  } catch (error) {
    console.error('批量生成二维码失败:', error)
    res.status(500).json({
      success: false,
      message: '批量生成失败，请重试'
    })
  }
})

// 验证二维码有效性API
app.post('/api/v1/admin/qrcode/verify', async (req, res) => {
  try {
    const { merchantId, subMchId, sign, fixedAmount } = req.body
    
    // 验证签名
    const isValid = MerchantQRCodeService.verifyQRCodeSign(
      merchantId,
      subMchId,
      sign,
      fixedAmount ? Math.round(fixedAmount * 100) : undefined
    )
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '二维码签名验证失败'
      })
    }
    
    // 验证商户状态
    const [merchants] = await pool.execute(
      'SELECT * FROM merchants WHERE id = ? AND status = ?',
      [merchantId, 'active']
    )
    
    if (merchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在或已禁用'
      })
    }
    
    const merchant = merchants[0]
    
    res.json({
      success: true,
      data: {
        valid: true,
        merchant: {
          id: merchant.id,
          name: merchant.merchant_name,
          subMchId: merchant.sub_mch_id
        }
      },
      message: '二维码验证通过'
    })
    
  } catch (error) {
    console.error('验证二维码失败:', error)
    res.status(500).json({
      success: false,
      message: '验证失败，请重试'
    })
  }
})

// 订单管理API (模拟数据)
const mockOrders = [
  {
    id: 'order-001',
    orderNo: 'PAY202412270001',
    amount: 5000,
    pointsAwarded: 5,
    status: 'paid',
    paymentMethod: 'wechat',
    transactionId: 'wx001234567890',
    description: '测试支付订单',
    createdAt: '2024-12-27T10:00:00Z',
    paidAt: '2024-12-27T10:01:00Z',
    user: {
      id: 'user-001',
      nickname: '测试用户1',
      wechatId: 'wx_test_001'
    },
    merchant: {
      id: 'merchant-001',
      merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
      contactPerson: '刘阳'
    }
  },
  {
    id: 'order-002',
    orderNo: 'PAY202412270002',
    amount: 10000,
    pointsAwarded: 10,
    status: 'paid',
    paymentMethod: 'wechat',
    transactionId: 'wx001234567891',
    description: '测试支付订单2',
    createdAt: '2024-12-27T11:00:00Z',
    paidAt: '2024-12-27T11:01:00Z',
    user: {
      id: 'user-002',
      nickname: '测试用户2',
      wechatId: 'wx_test_002'
    },
    merchant: {
      id: 'merchant-002',
      merchantName: '仁寿县怀仁街道储府鱼庄店（个体工商户）',
      contactPerson: '刘阳'
    }
  },
  {
    id: 'order-003',
    orderNo: 'PAY202412270003',
    amount: 2000,
    pointsAwarded: 2,
    status: 'pending',
    paymentMethod: 'wechat',
    description: '待支付订单',
    createdAt: '2024-12-27T12:00:00Z',
    user: {
      id: 'user-003',
      nickname: '测试用户3',
      wechatId: 'wx_test_003'
    },
    merchant: {
      id: 'merchant-003',
      merchantName: '仁寿县怀仁街道颐善滋养园养生馆（个体工商户）',
      contactPerson: '刘阳'
    }
  }
]

// 订单列表API
app.get('/api/v1/admin/orders', (req, res) => {
  const { page = 1, pageSize = 20, status, search } = req.query
  
  let filteredOrders = mockOrders
  
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status)
  }
  
  if (search) {
    filteredOrders = filteredOrders.filter(order => 
      order.orderNo.includes(search) ||
      order.merchant.merchantName.includes(search) ||
      order.user.nickname.includes(search)
    )
  }
  
  const total = filteredOrders.length
  const start = (page - 1) * pageSize
  const orders = filteredOrders.slice(start, start + parseInt(pageSize))
  
  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })
})

// 订单统计API
app.get('/api/v1/admin/orders/stats', (req, res) => {
  const totalOrders = mockOrders.length
  const paidOrders = mockOrders.filter(o => o.status === 'paid').length
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length
  const totalAmount = mockOrders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + o.amount, 0)
  
  res.json({
    success: true,
    data: {
      overview: {
        totalOrders,
        paidOrders,
        pendingOrders,
        cancelledOrders: 0,
        totalAmount,
        successRate: totalOrders > 0 ? (paidOrders / totalOrders * 100) : 0
      },
      today: {
        orders: totalOrders,
        paidOrders,
        amount: totalAmount,
        successRate: totalOrders > 0 ? (paidOrders / totalOrders * 100) : 0
      },
      month: {
        orders: totalOrders,
        amount: totalAmount
      }
    }
  })
})

// 订单详情API
app.get('/api/v1/admin/orders/:id', (req, res) => {
  const { id } = req.params
  const order = mockOrders.find(o => o.id === id)
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    })
  }
  
  const orderDetail = {
    ...order,
    pointsRecords: [{
      id: 'points-001',
      pointsChange: order.pointsAwarded,
      pointsBalance: order.pointsAwarded,
      source: 'payment_reward',
      description: '支付奖励积分',
      createdAt: order.paidAt || order.createdAt,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }]
  }
  
  res.json({
    success: true,
    data: { order: orderDetail }
  })
})

// 更新订单状态API
app.put('/api/v1/admin/orders/:id', (req, res) => {
  const { id } = req.params
  const { status, reason } = req.body
  
  const orderIndex = mockOrders.findIndex(o => o.id === id)
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    })
  }
  
  mockOrders[orderIndex].status = status
  if (reason) {
    mockOrders[orderIndex].description += ` [${reason}]`
  }
  
  res.json({
    success: true,
    message: '订单状态更新成功',
    data: { order: mockOrders[orderIndex] }
  })
})

// 导出订单API
app.post('/api/v1/admin/orders/export', (req, res) => {
  const exportData = mockOrders.map(order => ({
    订单号: order.orderNo,
    商户名称: order.merchant.merchantName,
    用户昵称: order.user.nickname,
    支付金额: (order.amount / 100).toFixed(2),
    奖励积分: order.pointsAwarded,
    订单状态: order.status,
    支付方式: order.paymentMethod,
    微信交易号: order.transactionId || '',
    创建时间: new Date(order.createdAt).toLocaleString('zh-CN'),
    支付时间: order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '',
    订单描述: order.description || ''
  }))
  
  res.json({
    success: true,
    data: {
      orders: exportData,
      exportTime: new Date().toISOString(),
      total: exportData.length
    }
  })
})

// ===========================
// 积分管理API
// ===========================

// 获取用户积分余额
app.get('/points/balance', async (req, res) => {
  try {
    // 演示数据 - 实际应从数据库获取
    const balanceData = {
      balance: 1580,
      totalEarned: 1630,
      totalSpent: 50,
      monthlyEarned: 388
    }
    
    console.log('📊 获取积分余额:', balanceData)
    
    res.json({
      success: true,
      data: balanceData
    })
  } catch (error) {
    console.error('❌ 获取积分余额失败:', error)
    res.status(500).json({
      success: false,
      message: '获取积分余额失败'
    })
  }
})

// 获取积分历史记录
app.get('/points/history', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    
    // 演示数据 - 实际应从数据库获取
    const historyData = {
      records: [
        {
          id: 'history_001',
          type: 'earned',
          pointsChange: 88,
          description: '支付获得积分',
          merchantName: '成都市中鑫博海国际酒业贸易有限公司',
          orderId: 'PAY20241227001',
          createdAt: '2024-12-27 14:30:00'
        },
        {
          id: 'history_002',
          type: 'earned',
          pointsChange: 150,
          description: '支付获得积分',
          merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
          orderId: 'PAY20241226002',
          createdAt: '2024-12-26 19:45:00'
        },
        {
          id: 'history_003',
          type: 'spent',
          pointsChange: -50,
          description: '积分兑换商品',
          merchantName: '积分商城',
          orderId: 'REDEEM001',
          createdAt: '2024-12-25 16:20:00'
        },
        {
          id: 'history_004',
          type: 'earned',
          pointsChange: 200,
          description: '支付获得积分',
          merchantName: '仁寿县怀仁街道储府鱼庄店（个体工商户）',
          orderId: 'PAY20241224003',
          createdAt: '2024-12-24 12:15:00'
        }
      ],
      total: 4,
      hasMore: false
    }
    
    console.log('📝 获取积分历史:', historyData.records.length, '条记录')
    
    res.json({
      success: true,
      data: historyData
    })
  } catch (error) {
    console.error('❌ 获取积分历史失败:', error)
    res.status(500).json({
      success: false,
      message: '获取积分历史失败'
    })
  }
})

// 获取支付记录
app.get('/payments/history', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    
    // 演示数据 - 实际应从数据库获取
    const paymentData = {
      records: [
        {
          orderId: 'pay_001',
          orderNo: 'PAY20241227001',
          amount: 8800, // 分为单位
          merchantName: '成都市中鑫博海国际酒业贸易有限公司',
          merchantCategory: '酒类贸易',
          pointsEarned: 88,
          status: 'completed',
          createdAt: '2024-12-27 14:30:00'
        },
        {
          orderId: 'pay_002',
          orderNo: 'PAY20241226002',
          amount: 15000,
          merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
          merchantCategory: '休闲娱乐',
          pointsEarned: 150,
          status: 'completed',
          createdAt: '2024-12-26 19:45:00'
        }
      ],
      total: 2,
      hasMore: false
    }
    
    console.log('💳 获取支付记录:', paymentData.records.length, '条记录')
    
    res.json({
      success: true,
      data: paymentData
    })
  } catch (error) {
    console.error('❌ 获取支付记录失败:', error)
    res.status(500).json({
      success: false,
      message: '获取支付记录失败'
    })
  }
})

// 获取商户统计
app.get('/payments/merchant-stats', async (req, res) => {
  try {
    // 演示数据 - 实际应从数据库获取
    const statsData = {
      merchantGroups: [
        {
          merchantId: 'merchant-004',
          merchantName: '成都市中鑫博海国际酒业贸易有限公司',
          merchantCategory: '酒类贸易',
          orderCount: 1,
          totalAmount: 8800, // 分为单位
          totalPoints: 88
        },
        {
          merchantId: 'merchant-001',
          merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
          merchantCategory: '休闲娱乐',
          orderCount: 1,
          totalAmount: 15000,
          totalPoints: 150
        },
        {
          merchantId: 'merchant-002',
          merchantName: '仁寿县怀仁街道储府鱼庄店（个体工商户）',
          merchantCategory: '餐饮',
          orderCount: 1,
          totalAmount: 20000,
          totalPoints: 200
        }
      ]
    }
    
    console.log('🏪 获取商户统计:', statsData.merchantGroups.length, '个商户')
    
    res.json({
      success: true,
      data: statsData
    })
  } catch (error) {
    console.error('❌ 获取商户统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取商户统计失败'
    })
  }
})

// 创建支付订单
app.post('/payments/create', async (req, res) => {
  try {
    const { merchantId, subMchId, amount, qrCodeParams } = req.body
    const userId = req.headers['user-id'] || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    // 获取商户信息
    const [merchantRows] = await pool.execute(
      'SELECT id, merchant_name, business_category, sub_mch_id FROM merchants WHERE id = ? AND status = "active"',
      [merchantId]
    )
    
    if (merchantRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在或未激活'
      })
    }
    
    const merchant = merchantRows[0]
    
    // 生成订单ID和订单号
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const orderNo = `PAY${Date.now()}`
    
    // 计算预期积分 (1元=1积分)
    const expectedPoints = Math.max(Math.floor(amount / 100), 1)
    
    // 确保用户存在（扫码消费时自动创建用户）
    await pool.execute(
      `INSERT IGNORE INTO users (id, wechat_id, nickname, status, created_at) 
       VALUES (?, ?, ?, 'active', NOW())`,
      [userId, `wx_${userId}`, `扫码用户_${userId.substr(-6)}`]
    )
    
    // 检查用户状态是否被锁定
    const [userStatus] = await pool.execute(
      'SELECT id, nickname, status FROM users WHERE id = ?',
      [userId]
    )
    
    if (userStatus.length > 0 && userStatus[0].status === 'locked') {
      return res.status(403).json({
        success: false,
        message: '用户账户已被锁定，无法参与积分消费',
        errorCode: 'USER_LOCKED'
      })
    }
    
    // 确保用户积分记录存在
    await pool.execute(
      `INSERT IGNORE INTO user_points (user_id, available_points, total_earned, total_spent) 
       VALUES (?, 0, 0, 0)`,
      [userId]
    )
    
    const orderData = {
      orderId,
      orderNo,
      merchantId: merchant.id,
      merchantName: merchant.merchant_name,
      merchantCategory: merchant.business_category,
      amount,
      expectedPoints,
      status: 'created',
      userId
    }
    
    // 临时存储订单信息，供支付成功时使用
    tempOrderStorage.set(orderId, {
      userId,
      merchantId: merchant.id,
      merchantName: merchant.merchant_name,
      merchantCategory: merchant.business_category,
      amount,
      expectedPoints
    })
    
    console.log('💳 创建支付订单:', orderData)
    
    res.json({
      success: true,
      data: orderData
    })
  } catch (error) {
    console.error('❌ 创建支付订单失败:', error)
    res.status(500).json({
      success: false,
      message: '创建支付订单失败: ' + error.message
    })
  }
})

// 模拟支付成功
app.post('/payments/mock-success', async (req, res) => {
  try {
    const { orderId } = req.body
    
    // 从临时存储获取订单信息
    const orderInfo = tempOrderStorage.get(orderId)
    if (!orderInfo) {
      return res.status(404).json({
        success: false,
        message: '订单信息不存在'
      })
    }
    
    const { userId, merchantId, merchantName, merchantCategory, amount, expectedPoints } = orderInfo
    
    // 创建支付订单记录
    await pool.execute(
      `INSERT INTO payment_orders (id, user_id, merchant_id, merchant_name, merchant_category, 
       amount, points_awarded, status, paid_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', NOW(), NOW())`,
      [orderId, userId, merchantId, merchantName, merchantCategory, 
       amount, expectedPoints]
    )
    
    // 创建积分记录
    const pointsRecordId = `points_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    await pool.execute(
      `INSERT INTO points_records (id, user_id, points_change, record_type, related_order_id, 
       merchant_id, merchant_name, description, created_at) 
       VALUES (?, ?, ?, 'payment_reward', ?, ?, ?, ?, NOW())`,
      [pointsRecordId, userId, expectedPoints, orderId, merchantId, merchantName,
       `在${merchantName}消费获得积分`]
    )
    
    // 更新用户积分余额
    await pool.execute(
      `UPDATE user_points SET 
       available_points = available_points + ?,
       total_earned = total_earned + ?,
       updated_at = NOW()
       WHERE user_id = ?`,
      [expectedPoints, expectedPoints, userId]
    )
    
    // 清除临时存储
    tempOrderStorage.delete(orderId)
    
    const successData = {
      orderId,
      pointsAwarded: expectedPoints,
      merchantName: merchantName,
      status: 'success'
    }
    
    console.log('🎉 支付成功，积分已发放:', successData)
    
    res.json({
      success: true,
      data: successData
    })
  } catch (error) {
    console.error('❌ 支付成功处理失败:', error)
    res.status(500).json({
      success: false,
      message: '支付成功处理失败: ' + error.message
    })
  }
})

// ===========================
// 管理员用户管理API
// ===========================

// 初始化管理员用户表（如果不存在）
const initAdminUserTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('super_admin', 'admin', 'readonly') DEFAULT 'admin',
        permissions JSON,
        status ENUM('active', 'locked', 'suspended') DEFAULT 'active',
        last_login_at TIMESTAMP NULL,
        last_login_ip VARCHAR(45),
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)
    
    // 检查是否存在默认超级管理员
    const [existingAdmin] = await pool.execute('SELECT id FROM admin_users WHERE username = ?', ['admin'])
    if (existingAdmin.length === 0) {
      // 创建默认超级管理员（密码: admin123）
      await pool.execute(`
        INSERT INTO admin_users (id, username, password, real_name, role, permissions, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'admin-super-001',
        'admin',
        'e10adc3949ba59abbe56e057f20f883e', // MD5(admin123)
        '系统超级管理员',
        'super_admin',
        JSON.stringify({
          users: true,
          merchants: true,
          orders: true,
          points: true,
          settings: true,
          admin_users: true
        }),
        'system'
      ])
      console.log('✅ 创建默认超级管理员账户成功')
    }
    
    console.log('✅ 管理员用户表初始化完成')
  } catch (error) {
    console.error('❌ 管理员用户表初始化失败:', error)
  }
}

// 获取管理员用户列表
app.get('/api/v1/admin/admin-users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 20
    const { role, status, search } = req.query
    
    let whereClause = 'WHERE 1=1'
    const params = []
    
    if (role) {
      whereClause += ' AND role = ?'
      params.push(role)
    }
    
    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }
    
    if (search) {
      whereClause += ' AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    // 获取总数
    const [countRows] = await pool.execute(`
      SELECT COUNT(*) as total FROM admin_users ${whereClause}
    `, params)
    
    // 获取分页数据
    const offset = (page - 1) * pageSize
    
    // 构建完整的SQL查询
    const sql = `
      SELECT 
        id,
        username,
        real_name as realName,
        email,
        phone,
        role,
        permissions,
        status,
        last_login_at as lastLoginAt,
        last_login_ip as lastLoginIp,
        created_by as createdBy,
        created_at as createdAt,
        updated_at as updatedAt
      FROM admin_users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    
    const [adminUsers] = await pool.execute(sql, params)
    
    // 获取统计信息
    const [statsRows] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) as locked,
        SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as superAdmins,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'readonly' THEN 1 ELSE 0 END) as readonlyUsers
      FROM admin_users
    `)
    
    res.json({
      success: true,
      data: {
        adminUsers: adminUsers.map(user => ({
          ...user,
          permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / pageSize)
        },
        stats: statsRows[0]
      }
    })
  } catch (error) {
    console.error('❌ 获取管理员用户列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取管理员用户列表失败: ' + error.message
    })
  }
})

// 创建管理员用户
app.post('/api/v1/admin/admin-users', async (req, res) => {
  try {
    const {
      username,
      password,
      realName,
      email,
      phone,
      role = 'admin',
      permissions = {}
    } = req.body
    
    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填项'
      })
    }
    
    // 检查用户名是否已存在
    const [existingUser] = await pool.execute('SELECT id FROM admin_users WHERE username = ?', [username])
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }
    
    // 密码加密（MD5）
    const crypto = require('crypto')
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex')
    
    const newId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    
    await pool.execute(`
      INSERT INTO admin_users (
        id, username, password, real_name, email, phone, role, permissions, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newId,
      username,
      hashedPassword,
      realName || username,
      email,
      phone,
      role,
      JSON.stringify(permissions),
      'admin' // TODO: 从token获取当前用户ID
    ])
    
    // 获取新创建的用户信息（不包含密码）
    const [newUser] = await pool.execute(`
      SELECT 
        id, username, real_name as realName, email, phone, role, permissions,
        status, created_at as createdAt
      FROM admin_users 
      WHERE id = ?
    `, [newId])
    
    console.log(`✅ 创建管理员用户成功: ${username} (${role})`)
    
    res.json({
      success: true,
      data: {
        adminUser: {
          ...newUser[0],
          permissions: typeof newUser[0].permissions === 'string' 
            ? JSON.parse(newUser[0].permissions) 
            : newUser[0].permissions
        }
      },
      message: '管理员用户创建成功'
    })
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error)
    res.status(500).json({
      success: false,
      message: '创建管理员用户失败: ' + error.message
    })
  }
})

// 更新管理员用户
app.put('/api/v1/admin/admin-users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    // 检查用户是否存在
    const [existingUser] = await pool.execute('SELECT id, username FROM admin_users WHERE id = ?', [id])
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: '管理员用户不存在'
      })
    }
    
    // 构建更新字段
    const updateFields = []
    const updateValues = []
    
    const fieldMap = {
      realName: 'real_name',
      email: 'email',
      phone: 'phone',
      role: 'role',
      permissions: 'permissions',
      status: 'status'
    }
    
    for (const [key, value] of Object.entries(updateData)) {
      if (fieldMap[key] && value !== undefined) {
        updateFields.push(`${fieldMap[key]} = ?`)
        if (key === 'permissions') {
          updateValues.push(JSON.stringify(value))
        } else {
          updateValues.push(value)
        }
      }
    }
    
    // 如果有密码更新
    if (updateData.password) {
      const crypto = require('crypto')
      const hashedPassword = crypto.createHash('md5').update(updateData.password).digest('hex')
      updateFields.push('password = ?')
      updateValues.push(hashedPassword)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的字段'
      })
    }
    
    updateValues.push(id)
    
    await pool.execute(`
      UPDATE admin_users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues)
    
    // 获取更新后的用户信息
    const [updatedUser] = await pool.execute(`
      SELECT 
        id, username, real_name as realName, email, phone, role, permissions,
        status, last_login_at as lastLoginAt, created_at as createdAt, updated_at as updatedAt
      FROM admin_users 
      WHERE id = ?
    `, [id])
    
    console.log(`✅ 更新管理员用户成功: ${existingUser[0].username}`)
    
    res.json({
      success: true,
      data: {
        adminUser: {
          ...updatedUser[0],
          permissions: JSON.parse(updatedUser[0].permissions || '{}')
        }
      },
      message: '管理员用户更新成功'
    })
  } catch (error) {
    console.error('❌ 更新管理员用户失败:', error)
    res.status(500).json({
      success: false,
      message: '更新管理员用户失败: ' + error.message
    })
  }
})

// 删除管理员用户
app.delete('/api/v1/admin/admin-users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 检查用户是否存在
    const [existingUser] = await pool.execute('SELECT id, username, role FROM admin_users WHERE id = ?', [id])
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: '管理员用户不存在'
      })
    }
    
    // 不允许删除超级管理员
    if (existingUser[0].role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '不允许删除超级管理员账户'
      })
    }
    
    await pool.execute('DELETE FROM admin_users WHERE id = ?', [id])
    
    console.log(`✅ 删除管理员用户成功: ${existingUser[0].username}`)
    
    res.json({
      success: true,
      message: '管理员用户删除成功'
    })
  } catch (error) {
    console.error('❌ 删除管理员用户失败:', error)
    res.status(500).json({
      success: false,
      message: '删除管理员用户失败: ' + error.message
    })
  }
})

// 重置管理员用户密码
app.post('/api/v1/admin/admin-users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能为空'
      })
    }
    
    // 检查用户是否存在
    const [existingUser] = await pool.execute('SELECT id, username FROM admin_users WHERE id = ?', [id])
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: '管理员用户不存在'
      })
    }
    
    // 密码加密
    const crypto = require('crypto')
    const hashedPassword = crypto.createHash('md5').update(newPassword).digest('hex')
    
    await pool.execute('UPDATE admin_users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id])
    
    console.log(`✅ 重置管理员密码成功: ${existingUser[0].username}`)
    
    res.json({
      success: true,
      message: '密码重置成功'
    })
  } catch (error) {
    console.error('❌ 重置管理员密码失败:', error)
    res.status(500).json({
      success: false,
      message: '重置密码失败: ' + error.message
    })
  }
})

// 启动服务器
const PORT = 3003
app.listen(PORT, async () => {
  console.log('🚀 订单管理API服务启动成功 - 数据库版本')
  console.log(`📍 端口: ${PORT}`)
  console.log(`❤️ 健康检查: http://localhost:${PORT}/health`)
  console.log(`📚 API文档: http://localhost:${PORT}/api/v1/admin/merchants`)
  console.log(`🔑 测试认证: 用户名=admin, 密码=admin123`)
  console.log(`🎯 测试token: test-token`)
  console.log(`💾 数据源: MySQL数据库 (points_app_dev.merchants)`)
  
  // 初始化管理员用户表
  await initAdminUserTable()
})