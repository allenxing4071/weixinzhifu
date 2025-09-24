import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * 应用配置
 */
export const config = {
  // 服务配置
  app: {
    name: 'points-system-backend',
    version: '1.0.0',
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development'
  },
  
  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
    certPath: process.env.WECHAT_CERT_PATH || ''
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },
  
  // 积分配置
  points: {
    ratio: 1, // 1元 = 1积分
    expiryDays: 365, // 积分有效期(天)
    maxDaily: 10000 // 每日最大积分
  },
  
  // 安全配置
  security: {
    bcryptRounds: 12,
    rateLimitWindow: 15 * 60 * 1000, // 15分钟
    rateLimitMax: 1000 // 每窗口期最大请求数
  }
}

export default config
