/**
 * 管理员会话数据模型
 * 管理JWT Token和登录会话
 */

import { RowDataPacket } from 'mysql2'
import { db } from '../config/database'

export interface AdminSession {
  id: string
  adminId: string
  sessionToken: string
  refreshToken?: string
  ipAddress?: string
  userAgent?: string
  expiresAt: Date
  lastActivityAt: Date
  status: 'active' | 'expired' | 'revoked'
  createdAt: Date
}

export interface CreateSessionData {
  adminId: string
  sessionToken: string
  refreshToken?: string
  ipAddress?: string
  userAgent?: string
  expiresAt: Date
}

export class AdminSessionModel {
  
  /**
   * 创建会话
   */
  static async create(data: CreateSessionData): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
      
      const query = `
        INSERT INTO admin_sessions (
          id, admin_id, session_token, refresh_token, 
          ip_address, user_agent, expires_at, 
          last_activity_at, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'active', NOW())
      `

      await db.execute(query, [
        sessionId,
        data.adminId,
        data.sessionToken,
        data.refreshToken,
        data.ipAddress,
        data.userAgent,
        data.expiresAt
      ])

      return sessionId

    } catch (error) {
      console.error('❌ 创建会话失败:', error)
      throw new Error('创建会话失败')
    }
  }

  /**
   * 根据Token查找会话
   */
  static async findByToken(token: string): Promise<AdminSession | null> {
    try {
      const query = `
        SELECT * FROM admin_sessions 
        WHERE session_token = ? AND status = 'active'
      `
      
      const [rows] = await db.execute<RowDataPacket[]>(query, [token])
      
      if (rows.length === 0) {
        return null
      }
      
      return this.mapRowToSession(rows[0])
      
    } catch (error) {
      console.error('❌ 查询会话失败:', error)
      throw new Error('查询会话失败')
    }
  }

  /**
   * 根据管理员ID查找活跃会话
   */
  static async findActiveByAdminId(adminId: string): Promise<AdminSession[]> {
    try {
      const query = `
        SELECT * FROM admin_sessions 
        WHERE admin_id = ? AND status = 'active' 
        ORDER BY last_activity_at DESC
      `
      
      const [rows] = await db.execute<RowDataPacket[]>(query, [adminId])
      
      return rows.map(row => this.mapRowToSession(row))
      
    } catch (error) {
      console.error('❌ 查询活跃会话失败:', error)
      throw new Error('查询活跃会话失败')
    }
  }

  /**
   * 更新会话活动时间
   */
  static async updateActivity(sessionId: string): Promise<void> {
    try {
      const query = `
        UPDATE admin_sessions 
        SET last_activity_at = NOW()
        WHERE id = ?
      `
      await db.execute(query, [sessionId])

    } catch (error) {
      console.error('❌ 更新会话活动时间失败:', error)
      throw new Error('更新会话活动时间失败')
    }
  }

  /**
   * 撤销单个会话
   */
  static async revokeByToken(token: string): Promise<void> {
    try {
      const query = `
        UPDATE admin_sessions 
        SET status = 'revoked'
        WHERE session_token = ?
      `
      await db.execute(query, [token])

    } catch (error) {
      console.error('❌ 撤销会话失败:', error)
      throw new Error('撤销会话失败')
    }
  }

  /**
   * 撤销管理员的所有会话
   */
  static async revokeAllByAdminId(adminId: string): Promise<void> {
    try {
      const query = `
        UPDATE admin_sessions 
        SET status = 'revoked'
        WHERE admin_id = ? AND status = 'active'
      `
      await db.execute(query, [adminId])

    } catch (error) {
      console.error('❌ 撤销所有会话失败:', error)
      throw new Error('撤销所有会话失败')
    }
  }

  /**
   * 清理过期会话
   */
  static async cleanExpiredSessions(): Promise<number> {
    try {
      const query = `
        UPDATE admin_sessions 
        SET status = 'expired'
        WHERE expires_at < NOW() AND status = 'active'
      `
      
      const [result] = await db.execute(query)
      return (result as any).affectedRows

    } catch (error) {
      console.error('❌ 清理过期会话失败:', error)
      throw new Error('清理过期会话失败')
    }
  }

  /**
   * 获取会话统计信息
   */
  static async getSessionStats(adminId?: string): Promise<{
    active: number
    expired: number
    revoked: number
    total: number
  }> {
    try {
      let query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM admin_sessions
      `
      const params: any[] = []
      
      if (adminId) {
        query += ' WHERE admin_id = ?'
        params.push(adminId)
      }
      
      query += ' GROUP BY status'
      
      const [rows] = await db.execute<RowDataPacket[]>(query, params)
      
      const stats = {
        active: 0,
        expired: 0,
        revoked: 0,
        total: 0
      }
      
      rows.forEach(row => {
        stats[row.status as keyof typeof stats] = row.count
        stats.total += row.count
      })
      
      return stats
      
    } catch (error) {
      console.error('❌ 获取会话统计失败:', error)
      throw new Error('获取会话统计失败')
    }
  }

  /**
   * 删除旧会话记录（超过30天）
   */
  static async deleteOldSessions(): Promise<number> {
    try {
      const query = `
        DELETE FROM admin_sessions 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `
      
      const [result] = await db.execute(query)
      return (result as any).affectedRows

    } catch (error) {
      console.error('❌ 删除旧会话记录失败:', error)
      throw new Error('删除旧会话记录失败')
    }
  }

  /**
   * 验证会话是否有效
   */
  static async isSessionValid(token: string): Promise<boolean> {
    try {
      const session = await this.findByToken(token)
      
      if (!session) {
        return false
      }
      
      // 检查是否过期
      const now = new Date()
      if (session.expiresAt < now) {
        // 标记为过期
        await this.revokeByToken(token)
        return false
      }
      
      // 更新活动时间
      await this.updateActivity(session.id)
      
      return true
      
    } catch (error) {
      console.error('❌ 验证会话失败:', error)
      return false
    }
  }

  /**
   * 映射数据库行到Session对象
   */
  private static mapRowToSession(row: any): AdminSession {
    return {
      id: row.id,
      adminId: row.admin_id,
      sessionToken: row.session_token,
      refreshToken: row.refresh_token,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      expiresAt: row.expires_at,
      lastActivityAt: row.last_activity_at,
      status: row.status,
      createdAt: row.created_at
    }
  }
}
