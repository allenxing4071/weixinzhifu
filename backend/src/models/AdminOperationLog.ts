/**
 * 管理员操作日志数据模型
 * 记录所有管理员操作，支持审计追踪
 */

import { RowDataPacket } from 'mysql2'
import { db } from '../config/database'

export interface AdminOperationLog {
  id: string
  adminId: string
  adminName?: string
  operationType: string
  operationDesc?: string
  targetType?: string
  targetId?: string
  requestMethod?: string
  requestUrl?: string
  requestParams?: any
  responseResult?: any
  ipAddress?: string
  userAgent?: string
  executionTime?: number
  status: 'success' | 'failure'
  errorMessage?: string
  createdAt: Date
}

export interface CreateLogData {
  adminId: string
  adminName?: string
  operationType: string
  operationDesc?: string
  targetType?: string
  targetId?: string
  requestMethod?: string
  requestUrl?: string
  requestParams?: any
  responseResult?: any
  ipAddress?: string
  userAgent?: string
  executionTime?: number
  status?: 'success' | 'failure'
  errorMessage?: string
}

export class AdminOperationLogModel {
  
  /**
   * 创建操作日志
   */
  static async create(data: CreateLogData): Promise<string> {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2)}`
      
      const query = `
        INSERT INTO admin_operation_logs (
          id, admin_id, admin_name, operation_type, operation_desc,
          target_type, target_id, request_method, request_url,
          ip_address, user_agent, execution_time,
          status, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `

      await db.execute(query, [
        logId,
        data.adminId,
        data.adminName,
        data.operationType,
        data.operationDesc,
        data.targetType,
        data.targetId,
        data.requestMethod,
        data.requestUrl,
        data.ipAddress,
        data.userAgent,
        data.executionTime,
        data.status || 'success',
        data.errorMessage
      ])

      return logId

    } catch (error) {
      console.error('❌ 创建操作日志失败:', error)
      // 日志记录失败不应影响主要业务，所以不抛出异常
      return ''
    }
  }

  /**
   * 查询操作日志列表
   */
  static async findAll(params: {
    page?: number
    pageSize?: number
    adminId?: string
    operationType?: string
    status?: string
    startDate?: string
    endDate?: string
    targetType?: string
    keyword?: string
  } = {}): Promise<{
    logs: AdminOperationLog[]
    total: number
    page: number
    pageSize: number
  }> {
    try {
      const { 
        page = 1, 
        pageSize = 50, 
        adminId, 
        operationType, 
        status, 
        startDate, 
        endDate,
        targetType,
        keyword 
      } = params
      const offset = (page - 1) * pageSize
      
      // 构建查询条件
      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []
      
      if (adminId) {
        whereClause += ' AND admin_id = ?'
        queryParams.push(adminId)
      }
      
      if (operationType) {
        whereClause += ' AND operation_type = ?'
        queryParams.push(operationType)
      }
      
      if (status) {
        whereClause += ' AND status = ?'
        queryParams.push(status)
      }
      
      if (targetType) {
        whereClause += ' AND target_type = ?'
        queryParams.push(targetType)
      }
      
      if (startDate) {
        whereClause += ' AND DATE(created_at) >= ?'
        queryParams.push(startDate)
      }
      
      if (endDate) {
        whereClause += ' AND DATE(created_at) <= ?'
        queryParams.push(endDate)
      }
      
      if (keyword) {
        whereClause += ' AND (admin_name LIKE ? OR operation_desc LIKE ? OR request_url LIKE ?)'
        const keywordPattern = `%${keyword}%`
        queryParams.push(keywordPattern, keywordPattern, keywordPattern)
      }

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM admin_operation_logs
        ${whereClause}
      `
      const [countRows] = await db.execute<RowDataPacket[]>(countQuery, queryParams)
      const total = countRows[0].total

      // 查询列表数据
      const listQuery = `
        SELECT *
        FROM admin_operation_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `
      
      const [rows] = await db.execute<RowDataPacket[]>(
        listQuery, 
        [...queryParams, pageSize, offset]
      )
      
      const logs = rows.map(row => this.mapRowToLog(row))
      
      return {
        logs,
        total,
        page,
        pageSize
      }
      
    } catch (error) {
      console.error('❌ 查询操作日志失败:', error)
      throw new Error('查询操作日志失败')
    }
  }

  /**
   * 根据ID查找操作日志
   */
  static async findById(id: string): Promise<AdminOperationLog | null> {
    try {
      const query = 'SELECT * FROM admin_operation_logs WHERE id = ?'
      const [rows] = await db.execute<RowDataPacket[]>(query, [id])
      
      if (rows.length === 0) {
        return null
      }
      
      return this.mapRowToLog(rows[0])
      
    } catch (error) {
      console.error('❌ 查询操作日志详情失败:', error)
      throw new Error('查询操作日志详情失败')
    }
  }

  /**
   * 获取操作统计信息
   */
  static async getOperationStats(params: {
    adminId?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<{
    totalOperations: number
    successOperations: number
    failureOperations: number
    operationTypes: Array<{
      type: string
      count: number
    }>
    dailyStats: Array<{
      date: string
      count: number
    }>
  }> {
    try {
      const { adminId, startDate, endDate } = params
      
      // 构建查询条件
      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []
      
      if (adminId) {
        whereClause += ' AND admin_id = ?'
        queryParams.push(adminId)
      }
      
      if (startDate) {
        whereClause += ' AND DATE(created_at) >= ?'
        queryParams.push(startDate)
      }
      
      if (endDate) {
        whereClause += ' AND DATE(created_at) <= ?'
        queryParams.push(endDate)
      }

      // 总体统计
      const totalQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failure
        FROM admin_operation_logs
        ${whereClause}
      `
      const [totalRows] = await db.execute<RowDataPacket[]>(totalQuery, queryParams)
      const totalStats = totalRows[0]

      // 操作类型统计
      const typeQuery = `
        SELECT 
          operation_type as type,
          COUNT(*) as count
        FROM admin_operation_logs
        ${whereClause}
        GROUP BY operation_type
        ORDER BY count DESC
        LIMIT 10
      `
      const [typeRows] = await db.execute<RowDataPacket[]>(typeQuery, queryParams)

      // 每日统计（最近7天）
      const dailyQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM admin_operation_logs
        ${whereClause}
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
      const [dailyRows] = await db.execute<RowDataPacket[]>(dailyQuery, queryParams)

      return {
        totalOperations: totalStats.total,
        successOperations: totalStats.success,
        failureOperations: totalStats.failure,
        operationTypes: typeRows.map(row => ({
          type: row.type,
          count: row.count
        })),
        dailyStats: dailyRows.map(row => ({
          date: row.date,
          count: row.count
        }))
      }
      
    } catch (error) {
      console.error('❌ 获取操作统计失败:', error)
      throw new Error('获取操作统计失败')
    }
  }

  /**
   * 删除旧日志记录（超过90天）
   */
  static async deleteOldLogs(): Promise<number> {
    try {
      const query = `
        DELETE FROM admin_operation_logs 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
      `
      
      const [result] = await db.execute(query)
      return (result as any).affectedRows

    } catch (error) {
      console.error('❌ 删除旧日志记录失败:', error)
      throw new Error('删除旧日志记录失败')
    }
  }

  /**
   * 导出操作日志
   */
  static async exportLogs(params: {
    adminId?: string
    operationType?: string
    startDate?: string
    endDate?: string
    format?: 'json' | 'csv'
  }): Promise<AdminOperationLog[]> {
    try {
      const { adminId, operationType, startDate, endDate } = params
      
      // 构建查询条件
      let whereClause = 'WHERE 1=1'
      const queryParams: any[] = []
      
      if (adminId) {
        whereClause += ' AND admin_id = ?'
        queryParams.push(adminId)
      }
      
      if (operationType) {
        whereClause += ' AND operation_type = ?'
        queryParams.push(operationType)
      }
      
      if (startDate) {
        whereClause += ' AND DATE(created_at) >= ?'
        queryParams.push(startDate)
      }
      
      if (endDate) {
        whereClause += ' AND DATE(created_at) <= ?'
        queryParams.push(endDate)
      }

      const query = `
        SELECT *
        FROM admin_operation_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 10000
      `
      
      const [rows] = await db.execute<RowDataPacket[]>(query, queryParams)
      
      return rows.map(row => this.mapRowToLog(row))
      
    } catch (error) {
      console.error('❌ 导出操作日志失败:', error)
      throw new Error('导出操作日志失败')
    }
  }

  /**
   * 批量记录操作日志（用于中间件）
   */
  static async batchCreate(logs: CreateLogData[]): Promise<void> {
    if (logs.length === 0) return

    try {
      const values = logs.map(log => [
        `log_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        log.adminId,
        log.adminName,
        log.operationType,
        log.operationDesc,
        log.targetType,
        log.targetId,
        log.requestMethod,
        log.requestUrl,
        log.ipAddress,
        log.userAgent,
        log.executionTime,
        log.status || 'success',
        log.errorMessage
      ])

      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
      
      const query = `
        INSERT INTO admin_operation_logs (
          id, admin_id, admin_name, operation_type, operation_desc,
          target_type, target_id, request_method, request_url,
          ip_address, user_agent, execution_time,
          status, error_message, created_at
        ) VALUES ${placeholders}
      `

      const flatValues = values.flat()
      await db.execute(query, flatValues)

    } catch (error) {
      console.error('❌ 批量创建操作日志失败:', error)
      // 日志记录失败不应影响主要业务
    }
  }

  /**
   * 映射数据库行到Log对象
   */
  private static mapRowToLog(row: any): AdminOperationLog {
    return {
      id: row.id,
      adminId: row.admin_id,
      adminName: row.admin_name,
      operationType: row.operation_type,
      operationDesc: row.operation_desc,
      targetType: row.target_type,
      targetId: row.target_id,
      requestMethod: row.request_method,
      requestUrl: row.request_url,
      requestParams: row.request_params ? JSON.parse(row.request_params) : null,
      responseResult: row.response_result ? JSON.parse(row.response_result) : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      executionTime: row.execution_time,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at
    }
  }
}
