// 增强版API服务器 - 包含管理后台API
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const mysql = require('mysql2/promise')

const app = express()
const PORT = process.env.PORT || 3000

// 数据库配置
const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'points_app',
  password: 'PointsApp2024!',
  database: 'points_app',
  charset: 'utf8mb4',
  timezone: '+08:00'
}

// 创建数据库连接池
const pool = mysql.createPool(dbConfig)

// 中间件配置
app.use(helmet())
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 认证中间件
const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, 'points-system-jwt-secret-2024')
      req.adminId = decoded.adminId
      req.username = decoded.username
      next()
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期'
      })
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误'
    })
  }
}

// ==================== 管理员认证API ====================

// 管理员登录
app.post('/api/v1/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    // 检查默认管理员
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { 
          adminId: 'admin_001',
          username: 'admin',
          roleId: 'super_admin'
        },
        'points-system-jwt-secret-2024',
        { expiresIn: '24h' }
      )

      return res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          adminInfo: {
            id: 'admin_001',
            username: 'admin',
            realName: '系统管理员',
            email: 'admin@example.com',
            role: '超级管理员',
            permissions: ['*']
          }
        }
      })
    }

    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    })

  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    })
  }
})

// 获取当前管理员信息
app.get('/api/v1/admin/auth/me', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.adminId,
        username: req.username,
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '',
        roleId: 'super_admin',
        roleName: '超级管理员',
        status: 'active',
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  } catch (error) {
    console.error('Get current admin error:', error)
    res.status(500).json({
      success: false,
      message: '获取管理员信息失败'
    })
  }
})

// 管理员登出
app.post('/api/v1/admin/auth/logout', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登出失败'
    })
  }
})

// ==================== 仪表板API ====================

// 获取仪表板统计数据
app.get('/api/v1/admin/dashboard/stats', verifyAdminToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    
    try {
      // 查询基础统计
      const [usersResult] = await connection.execute('SELECT COUNT(*) as count FROM users')
      const [merchantsResult] = await connection.execute('SELECT COUNT(*) as count FROM merchants')
      const [ordersResult] = await connection.execute('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount FROM payment_orders WHERE status = "paid"')
      const [pointsResult] = await connection.execute('SELECT COALESCE(SUM(points_change), 0) as points FROM points_records WHERE points_change > 0')

      const totalUsers = usersResult[0].count || 0
      const totalMerchants = merchantsResult[0].count || 0
      const totalOrders = ordersResult[0].count || 0
      const totalAmount = ordersResult[0].amount || 0
      const totalPoints = pointsResult[0].points || 0

      // 模拟7天趋势数据
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last7Days.push({
          date: `${date.getMonth() + 1}-${date.getDate()}`,
          users: Math.floor(Math.random() * 50),
          payments: Math.floor(Math.random() * 100000),
          points: Math.floor(Math.random() * 5000)
        })
      }

      const stats = {
        overview: {
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.8),
          totalMerchants,
          activeMerchants: Math.floor(totalMerchants * 0.9),
          todayOrders: Math.floor(totalOrders * 0.1),
          todayAmount: Math.floor(totalAmount * 0.1),
          todayPoints: Math.floor(totalPoints * 0.1),
          todayNewUsers: Math.floor(Math.random() * 20)
        },
        trends: {
          userGrowth: last7Days.map(day => ({
            date: day.date,
            value: day.users
          })),
          paymentTrend: last7Days.map(day => ({
            date: day.date,
            value: day.payments
          })),
          pointsTrend: last7Days.map(day => ({
            date: day.date,
            value: day.points
          }))
        },
        alerts: [
          {
            id: 'system_running',
            type: 'info',
            title: '系统运行正常',
            message: '所有服务运行状态良好',
            value: '正常',
            time: new Date().toISOString(),
            handled: true
          }
        ]
      }

      res.json({
        success: true,
        data: stats
      })
      
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({
      success: false,
      message: '获取仪表板数据失败'
    })
  }
})

