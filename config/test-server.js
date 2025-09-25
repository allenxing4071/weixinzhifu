// 快速测试服务器
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3001

// 中间件
app.use(cors())
app.use(express.json())

// 模拟数据
let users = []
let orders = []
let pointsRecords = []

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '模拟API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'test'
  })
})

// 模拟微信登录
app.post('/api/v1/auth/wechat-login', (req, res) => {
  const { code, userInfo } = req.body
  
  // 模拟用户数据
  const user = {
    id: `user_${Date.now()}`,
    openid: `openid_${code || 'test'}`,
    nickname: userInfo?.nickName || '测试用户',
    avatar: userInfo?.avatarUrl || '',
    pointsBalance: 0,
    createdAt: new Date()
  }
  
  users.push(user)
  
  // 模拟JWT token
  const token = `mock_token_${user.id}`
  
  res.json({
    success: true,
    code: 'SUCCESS',
    message: '登录成功',
    data: {
      token,
      userInfo: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        pointsBalance: user.pointsBalance
      }
    }
  })
})

// 获取用户信息
app.get('/api/v1/auth/user-info', (req, res) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: '用户未登录'
    })
  }
  
  const token = authHeader.substring(7)
  const userId = token.replace('mock_token_', '')
  
  const user = users.find(u => u.id === userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      code: 'USER_NOT_FOUND',
      message: '用户不存在'
    })
  }
  
  res.json({
    success: true,
    code: 'SUCCESS',
    message: '获取成功',
    data: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      pointsBalance: user.pointsBalance,
      status: 'active',
      createdAt: user.createdAt
    }
  })
})

// 创建支付订单（模拟）
app.post('/api/v1/payments', (req, res) => {
  const { merchantId, amount, description } = req.body
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: '用户未登录'
    })
  }
  
  const token = authHeader.substring(7)
  const userId = token.replace('mock_token_', '')
  
  // 创建模拟订单
  const order = {
    id: `order_${Date.now()}`,
    orderNo: `NO${Date.now()}`,
    userId,
    merchantId,
    amount,
    pointsAwarded: 0,
    status: 'pending',
    description: description || '积分赠送支付',
    createdAt: new Date(),
    expiredAt: new Date(Date.now() + 60 * 60 * 1000)
  }
  
  orders.push(order)
  
  // 模拟微信支付参数
  const paymentParams = {
    timeStamp: Math.floor(Date.now() / 1000).toString(),
    nonceStr: Math.random().toString(36).substr(2, 15),
    package: `prepay_id=wx${Date.now()}`,
    signType: 'MD5',
    paySign: Math.random().toString(36).substr(2, 32).toUpperCase()
  }
  
  res.json({
    success: true,
    code: 'SUCCESS',
    message: '订单创建成功',
    data: {
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.amount,
      pointsToAward: Math.floor(amount / 100), // 1元=1积分
      paymentParams,
      expiresAt: order.expiredAt
    }
  })
})

// 模拟支付成功处理
app.post('/api/v1/payments/mock-success', (req, res) => {
  const { orderId } = req.body
  
  const order = orders.find(o => o.id === orderId)
  if (!order) {
    return res.status(404).json({
      success: false,
      code: 'ORDER_NOT_FOUND',
      message: '订单不存在'
    })
  }
  
  // 更新订单状态
  order.status = 'paid'
  order.paidAt = new Date()
  order.pointsAwarded = Math.floor(order.amount / 100)
  order.transactionId = `mock_tx_${Date.now()}`
  
  // 更新用户积分
  const user = users.find(u => u.id === order.userId)
  if (user) {
    user.pointsBalance += order.pointsAwarded
    
    // 创建积分记录
    const pointsRecord = {
      id: `points_${Date.now()}`,
      userId: user.id,
      orderId: order.id,
      pointsChange: order.pointsAwarded,
      pointsBalance: user.pointsBalance,
      source: 'payment_reward',
      description: `支付订单${order.orderNo}获得积分`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
    
    pointsRecords.push(pointsRecord)
  }
  
  res.json({
    success: true,
    code: 'SUCCESS',
    message: '支付处理成功',
    data: {
      orderId: order.id,
      pointsAwarded: order.pointsAwarded,
      newBalance: user?.pointsBalance || 0
    }
  })
})

// 查询订单状态
app.get('/api/v1/payments/:orderId', (req, res) => {
  const { orderId } = req.params
  
  const order = orders.find(o => o.id === orderId)
  if (!order) {
    return res.status(404).json({
      success: false,
      code: 'ORDER_NOT_FOUND',
      message: '订单不存在'
    })
  }
  
  res.json({
    success: true,
    code: 'SUCCESS',
    message: '查询成功',
    data: {
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      amount: order.amount,
      pointsAwarded: order.pointsAwarded,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      expiredAt: order.expiredAt
    }
  })
})

// 获取积分余额
app.get('/api/v1/points/balance', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: '用户未登录'
    })
  }
  
  const token = authHeader.substring(7)
  const userId = token.replace('mock_token_', '')
  
  const user = users.find(u => u.id === userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      code: 'USER_NOT_FOUND',
      message: '用户不存在'
    })
  }
  
  const userRecords = pointsRecords.filter(r => r.userId === userId)
  const totalEarned = userRecords.filter(r => r.pointsChange > 0).reduce((sum, r) => sum + r.pointsChange, 0)
  const totalSpent = userRecords.filter(r => r.pointsChange < 0).reduce((sum, r) => sum + Math.abs(r.pointsChange), 0)
  
  res.json({
    success: true,
    code: 'SUCCESS',
    message: '查询成功',
    data: {
      balance: user.pointsBalance,
      totalEarned,
      totalSpent,
      expiringPoints: 0
    }
  })
})

// 获取积分记录
app.get('/api/v1/points/history', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: '用户未登录'
    })
  }
  
  const token = authHeader.substring(7)
  const userId = token.replace('mock_token_', '')
  
  const userRecords = pointsRecords
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  res.json({
    success: true,
    code: 'SUCCESS',
    message: '查询成功',
    data: {
      records: userRecords,
      pagination: {
        page: 1,
        pageSize: 20,
        total: userRecords.length,
        totalPages: Math.ceil(userRecords.length / 20)
      }
    }
  })
})

// API文档
app.get('/api/docs', (req, res) => {
  res.json({
    title: '积分系统模拟API文档',
    version: '1.0.0',
    mode: 'MOCK',
    endpoints: {
      auth: {
        'POST /api/v1/auth/wechat-login': '微信登录（模拟）',
        'GET /api/v1/auth/user-info': '获取用户信息'
      },
      payments: {
        'POST /api/v1/payments': '创建支付订单（模拟）',
        'POST /api/v1/payments/mock-success': '模拟支付成功',
        'GET /api/v1/payments/:orderId': '查询订单状态'
      },
      points: {
        'GET /api/v1/points/balance': '获取积分余额',
        'GET /api/v1/points/history': '获取积分记录'
      }
    },
    mockData: {
      users: users.length,
      orders: orders.length,
      pointsRecords: pointsRecords.length
    }
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'API接口不存在',
    path: req.originalUrl
  })
})

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 模拟API服务启动成功`)
  console.log(`📍 端口: ${PORT}`)
  console.log(`🌍 环境: 模拟测试`)
  console.log(`📚 API文档: http://localhost:${PORT}/api/docs`)
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`)
  console.log('')
  console.log('🧪 模拟测试说明：')
  console.log('- 所有数据存储在内存中，重启后清空')
  console.log('- 微信登录无需真实code')
  console.log('- 支付使用模拟流程')
  console.log('- 积分1:1发放正常工作')
})

module.exports = app
