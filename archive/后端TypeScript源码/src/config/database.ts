import mysql from 'mysql2/promise'
import Redis from 'redis'
import { AppDataSource, initTypeORM } from './typeorm'

// 导出TypeORM数据源
export { AppDataSource }

/**
 * 数据库配置
 */
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'points_app_dev',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
}

/**
 * Redis配置
 */
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true
}

/**
 * 数据库连接池
 */
let pool: mysql.Pool | null = null

export const getDBConnection = async (): Promise<mysql.Pool> => {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

/**
 * Redis连接
 */
let redisClient: Redis.RedisClientType | null = null

export const getRedisClient = async (): Promise<Redis.RedisClientType> => {
  if (!redisClient) {
    redisClient = Redis.createClient(redisConfig)
    await redisClient.connect()
  }
  return redisClient
}

/**
 * 数据库初始化
 */
export const initDatabase = async (): Promise<void> => {
  // 初始化TypeORM（用于管理后台）
  await initTypeORM()
  
  // 初始化MySQL连接池（用于现有功能）
  const connection = await getDBConnection()
  
  // 测试连接
  await connection.execute('SELECT 1')
  console.log('✅ MySQL连接成功')
  
  // Redis连接暂时跳过，避免启动失败
  try {
    const redis = await getRedisClient()
    await redis.ping()
    console.log('✅ Redis连接成功')
  } catch (error) {
    console.log('⚠️ Redis连接失败，使用内存缓存模式')
  }
}

/**
 * 数据库关闭
 */
export const closeConnections = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
    console.log('✅ MySQL连接已关闭')
  }
  
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    console.log('✅ Redis连接已关闭')
  }
}
