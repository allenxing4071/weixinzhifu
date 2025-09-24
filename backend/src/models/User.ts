import { getDBConnection } from '@/config/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface User {
  id: string
  wechatId: string
  openid: string
  unionid?: string
  nickname: string
  avatar?: string
  phone?: string
  pointsBalance: number
  status: 'active' | 'inactive' | 'banned'
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  wechatId: string
  openid: string
  unionid?: string
  nickname: string
  avatar?: string
  phone?: string
}

export class UserModel {
  /**
   * 创建用户
   */
  static async create(userData: CreateUserData): Promise<User> {
    const connection = await getDBConnection()
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await connection.execute<ResultSetHeader>(
      `INSERT INTO users (id, wechat_id, openid, unionid, nickname, avatar, phone, points_balance, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        userData.wechatId,
        userData.openid,
        userData.unionid || null,
        userData.nickname,
        userData.avatar || null,
        userData.phone || null,
        0, // 初始积分为0
        'active'
      ]
    )
    
    return this.findById(userId) as Promise<User>
  }
  
  /**
   * 根据ID查找用户
   */
  static async findById(id: string): Promise<User | null> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )
    
    return rows.length > 0 ? rows[0] as User : null
  }
  
  /**
   * 根据openid查找用户
   */
  static async findByOpenid(openid: string): Promise<User | null> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    )
    
    return rows.length > 0 ? rows[0] as User : null
  }
  
  /**
   * 更新用户积分余额
   */
  static async updatePointsBalance(userId: string, newBalance: number): Promise<boolean> {
    const connection = await getDBConnection()
    
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE users SET points_balance = ?, updated_at = NOW() WHERE id = ?',
      [newBalance, userId]
    )
    
    return result.affectedRows > 0
  }
  
  /**
   * 更新用户信息
   */
  static async update(id: string, updateData: Partial<User>): Promise<boolean> {
    const connection = await getDBConnection()
    const fields = Object.keys(updateData).filter(key => key !== 'id')
    
    if (fields.length === 0) return false
    
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => updateData[field as keyof User])
    values.push(id)
    
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    )
    
    return result.affectedRows > 0
  }
}