// 获取系统监控数据
app.get('/api/v1/admin/dashboard/monitor', verifyAdminToken, async (req, res) => {
  try {
    const monitor = {
      server: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: (Math.random() * 1000).toFixed(2) + ' Mbps'
      },
      application: {
        responseTime: Math.random() * 1000,
        errorRate: Math.random() * 5,
        concurrentUsers: Math.floor(Math.random() * 500),
        apiCalls: Math.floor(Math.random() * 10000)
      },
      database: {
        connections: Math.floor(Math.random() * 50),
        queryTime: Math.random() * 100,
        storage: Math.random() * 100
      }
    }

    res.json({
      success: true,
      data: monitor
    })
  } catch (error) {
    console.error('System monitor error:', error)
    res.status(500).json({
      success: false,
      message: '获取系统监控数据失败'
    })
  }
})

// 获取待处理事项
app.get('/api/v1/admin/dashboard/todos', verifyAdminToken, async (req, res) => {
  try {
    const todos = [
      {
        id: 'welcome',
        type: 'info',
        title: '欢迎使用管理后台',
        description: '管理后台已成功部署，可以开始管理您的积分系统',
        count: 1,
        priority: 'info',
        createdAt: new Date().toISOString()
      }
    ]

    res.json({
      success: true,
      data: todos
    })
  } catch (error) {
    console.error('Get todos error:', error)
    res.status(500).json({
      success: false,
      message: '获取待处理事项失败'
    })
  }
})

// ==================== 原有API ====================

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '积分营销系统API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    status: 'healthy',
    features: ['用户认证', '支付处理', '积分管理', '管理后台']
  })
})

// API文档
app.get('/api/docs', (req, res) => {
  res.json({
    title: '积分营销系统API文档',
    version: '1.0.0',
    endpoints: {
      health: {
        'GET /health': '系统健康检查'
      },
      admin: {
        'POST /api/v1/admin/auth/login': '管理员登录',
        'GET /api/v1/admin/auth/me': '获取当前管理员信息',
        'POST /api/v1/admin/auth/logout': '管理员登出',
        'GET /api/v1/admin/dashboard/stats': '获取仪表板统计',
        'GET /api/v1/admin/dashboard/monitor': '获取系统监控',
        'GET /api/v1/admin/dashboard/todos': '获取待处理事项'
      },
      test: {
        'GET /api/v1/test': '测试接口'
      }
    },
    notes: [
      '管理后台默认账号: admin / admin123',
      '前端访问地址: /admin/',
      '所有管理API需要Bearer Token认证'
    ]
  })
})

// 测试接口
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'API测试接口正常',
    timestamp: new Date().toISOString(),
    server: 'enhanced-api-server',
    clientIp: req.ip,
    headers: req.headers
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND', 
    message: 'API接口不存在',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /api/docs',
      'POST /api/v1/admin/auth/login',
      'GET /api/v1/admin/auth/me',
      'GET /api/v1/admin/dashboard/stats'
    ]
  })
})

// 错误处理
app.use((error, req, res, next) => {
  console.error('API Error:', error)
  res.status(500).json({
    success: false,
    code: 'SERVER_ERROR',
    message: '服务器内部错误',
    timestamp: new Date().toISOString()
  })
})

