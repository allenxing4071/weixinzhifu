import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { initDatabase } from './config/database'
import { errorHandler, requestLogger } from './middleware/validation'
import config from './config'

// 路由导入
import authRoutes from './routes/auth'
import paymentRoutes from './routes/payment'
import pointsRoutes from './routes/points'

const app = express()

/**
 * 中间件配置
 */

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// CORS配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// 压缩中间件
app.use(compression())

// 请求解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
// 支付回调需要处理原始body（XML格式）
app.use('/api/v1/payments/callback', express.raw({ type: 'text/xml' }))

// 请求限流
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/', limiter)

// 请求日志
app.use(requestLogger)

/**
 * 路由配置
 */
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/points', pointsRoutes)

/**
 * 健康检查
 */
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    version: config.app.version,
    environment: config.app.env
  })
})

/**
 * API文档（开发环境）
 */
if (config.app.env === 'development') {
  app.get('/api/docs', (_req, res) => {
    res.json({
      title: '积分系统API文档',
      version: config.app.version,
      endpoints: {
        auth: {
          'POST /api/v1/auth/wechat-login': '微信登录',
          'GET /api/v1/auth/user-info': '获取用户信息',
          'PUT /api/v1/auth/user-info': '更新用户信息'
        },
        payments: {
          'POST /api/v1/payments': '创建支付订单',
          'GET /api/v1/payments/:orderId': '查询订单状态',
          'POST /api/v1/payments/callback': '支付回调',
          'GET /api/v1/payments/history': '支付历史'
        },
        points: {
          'GET /api/v1/points/balance': '获取积分余额',
          'GET /api/v1/points/history': '获取积分记录',
          'GET /api/v1/points/statistics': '获取积分统计'
        }
      }
    })
  })
}

/**
 * 404处理
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'API接口不存在',
    path: req.originalUrl
  })
})

/**
 * 错误处理
 */
app.use(errorHandler)

/**
 * 服务启动
 */
async function startServer(): Promise<void> {
  try {
    // 初始化数据库连接
    await initDatabase()
    console.log('✅ 数据库连接成功')
    
    // 启动HTTP服务
    const port = config.app.port
    app.listen(port, () => {
      console.log(`🚀 服务启动成功`)
      console.log(`📍 端口: ${port}`)
      console.log(`🌍 环境: ${config.app.env}`)
      console.log(`📚 API文档: http://localhost:${port}/api/docs`)
      console.log(`❤️  健康检查: http://localhost:${port}/health`)
    })
    
  } catch (error) {
    console.error('❌ 服务启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('🛑 收到关闭信号，正在优雅关闭...')
  // 这里可以添加数据库连接关闭等清理工作
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 收到中断信号，正在优雅关闭...')
  // 这里可以添加数据库连接关闭等清理工作
  process.exit(0)
})

// 启动服务
if (require.main === module) {
  startServer()
}

export default app
