// TypeORM 数据库配置

import { DataSource } from 'typeorm'
// import { User } from '../models/User'
// import { Merchant } from '../models/Merchant'
// import { PaymentOrder } from '../models/PaymentOrder'
// import { PointsRecord } from '../models/PointsRecord'
import { Admin } from '../models/Admin'
import { AdminRole } from '../models/AdminRole'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'points_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'points_app',
  charset: 'utf8mb4',
  timezone: '+08:00',
  entities: [
    // User,
    // Merchant,
    // PaymentOrder,
    // PointsRecord,
    Admin,
    AdminRole
  ],
  synchronize: process.env.NODE_ENV === 'development', // 仅在开发环境自动同步表结构
  logging: process.env.NODE_ENV === 'development',
  migrations: [],
  subscribers: [],
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000
  }
})

// 初始化TypeORM数据源
export const initTypeORM = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      console.log('✅ TypeORM数据源初始化成功')
    }
  } catch (error) {
    console.error('❌ TypeORM数据源初始化失败:', error)
    throw error
  }
}