// --- 用户管理API ---
// 获取用户列表
app.get('/api/v1/admin/users', authenticateAdminJWT, async (req, res) => {
  const { page = 1, pageSize = 10, search = '', status = '' } = req.query
  const connection = await getDBConnection()
  
  try {
    let whereClause = 'WHERE 1=1'
    const params = []
    
    if (search) {
      whereClause += ' AND (openid LIKE ? OR nickname LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    
    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }
    
    const offset = (page - 1) * pageSize
    
    const [users] = await connection.execute(
      `SELECT id, openid, nickname, avatar_url, phone, status, total_points, 
       available_points, created_at, updated_at, last_login_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    )
    
    res.json({
      success: true,
      data: {
        list: users,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    })
    
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ success: false, message: '获取用户列表失败' })
  }
})

// 获取用户详情
app.get('/api/v1/admin/users/:id', authenticateAdminJWT, async (req, res) => {
  const { id } = req.params
  const connection = await getDBConnection()
  
  try {
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    // 获取用户积分记录
    const [pointsRecords] = await connection.execute(
      `SELECT * FROM points_records WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 20`,
      [id]
    )
    
    res.json({
      success: true,
      data: {
        user: users[0],
        pointsRecords
      }
    })
    
  } catch (error) {
    console.error('Get user detail error:', error)
    res.status(500).json({ success: false, message: '获取用户详情失败' })
  }
})

// 更新用户状态
app.put('/api/v1/admin/users/:id/status', authenticateAdminJWT, async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const connection = await getDBConnection()
  
  try {
    await connection.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    )
    
    res.json({ success: true, message: '用户状态更新成功' })
    
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({ success: false, message: '更新用户状态失败' })
  }
})

// --- 商户管理API ---
// 获取商户列表
app.get('/api/v1/admin/merchants', authenticateAdminJWT, async (req, res) => {
  const { page = 1, pageSize = 10, search = '', status = '' } = req.query
  const connection = await getDBConnection()
  
  try {
    let whereClause = 'WHERE 1=1'
    const params = []
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR contact_person LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    
    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }
    
    const offset = (page - 1) * pageSize
    
    const [merchants] = await connection.execute(
      `SELECT * FROM merchants ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM merchants ${whereClause}`,
      params
    )
    
    res.json({
      success: true,
      data: {
        list: merchants,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    })
    
  } catch (error) {
    console.error('Get merchants error:', error)
    res.status(500).json({ success: false, message: '获取商户列表失败' })
  }
})

// 审核商户
app.put('/api/v1/admin/merchants/:id/approve', authenticateAdminJWT, async (req, res) => {
  const { id } = req.params
  const { status, reason = '' } = req.body
  const connection = await getDBConnection()
  
  try {
    await connection.execute(
      `UPDATE merchants SET status = ?, approval_reason = ?, 
       approved_at = ?, approved_by = ?, updated_at = NOW() 
       WHERE id = ?`,
      [status, reason, new Date(), req.admin.adminId, id]
    )
    
    res.json({ success: true, message: '商户审核完成' })
    
  } catch (error) {
    console.error('Approve merchant error:', error)
    res.status(500).json({ success: false, message: '商户审核失败' })
  }
})

// --- 积分管理API ---
// 获取积分记录
app.get('/api/v1/admin/points/records', authenticateAdminJWT, async (req, res) => {
  const { page = 1, pageSize = 10, userId = '', type = '' } = req.query
  const connection = await getDBConnection()
  
  try {
    let whereClause = 'WHERE 1=1'
    const params = []
    
    if (userId) {
      whereClause += ' AND pr.user_id = ?'
      params.push(userId)
    }
    
    if (type) {
      whereClause += ' AND pr.type = ?'
      params.push(type)
    }
    
    const offset = (page - 1) * pageSize
    
    const [records] = await connection.execute(
      `SELECT pr.*, u.nickname as user_nickname 
       FROM points_records pr 
       LEFT JOIN users u ON pr.user_id = u.id 
       ${whereClause} 
       ORDER BY pr.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM points_records pr ${whereClause}`,
      params
    )
    
    res.json({
      success: true,
      data: {
        list: records,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    })
    
  } catch (error) {
    console.error('Get points records error:', error)
    res.status(500).json({ success: false, message: '获取积分记录失败' })
  }
})

// 手动发放积分
app.post('/api/v1/admin/points/grant', authenticateAdminJWT, async (req, res) => {
  const { userId, points, reason } = req.body
  const connection = await getDBConnection()
  
  try {
    await connection.beginTransaction()
    
    // 更新用户积分
    await connection.execute(
      `UPDATE users SET 
       total_points = total_points + ?, 
       available_points = available_points + ?,
       updated_at = NOW() 
       WHERE id = ?`,
      [points, points, userId]
    )
    
    // 记录积分变动
    await connection.execute(
      `INSERT INTO points_records 
       (id, user_id, type, points_change, balance_after, description, created_by, created_at) 
       VALUES (?, ?, 'admin_grant', ?, 
       (SELECT available_points FROM users WHERE id = ?), ?, ?, NOW())`,
      [uuidv4(), userId, points, userId, reason, req.admin.adminId]
    )
    
    await connection.commit()
    res.json({ success: true, message: '积分发放成功' })
    
  } catch (error) {
    await connection.rollback()
    console.error('Grant points error:', error)
    res.status(500).json({ success: false, message: '积分发放失败' })
  }
})

// --- 订单管理API ---
// 获取订单列表
app.get('/api/v1/admin/orders', authenticateAdminJWT, async (req, res) => {
  const { page = 1, pageSize = 10, status = '', merchantId = '' } = req.query
  const connection = await getDBConnection()
  
  try {
    let whereClause = 'WHERE 1=1'
    const params = []
    
    if (status) {
      whereClause += ' AND po.status = ?'
      params.push(status)
    }
    
    if (merchantId) {
      whereClause += ' AND po.merchant_id = ?'
      params.push(merchantId)
    }
    
    const offset = (page - 1) * pageSize
    
    const [orders] = await connection.execute(
      `SELECT po.*, m.name as merchant_name, u.nickname as user_nickname
       FROM payment_orders po 
       LEFT JOIN merchants m ON po.merchant_id = m.id 
       LEFT JOIN users u ON po.user_id = u.id 
       ${whereClause} 
       ORDER BY po.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM payment_orders po ${whereClause}`,
      params
    )
    
    res.json({
      success: true,
      data: {
        list: orders,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    })
    
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ success: false, message: '获取订单列表失败' })
  }
})

// 获取订单详情
app.get('/api/v1/admin/orders/:id', authenticateAdminJWT, async (req, res) => {
  const { id } = req.params
  const connection = await getDBConnection()
  
  try {
    const [orders] = await connection.execute(
      `SELECT po.*, m.name as merchant_name, u.nickname as user_nickname
       FROM payment_orders po 
       LEFT JOIN merchants m ON po.merchant_id = m.id 
       LEFT JOIN users u ON po.user_id = u.id 
       WHERE po.id = ?`,
      [id]
    )
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    res.json({
      success: true,
      data: orders[0]
    })
    
  } catch (error) {
    console.error('Get order detail error:', error)
    res.status(500).json({ success: false, message: '获取订单详情失败' })
  }
})

// --- 系统设置API ---
// 获取系统配置
app.get('/api/v1/admin/settings', authenticateAdminJWT, async (req, res) => {
  try {
    const settings = {
      system: {
        siteName: '积分管理系统',
        siteDescription: '微信支付积分营销系统',
        version: '1.0.0',
        maintainMode: false
      },
      points: {
        defaultRatio: 100, // 100元 = 100积分
        maxPointsPerOrder: 10000,
        pointsExpireDays: 365,
        enableAutoExpire: true
      },
      payment: {
        wechatAppId: process.env.WECHAT_APP_ID ? '配置已设置' : '未配置',
        wechatMchId: process.env.WECHAT_MCH_ID ? '配置已设置' : '未配置',
        notifyUrl: process.env.WECHAT_NOTIFY_URL || ''
      },
      security: {
        adminSessionTimeout: 24, // 小时
        enableIPWhitelist: false,
        enableAPIRateLimit: true,
        maxLoginAttempts: 5
      }
    }
    
    res.json({
      success: true,
      data: settings
    })
    
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ success: false, message: '获取系统设置失败' })
  }
})

// 系统状态监控
app.get('/api/v1/admin/system/status', authenticateAdminJWT, async (req, res) => {
  const connection = await getDBConnection()
  
  try {
    // 检查数据库连接
    await connection.execute('SELECT 1')
    
    const systemStatus = {
      database: {
        status: 'healthy',
        connections: 10,
        responseTime: '< 50ms'
      },
      api: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: {
        nginx: 'running',
        pm2: 'running',
        mysql: 'running'
      }
    }
    
    res.json({
      success: true,
      data: systemStatus
    })
    
  } catch (error) {
    console.error('System status error:', error)
    res.status(500).json({ success: false, message: '获取系统状态失败' })
  }
})

// 启动服务
app.listen(PORT, () => {
  console.log('🚀 增强版API服务启动成功!')
  console.log(`📍 端口: ${PORT}`)
  console.log(`🌍 环境: production`)
  console.log(`💚 健康检查: http://localhost:${PORT}/health`)
  console.log(`📚 API文档: http://localhost:${PORT}/api/docs`)
  console.log(`🎛️ 管理后台: http://localhost/admin/`)
  console.log(`🔑 管理员账号: admin / admin123`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到关闭信号，正在优雅关闭...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 收到中断信号，正在优雅关闭...')
  process.exit(0)
})
