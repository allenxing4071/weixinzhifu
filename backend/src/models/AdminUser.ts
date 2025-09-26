/**
 * 管理员用户数据模型
 * 按照PRD权限管理要求设计
 */

import { RowDataPacket } from 'mysql2'
import { db } from '../config/database'

export interface AdminUser {
  id: string
  username: string
  passwordHash: string
  realName: string
  email?: string
  phone?: string
  roleId: string
  status: 'active' | 'inactive' | 'locked'
  lastLoginAt?: Date
  lastLoginIp?: string
  failedLoginCount: number
  lockedUntil?: Date
  createdBy?: string
  createdAt: Date
  updatedAt: Date
  // 关联数据
  role?: {
    id: string
    roleName: string
    roleCode: string
    permissions: string
    dataScope: string
  }
}

export interface CreateAdminUserData {
  id: string
  username: string
  passwordHash: string
  realName: string
  email?: string
  phone?: string
  roleId: string
  status?: 'active' | 'inactive'
  createdBy?: string
}

export interface UpdateAdminUserData {
  realName?: string
  email?: string
  phone?: string
  roleId?: string
  status?: 'active' | 'inactive' | 'locked'
}

export class AdminUserModel {
  
  /**
   * 根据用户名查找管理员
   */
  static async findByUsername(username: string): Promise<AdminUser | null> {
    try {
      const query = `
        SELECT 
          au.*,
          ar.id as role_id,
          ar.role_name,
          ar.role_code,
          ar.permissions,
          ar.data_scope
        FROM admin_users au
        LEFT JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.username = ?
      `
      
      const [rows] = await db.execute<RowDataPacket[]>(query, [username])
      
      if (rows.length === 0) {
        return null
      }
      
      const row = rows[0]
      return this.mapRowToAdminUser(row)
      
    } catch (error) {
      console.error('❌ 查询管理员失败:', error)
      throw new Error('查询管理员失败')
    }
  }

  /**
   * 根据ID查找管理员
   */
  static async findById(id: string): Promise<AdminUser | null> {
    try {
      const query = `
        SELECT 
          au.*,
          ar.id as role_id,
          ar.role_name,
          ar.role_code,
          ar.permissions,
          ar.data_scope
        FROM admin_users au
        LEFT JOIN admin_roles ar ON au.role_id = ar.id
        WHERE au.id = ?
      `
      
      const [rows] = await db.execute<RowDataPacket[]>(query, [id])
      
      if (rows.length === 0) {
        return null
      }
      
      const row = rows[0]
      return this.mapRowToAdminUser(row)
      
    } catch (error) {
      console.error('❌ 查询管理员失败:', error)
      throw new Error('查询管理员失败')
    }
  }

