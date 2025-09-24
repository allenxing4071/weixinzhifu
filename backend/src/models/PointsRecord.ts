import { getDBConnection } from '@/config/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface PointsRecord {
  id: string
  userId: string
  orderId?: string
  pointsChange: number // 积分变化量（正数为增加，负数为减少）
  pointsBalance: number // 变化后的余额
  source: 'payment_reward' | 'mall_consumption' | 'admin_adjust' | 'expired_deduct'
  description: string
  expiresAt?: Date // 积分过期时间
  createdAt: Date
}

export interface CreatePointsRecordData {
  userId: string
  orderId?: string
  pointsChange: number
  pointsBalance: number
  source: PointsRecord['source']
  description: string
  expiresAt?: Date
}

export class PointsRecordModel {
  /**
   * 创建积分记录
   */
  static async create(recordData: CreatePointsRecordData): Promise<PointsRecord> {
    const connection = await getDBConnection()
    const recordId = `points_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await connection.execute<ResultSetHeader>(
      `INSERT INTO points_records 
       (id, user_id, order_id, points_change, points_balance, source, description, expires_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        recordId,
        recordData.userId,
        recordData.orderId || null,
        recordData.pointsChange,
        recordData.pointsBalance,
        recordData.source,
        recordData.description,
        recordData.expiresAt || null
      ]
    )
    
    return this.findById(recordId) as Promise<PointsRecord>
  }
  
  /**
   * 根据ID查找记录
   */
  static async findById(id: string): Promise<PointsRecord | null> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM points_records WHERE id = ?',
      [id]
    )
    
    return rows.length > 0 ? rows[0] as PointsRecord : null
  }
  
  /**
   * 查询用户积分记录
   */
  static async getUserPointsHistory(
    userId: string,
    source?: PointsRecord['source'],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{records: PointsRecord[], total: number}> {
    const connection = await getDBConnection()
    const offset = (page - 1) * pageSize
    
    let whereClause = 'WHERE user_id = ?'
    const params: any[] = [userId]
    
    if (source) {
      whereClause += ' AND source = ?'
      params.push(source)
    }
    
    // 查询记录列表
    const [records] = await connection.execute<RowDataPacket[]>(
      `SELECT pr.*, po.order_no, m.merchant_name 
       FROM points_records pr 
       LEFT JOIN payment_orders po ON pr.order_id = po.id 
       LEFT JOIN merchants m ON po.merchant_id = m.id 
       ${whereClause} 
       ORDER BY pr.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )
    
    // 查询总数
    const [countResult] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM points_records ${whereClause}`,
      params
    )
    
    return {
      records: records as PointsRecord[],
      total: countResult[0].total
    }
  }
  
  /**
   * 计算用户积分余额
   */
  static async calculateUserBalance(userId: string): Promise<number> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(points_change), 0) as balance 
       FROM points_records 
       WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    )
    
    return rows[0].balance || 0
  }
  
  /**
   * 查询即将过期的积分
   */
  static async getExpiringPoints(days: number = 30): Promise<PointsRecord[]> {
    const connection = await getDBConnection()
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM points_records 
       WHERE expires_at IS NOT NULL 
       AND expires_at <= ? 
       AND expires_at > NOW() 
       AND points_change > 0`,
      [futureDate]
    )
    
    return rows as PointsRecord[]
  }
}
