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
  
  // 微信支付服务商配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || 'wx07b7fe4a9e38dac3',
    appSecret: process.env.WECHAT_APP_SECRET || '0445537eb37f93f75fdd4d700a914124',
    mchId: process.env.WECHAT_SERVICE_MCH_ID || '1728807931', // 服务商商户号
    apiV3Key: process.env.WECHAT_API_V3_KEY || 'abcd1234efgh5678ijkl9012mnop3456',
    privateKey: process.env.WECHAT_PRIVATE_KEY || './certs/wechat_cert.pem',
    publicKey: process.env.WECHAT_PUBLIC_KEY || './certs/wechat_cert.pem',
    serialNo: process.env.WECHAT_SERIAL_NO || 'VyDxTbGc5XuLcSffPZPVhvBBJDM',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || 'https://api.guandongfang.cn/api/v1/payments/callback',
    serviceProviderMode: process.env.WECHAT_SERVICE_PROVIDER_MODE === 'true',
    defaultSubMchId: process.env.WECHAT_DEFAULT_SUB_MCH_ID || '1728807931'
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
