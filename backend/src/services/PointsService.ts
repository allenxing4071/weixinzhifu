import { PointsRecordModel, CreatePointsRecordData } from '../models/PointsRecord'
import { UserModel } from '../models/User'
import { getDBConnection } from '../config/database'
import config from '../config/index'

export class PointsService {
  /**
   * 发放积分（事务保证）
   */
  static async awardPoints(
    userId: string,
    points: number,
    source: 'payment_reward' | 'admin_adjust',
    description: string,
    orderId?: string
  ): Promise<void> {
    if (points <= 0) {
      throw new Error('积分数量必须大于0')
    }
    
    const connection = await getDBConnection()
    
    // 开始事务
    await connection.beginTransaction()
    
    try {
      // 1. 查询用户当前余额
      const user = await UserModel.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }
      
      // 2. 计算新余额
      const newBalance = user.pointsBalance + points
      
      // 3. 更新用户余额
      const balanceUpdated = await UserModel.updatePointsBalance(userId, newBalance)
      if (!balanceUpdated) {
        throw new Error('用户积分余额更新失败')
      }
      
      // 4. 创建积分记录
      const expiresAt = new Date(Date.now() + config.points.expiryDays * 24 * 60 * 60 * 1000)
      
      const recordData: CreatePointsRecordData = {
        userId,
        orderId,
        pointsChange: points,
        pointsBalance: newBalance,
        source,
        description,
        expiresAt: source === 'payment_reward' ? expiresAt : undefined
      }
      
      await PointsRecordModel.create(recordData)
      
      // 提交事务
      await connection.commit()
      
      console.log(`✅ 积分发放成功: 用户${userId}, 积分${points}, 余额${newBalance}`)
      
    } catch (error) {
      // 回滚事务
      await connection.rollback()
      console.error('积分发放失败:', error)
      throw error
    }
  }
  
  /**
   * 查询用户积分余额
   */
  static async getUserPointsBalance(userId: string): Promise<{
    balance: number
    totalEarned: number
    totalSpent: number
    expiringPoints: number
  }> {
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    const connection = await getDBConnection()
    
    // 查询总获得积分
    const [earnedResult] = await connection.execute(
      `SELECT COALESCE(SUM(points_change), 0) as totalEarned 
       FROM points_records 
       WHERE user_id = ? AND points_change > 0`,
      [userId]
    ) as any
    
    // 查询总消费积分
    const [spentResult] = await connection.execute(
      `SELECT COALESCE(SUM(ABS(points_change)), 0) as totalSpent 
       FROM points_records 
       WHERE user_id = ? AND points_change < 0`,
      [userId]
    ) as any
    
    // 查询即将过期积分（30天内）
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const [expiringResult] = await connection.execute(
      `SELECT COALESCE(SUM(points_change), 0) as expiringPoints 
       FROM points_records 
       WHERE user_id = ? 
       AND points_change > 0 
       AND expires_at IS NOT NULL 
       AND expires_at <= ? 
       AND expires_at > NOW()`,
      [userId, futureDate]
    ) as any
    
    return {
      balance: user.pointsBalance,
      totalEarned: earnedResult[0].totalEarned,
      totalSpent: spentResult[0].totalSpent,
      expiringPoints: expiringResult[0].expiringPoints
    }
  }
  
  /**
   * 查询用户积分记录
   */
  static async getUserPointsHistory(
    userId: string,
    source?: 'payment_reward' | 'mall_consumption' | 'admin_adjust' | 'expired_deduct',
    page: number = 1,
    pageSize: number = 20
  ) {
    return PointsRecordModel.getUserPointsHistory(userId, source, page, pageSize)
  }
  
  /**
   * 消费积分（为将来积分商城预留）
   */
  static async consumePoints(
    userId: string,
    points: number,
    description: string,
    orderId?: string
  ): Promise<void> {
    if (points <= 0) {
      throw new Error('消费积分数量必须大于0')
    }
    
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    if (user.pointsBalance < points) {
      throw new Error('积分余额不足')
    }
    
    const connection = await getDBConnection()
    
    // 开始事务
    await connection.beginTransaction()
    
    try {
      // 1. 计算新余额
      const newBalance = user.pointsBalance - points
      
      // 2. 更新用户余额
      const balanceUpdated = await UserModel.updatePointsBalance(userId, newBalance)
      if (!balanceUpdated) {
        throw new Error('用户积分余额更新失败')
      }
      
      // 3. 创建消费记录
      const recordData: CreatePointsRecordData = {
        userId,
        orderId,
        pointsChange: -points, // 负数表示消费
        pointsBalance: newBalance,
        source: 'mall_consumption',
        description
      }
      
      await PointsRecordModel.create(recordData)
      
      // 提交事务
      await connection.commit()
      
      console.log(`✅ 积分消费成功: 用户${userId}, 消费${points}, 余额${newBalance}`)
      
    } catch (error) {
      // 回滚事务
      await connection.rollback()
      console.error('积分消费失败:', error)
      throw error
    }
  }
  
  /**
   * 积分过期处理（定时任务）
   */
  static async processExpiredPoints(): Promise<void> {
    const connection = await getDBConnection()
    
    try {
      // 查询已过期的积分记录
      const [expiredRecords] = await connection.execute(
        `SELECT user_id, SUM(points_change) as expiredPoints 
         FROM points_records 
         WHERE expires_at IS NOT NULL 
         AND expires_at <= NOW() 
         AND points_change > 0 
         AND source != 'expired_deduct'
         GROUP BY user_id 
         HAVING expiredPoints > 0`
      ) as any
      
      // 处理每个用户的过期积分
      for (const record of expiredRecords) {
        await connection.beginTransaction()
        
        try {
          const user = await UserModel.findById(record.user_id)
          if (!user) continue
          
          const expiredPoints = record.expiredPoints
          const newBalance = Math.max(0, user.pointsBalance - expiredPoints)
          
          // 更新用户余额
          await UserModel.updatePointsBalance(record.user_id, newBalance)
          
          // 创建过期扣除记录
          const recordData: CreatePointsRecordData = {
            userId: record.user_id,
            pointsChange: -expiredPoints,
            pointsBalance: newBalance,
            source: 'expired_deduct',
            description: `积分过期扣除`
          }
          
          await PointsRecordModel.create(recordData)
          
          await connection.commit()
          console.log(`✅ 处理过期积分: 用户${record.user_id}, 扣除${expiredPoints}`)
          
        } catch (error) {
          await connection.rollback()
          console.error(`❌ 处理用户${record.user_id}过期积分失败:`, error)
        }
      }
      
    } catch (error) {
      console.error('积分过期处理失败:', error)
      throw error
    }
  }
  
  /**
   * 积分统计数据
   */
  static async getPointsStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalAwarded: number
    totalConsumed: number
    activeUsers: number
    averageBalance: number
  }> {
    const connection = await getDBConnection()
    
    let whereClause = ''
    const params: any[] = []
    
    if (startDate && endDate) {
      whereClause = 'WHERE created_at BETWEEN ? AND ?'
      params.push(startDate, endDate)
    }
    
    // 查询统计数据
    const [stats] = await connection.execute(
      `SELECT 
         COALESCE(SUM(CASE WHEN points_change > 0 THEN points_change ELSE 0 END), 0) as totalAwarded,
         COALESCE(SUM(CASE WHEN points_change < 0 THEN ABS(points_change) ELSE 0 END), 0) as totalConsumed,
         COUNT(DISTINCT user_id) as activeUsers
       FROM points_records 
       ${whereClause}`,
      params
    ) as any
    
    // 查询平均余额
    const [balanceStats] = await connection.execute(
      'SELECT AVG(points_balance) as averageBalance FROM users WHERE status = "active"'
    ) as any
    
    return {
      totalAwarded: stats[0].totalAwarded,
      totalConsumed: stats[0].totalConsumed,
      activeUsers: stats[0].activeUsers,
      averageBalance: Math.round(balanceStats[0].averageBalance || 0)
    }
  }
}