  /**
   * 获取管理员列表
   */
  static async findAll(params: {
    page?: number
    pageSize?: number
    status?: string
    roleId?: string
    keyword?: string
  } = {}): Promise<{
    admins: AdminUser[]
    total: number
    page: number
    pageSize: number
  }> {
    try {
      const { page = 1, pageSize = 20, status, roleId, keyword } = params
      const offset = (page - 1) * pageSize
      
      // 构建查询条件
      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []
      
      if (status) {
        whereClause += ' AND au.status = ?'
        queryParams.push(status)
      }
      
      if (roleId) {
        whereClause += ' AND au.role_id = ?'
        queryParams.push(roleId)
      }
      
      if (keyword) {
        whereClause += ' AND (au.username LIKE ? OR au.real_name LIKE ? OR au.email LIKE ?)'
        const keywordPattern = `%${keyword}%`
        queryParams.push(keywordPattern, keywordPattern, keywordPattern)
      }

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM admin_users au
        ${whereClause}
      `
      const [countRows] = await db.execute<RowDataPacket[]>(countQuery, queryParams)
      const total = countRows[0].total

      // 查询列表数据
      const listQuery = `
        SELECT 
          au.*,
          ar.role_name,
          ar.role_code,
          ar.permissions,
          ar.data_scope
        FROM admin_users au
        LEFT JOIN admin_roles ar ON au.role_id = ar.id
        ${whereClause}
        ORDER BY au.created_at DESC
        LIMIT ? OFFSET ?
      `
      
      const [rows] = await db.execute<RowDataPacket[]>(
        listQuery, 
        [...queryParams, pageSize, offset]
      )
      
      const admins = rows.map(row => this.mapRowToAdminUser(row))
      
      return {
        admins,
        total,
        page,
        pageSize
      }
      
    } catch (error) {
      console.error('❌ 查询管理员列表失败:', error)
      throw new Error('查询管理员列表失败')
    }
  }

  /**
   * 创建管理员
   */
  static async create(data: CreateAdminUserData): Promise<string> {
    try {
      const {
        id,
        username,
        passwordHash,
        realName,
        email,
        phone,
        roleId,
        status = 'active',
        createdBy
      } = data

      const query = `
        INSERT INTO admin_users (
          id, username, password_hash, real_name, email, phone,
          role_id, status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `

      await db.execute(query, [
        id, username, passwordHash, realName, email, phone,
        roleId, status, createdBy
      ])

      return id

    } catch (error) {
      console.error('❌ 创建管理员失败:', error)
      
      if ((error as any).code === 'ER_DUP_ENTRY') {
        throw new Error('用户名已存在')
      }
      
      throw new Error('创建管理员失败')
    }
  }

  /**
   * 更新管理员信息
   */
  static async update(id: string, data: UpdateAdminUserData): Promise<void> {
    try {
      const updateFields: string[] = []
      const updateValues: any[] = []

      if (data.realName !== undefined) {
        updateFields.push('real_name = ?')
        updateValues.push(data.realName)
      }

      if (data.email !== undefined) {
        updateFields.push('email = ?')
        updateValues.push(data.email)
      }

      if (data.phone !== undefined) {
        updateFields.push('phone = ?')
        updateValues.push(data.phone)
      }

      if (data.roleId !== undefined) {
        updateFields.push('role_id = ?')
        updateValues.push(data.roleId)
      }

      if (data.status !== undefined) {
        updateFields.push('status = ?')
        updateValues.push(data.status)
      }

      if (updateFields.length === 0) {
        return
      }

      updateFields.push('updated_at = NOW()')
      updateValues.push(id)

      const query = `
        UPDATE admin_users 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `

      await db.execute(query, updateValues)

    } catch (error) {
      console.error('❌ 更新管理员失败:', error)
      throw new Error('更新管理员失败')
    }
  }

  /**
   * 删除管理员（软删除）
   */
  static async delete(id: string): Promise<void> {
    try {
      const query = 'UPDATE admin_users SET status = ?, updated_at = NOW() WHERE id = ?'
      await db.execute(query, ['inactive', id])

    } catch (error) {
      console.error('❌ 删除管理员失败:', error)
      throw new Error('删除管理员失败')
    }
  }

  /**
   * 更新登录信息
   */
  static async updateLoginInfo(id: string, ipAddress: string): Promise<void> {
    try {
      const query = `
        UPDATE admin_users 
        SET last_login_at = NOW(), 
            last_login_ip = ?, 
            failed_login_count = 0,
            updated_at = NOW()
        WHERE id = ?
      `
      await db.execute(query, [ipAddress, id])

    } catch (error) {
      console.error('❌ 更新登录信息失败:', error)
      throw new Error('更新登录信息失败')
    }
  }

  /**
   * 更新登录失败次数
   */
  static async updateFailedLoginCount(id: string, count: number): Promise<void> {
    try {
      const query = `
        UPDATE admin_users 
        SET failed_login_count = ?, updated_at = NOW()
        WHERE id = ?
      `
      await db.execute(query, [count, id])

    } catch (error) {
      console.error('❌ 更新失败次数失败:', error)
      throw new Error('更新失败次数失败')
    }
  }

  /**
   * 锁定用户
   */
  static async lockUser(id: string, lockedUntil: Date): Promise<void> {
    try {
      const query = `
        UPDATE admin_users 
        SET status = 'locked', 
            locked_until = ?, 
            updated_at = NOW()
        WHERE id = ?
      `
      await db.execute(query, [lockedUntil, id])

    } catch (error) {
      console.error('❌ 锁定用户失败:', error)
      throw new Error('锁定用户失败')
    }
  }

  /**
   * 解锁用户
   */
  static async unlockUser(id: string): Promise<void> {
    try {
      const query = `
        UPDATE admin_users 
        SET status = 'active', 
            locked_until = NULL, 
            failed_login_count = 0,
            updated_at = NOW()
        WHERE id = ?
      `
      await db.execute(query, [id])

    } catch (error) {
      console.error('❌ 解锁用户失败:', error)
      throw new Error('解锁用户失败')
    }
  }

  /**
   * 更新密码
   */
  static async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      const query = `
        UPDATE admin_users 
        SET password_hash = ?, updated_at = NOW()
        WHERE id = ?
      `
      await db.execute(query, [passwordHash, id])

    } catch (error) {
      console.error('❌ 更新密码失败:', error)
      throw new Error('更新密码失败')
    }
  }

  /**
   * 检查用户名是否存在
   */
  static async isUsernameExists(username: string, excludeId?: string): Promise<boolean> {
    try {
      let query = 'SELECT COUNT(*) as count FROM admin_users WHERE username = ?'
      const params: any[] = [username]
      
      if (excludeId) {
        query += ' AND id != ?'
        params.push(excludeId)
      }
      
      const [rows] = await db.execute<RowDataPacket[]>(query, params)
      return rows[0].count > 0

    } catch (error) {
      console.error('❌ 检查用户名失败:', error)
      throw new Error('检查用户名失败')
    }
  }

  /**
   * 映射数据库行到AdminUser对象
   */
  private static mapRowToAdminUser(row: any): AdminUser {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      realName: row.real_name,
      email: row.email,
      phone: row.phone,
      roleId: row.role_id,
      status: row.status,
      lastLoginAt: row.last_login_at,
      lastLoginIp: row.last_login_ip,
      failedLoginCount: row.failed_login_count || 0,
      lockedUntil: row.locked_until,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      role: row.role_name ? {
        id: row.role_id,
        roleName: row.role_name,
        roleCode: row.role_code,
        permissions: row.permissions || '',
        dataScope: row.data_scope || 'self'
      } : undefined
    }
  }
}
