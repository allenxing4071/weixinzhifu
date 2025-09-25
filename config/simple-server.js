// 简化版本的API服务器 - 用于快速验证生产环境
const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3000

// 中间件
app.use(cors())
app.use(express.json())

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '微信支付积分系统API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    status: 'healthy'
  })
})

// API文档接口
app.get('/api/docs', (req, res) => {
  res.json({
    title: '微信支付积分系统API',
    version: '1.0.0',
    description: '基于微信支付的积分赠送系统',
    endpoints: {
      'GET /health': '健康检查',
      'GET /api/docs': 'API文档',
      'POST /api/v1/auth/wechat-login': '微信登录',
      'GET /api/v1/points/balance': '积分余额查询',
      'POST /api/v1/payments': '创建支付订单'
    },
    status: 'development'
  })
})

// 测试接口
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: '测试接口调用成功',
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    }
  })
})

// 微信登录接口（简化版）
app.post('/api/v1/auth/wechat-login', (req, res) => {
  res.json({
    success: true,
    message: '登录接口已连通（简化版）',
    data: {
      token: 'demo_token_' + Date.now(),
      userInfo: {
        id: 'demo_user_001',
        nickname: '演示用户',
        pointsBalance: 0
      }
    }
  })
})

// 积分余额接口（简化版）  
app.get('/api/v1/points/balance', (req, res) => {
  res.json({
    success: true,
    message: '积分查询接口已连通（简化版）',
    data: {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      expiringPoints: 0
    }
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API接口不存在',
    path: req.originalUrl
  })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('API错误:', err)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '请联系技术支持'
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 简化版API服务启动成功!`)
  console.log(`📍 端口: ${PORT}`)
  console.log(`🌍 环境: production`)
  console.log(`💚 健康检查: http://localhost:${PORT}/health`)
  console.log(`📚 API文档: http://localhost:${PORT}/api/docs`)
  console.log(`🧪 测试接口: http://localhost:${PORT}/api/v1/test`)
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
