// 简化的测试服务器 - 专门用于测试订单管理功能
import express from 'express'
import cors from 'cors'
import { OrderController } from './controllers/admin/OrderController'

const app = express()

// 基础中间件
app.use(cors())
app.use(express.json())

// 简单的认证中间件
const simpleAuth = (req: any, res: any, next: any) => {
  // 简单验证 - 生产环境需要真实JWT
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token === 'test-token' || req.path.includes('health')) {
    next()
  } else {
    res.status(401).json({ success: false, message: '需要认证' })
  }
}

// 应用认证中间件
app.use('/api/v1/admin', simpleAuth)

// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: '订单管理API服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// 订单管理API路由
app.get('/api/v1/admin/orders', OrderController.getOrders)
app.get('/api/v1/admin/orders/stats', OrderController.getOrderStats)
app.get('/api/v1/admin/orders/:id', OrderController.getOrderDetail)
app.put('/api/v1/admin/orders/:id', OrderController.updateOrderStatus)
app.post('/api/v1/admin/orders/export', OrderController.exportOrders)

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

// 启动服务器
const PORT = 3003
app.listen(PORT, () => {
  console.log(`🚀 订单管理API服务启动成功`)
  console.log(`📍 端口: ${PORT}`)
  console.log(`❤️ 健康检查: http://localhost:${PORT}/health`)
  console.log(`📚 订单API: http://localhost:${PORT}/api/v1/admin/orders`)
  console.log(`🔑 测试认证: 用户名=admin, 密码=admin123`)
})

export default app