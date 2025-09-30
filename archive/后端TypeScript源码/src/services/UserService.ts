/**
 * 用户服务层 - 后台管理
 * 提供完整的用户数据查询、统计分析功能
 */

import { getDBConnection } from '../config/database'
import { RowDataPacket } from 'mysql2'

export interface UserListItem {
  id: string
  nickname: string
  phone?: string
  avatar?: string
  pointsBalance: number
  totalSpent: number
  totalOrders: number
  lastLoginAt?: Date
  createdAt: Date
  status: string
}

export interface UserDetail extends UserListItem {
  openid: string
  totalPointsEarned: number
  avgOrderAmount: number
  favoriteCategory?: string
  updatedAt: Date
}

export interface UserOrder {
  id: string
  orderNo: string
  merchantId: string
  merchantName: string
  amount: number
  pointsAwarded: number
  status: string
  description?: string
  paidAt?: Date
  createdAt: Date
}

export interface UserPointsRecord {
  id: string
  pointsChange: number
  pointsBalance: number
  source: string
  description?: string
  orderNo?: string
  merchantName?: string
  expiresAt?: Date
  createdAt: Date
}

export class UserService {

  /**
   * 获取用户列表
   */
  static async getUserList(params: {
    page: number
    pageSize: number
    keyword: string
    status: string
    registerDateStart: string
    registerDateEnd: string
    sortBy: string
    sortOrder: string
  }): Promise<{ users: UserListItem[], total: number }> {
    
    const connection = await getDBConnection()
    
    // 构建查询条件
    let whereClause = 'WHERE 1=1'
    const queryParams: any[] = []
    
    if (params.keyword) {
      whereClause += ' AND (u.nickname LIKE ? OR u.phone LIKE ?)'
      queryParams.push(`%${params.keyword}%`, `%${params.keyword}%`)
    }
    
    if (params.status) {
      whereClause += ' AND u.status = ?'
      queryParams.push(params.status)
    }
    
    if (params.registerDateStart) {
      whereClause += ' AND u.created_at >= ?'
      queryParams.push(params.registerDateStart)
    }
    
    if (params.registerDateEnd) {
      whereClause += ' AND u.created_at <= ?'
      queryParams.push(params.registerDateEnd)
    }

    // 构建排序
    const allowedSortFields = ['createdAt', 'pointsBalance', 'totalSpent', 'totalOrders', 'lastLoginAt']
    const sortField = allowedSortFields.includes(params.sortBy) ? params.sortBy : 'createdAt'
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC'
    
    // 字段映射
    const fieldMap: Record<string, string> = {
      'createdAt': 'u.created_at',
      'pointsBalance': 'user_stats.points_balance',
      'totalSpent': 'user_stats.total_spent',
      'totalOrders': 'user_stats.total_orders',
      'lastLoginAt': 'u.last_login_at'
    }

    const orderClause = `ORDER BY ${fieldMap[sortField]} ${sortOrder}`

    // 查询用户数据（包含统计信息）
    const userQuery = `
      SELECT 
        u.id,
        u.nickname,
        u.phone,
        u.avatar,
        u.last_login_at,
        u.created_at,
        u.status,
        COALESCE(user_stats.points_balance, 0) as points_balance,
        COALESCE(user_stats.total_spent, 0) as total_spent,
        COALESCE(user_stats.total_orders, 0) as total_orders
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(CASE WHEN source = 'payment' THEN points_change ELSE 0 END) as points_balance,
          COUNT(DISTINCT order_id) as total_orders,
          COALESCE(SUM(order_amount), 0) as total_spent
        FROM (
          SELECT 
            pr.user_id,
            pr.points_change,
            pr.source,
            po.id as order_id,
            po.amount as order_amount
          FROM points_records pr
          LEFT JOIN payment_orders po ON pr.order_id = po.id
        ) as combined_data
        GROUP BY user_id
      ) as user_stats ON u.id = user_stats.user_id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `

    const offset = (params.page - 1) * params.pageSize
    const [userRows] = await connection.execute(userQuery, [...queryParams, params.pageSize, offset])

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `
    const [countRows] = await connection.execute(countQuery, queryParams)
    const total = (countRows as RowDataPacket[])[0].total

    const users = (userRows as RowDataPacket[]).map(row => ({
      id: row.id,
      nickname: row.nickname,
      phone: row.phone,
      avatar: row.avatar,
      pointsBalance: parseInt(row.points_balance) || 0,
      totalSpent: parseInt(row.total_spent) || 0,
      totalOrders: parseInt(row.total_orders) || 0,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      status: row.status
    }))

    return { users, total }
  }

  /**
   * 获取用户详细信息
   */
  static async getUserDetail(userId: string): Promise<UserDetail | null> {
    const connection = await getDBConnection()

    const query = `
      SELECT 
        u.id,
        u.openid,
        u.nickname,
        u.phone,
        u.avatar,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        u.status,
        COALESCE(stats.points_balance, 0) as points_balance,
        COALESCE(stats.total_spent, 0) as total_spent,
        COALESCE(stats.total_orders, 0) as total_orders,
        COALESCE(stats.total_points_earned, 0) as total_points_earned,
        COALESCE(stats.avg_order_amount, 0) as avg_order_amount,
        stats.favorite_category
      FROM users u
      LEFT JOIN (
        SELECT 
          pr.user_id,
          SUM(CASE WHEN pr.points_change > 0 THEN pr.points_change ELSE 0 END) as points_balance,
          SUM(CASE WHEN pr.points_change > 0 THEN pr.points_change ELSE 0 END) as total_points_earned,
          COUNT(DISTINCT po.id) as total_orders,
          SUM(po.amount) as total_spent,
          AVG(po.amount) as avg_order_amount,
          (
            SELECT m.business_category 
            FROM payment_orders po2 
            JOIN merchants m ON po2.merchant_id = m.id 
            WHERE po2.user_id = pr.user_id 
            GROUP BY m.business_category 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
          ) as favorite_category
        FROM points_records pr
        LEFT JOIN payment_orders po ON pr.order_id = po.id
        WHERE pr.user_id = ?
        GROUP BY pr.user_id
      ) as stats ON u.id = stats.user_id
      WHERE u.id = ?
    `

    const [rows] = await connection.execute(query, [userId, userId])
    const userRows = rows as RowDataPacket[]

    if (userRows.length === 0) {
      return null
    }

    const row = userRows[0]
    return {
      id: row.id,
      openid: row.openid,
      nickname: row.nickname,
      phone: row.phone,
      avatar: row.avatar,
      pointsBalance: parseInt(row.points_balance) || 0,
      totalSpent: parseInt(row.total_spent) || 0,
      totalOrders: parseInt(row.total_orders) || 0,
      totalPointsEarned: parseInt(row.total_points_earned) || 0,
      avgOrderAmount: parseFloat(row.avg_order_amount) || 0,
      favoriteCategory: row.favorite_category,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status
    }
  }

  /**
   * 获取用户订单记录
   */
  static async getUserOrders(userId: string, params: {
    page: number
    pageSize: number
    startDate: string
    endDate: string
    merchantId: string
  }): Promise<{ orders: UserOrder[], total: number, totalAmount: number, totalPoints: number }> {
    
    const connection = await getDBConnection()
    
    let whereClause = 'WHERE po.user_id = ?'
    const queryParams = [userId]
    
    if (params.startDate) {
      whereClause += ' AND po.created_at >= ?'
      queryParams.push(params.startDate)
    }
    
    if (params.endDate) {
      whereClause += ' AND po.created_at <= ?'
      queryParams.push(params.endDate)
    }
    
    if (params.merchantId) {
      whereClause += ' AND po.merchant_id = ?'
      queryParams.push(params.merchantId)
    }

    // 查询订单列表
    const ordersQuery = `
      SELECT 
        po.id,
        po.order_no,
        po.merchant_id,
        m.merchant_name,
        po.amount,
        po.points_awarded,
        po.status,
        po.description,
        po.paid_at,
        po.created_at
      FROM payment_orders po
      LEFT JOIN merchants m ON po.merchant_id = m.id
      ${whereClause}
      ORDER BY po.created_at DESC
      LIMIT ? OFFSET ?
    `

    const offset = (params.page - 1) * params.pageSize
    const [orderRows] = await connection.execute(ordersQuery, [...queryParams, params.pageSize, offset])

    // 查询汇总信息
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(po.amount), 0) as total_amount,
        COALESCE(SUM(po.points_awarded), 0) as total_points
      FROM payment_orders po
      ${whereClause}
    `
    const [summaryRows] = await connection.execute(summaryQuery, queryParams)
    const summary = (summaryRows as RowDataPacket[])[0]

    const orders = (orderRows as RowDataPacket[]).map(row => ({
      id: row.id,
      orderNo: row.order_no,
      merchantId: row.merchant_id,
      merchantName: row.merchant_name,
      amount: parseInt(row.amount),
      pointsAwarded: parseInt(row.points_awarded),
      status: row.status,
      description: row.description,
      paidAt: row.paid_at,
      createdAt: row.created_at
    }))

    return {
      orders,
      total: summary.total,
      totalAmount: parseInt(summary.total_amount),
      totalPoints: parseInt(summary.total_points)
    }
  }

  /**
   * 获取用户积分记录
   */
  static async getUserPoints(userId: string, params: {
    page: number
    pageSize: number
    source: string
    startDate: string
    endDate: string
  }): Promise<{ 
    records: UserPointsRecord[], 
    total: number, 
    totalEarned: number, 
    totalSpent: number, 
    currentBalance: number 
  }> {
    
    const connection = await getDBConnection()
    
    let whereClause = 'WHERE pr.user_id = ?'
    const queryParams = [userId]
    
    if (params.source) {
      whereClause += ' AND pr.source = ?'
      queryParams.push(params.source)
    }
    
    if (params.startDate) {
      whereClause += ' AND pr.created_at >= ?'
      queryParams.push(params.startDate)
    }
    
    if (params.endDate) {
      whereClause += ' AND pr.created_at <= ?'
      queryParams.push(params.endDate)
    }

    // 查询积分记录
    const recordsQuery = `
      SELECT 
        pr.id,
        pr.points_change,
        pr.points_balance,
        pr.source,
        pr.description,
        pr.expires_at,
        pr.created_at,
        po.order_no,
        m.merchant_name
      FROM points_records pr
      LEFT JOIN payment_orders po ON pr.order_id = po.id
      LEFT JOIN merchants m ON po.merchant_id = m.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT ? OFFSET ?
    `

    const offset = (params.page - 1) * params.pageSize
    const [recordRows] = await connection.execute(recordsQuery, [...queryParams, params.pageSize, offset])

    // 查询汇总信息
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN pr.points_change > 0 THEN pr.points_change ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN pr.points_change < 0 THEN ABS(pr.points_change) ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(pr.points_change), 0) as current_balance
      FROM points_records pr
      ${whereClause}
    `
    const [summaryRows] = await connection.execute(summaryQuery, queryParams)
    const summary = (summaryRows as RowDataPacket[])[0]

    const records = (recordRows as RowDataPacket[]).map(row => ({
      id: row.id,
      pointsChange: parseInt(row.points_change),
      pointsBalance: parseInt(row.points_balance),
      source: row.source,
      description: row.description,
      orderNo: row.order_no,
      merchantName: row.merchant_name,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    }))

    return {
      records,
      total: summary.total,
      totalEarned: parseInt(summary.total_earned),
      totalSpent: parseInt(summary.total_spent),
      currentBalance: parseInt(summary.current_balance)
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStatistics(userId: string, periodDays: number): Promise<any> {
    const connection = await getDBConnection()

    // 总体统计
    const overviewQuery = `
      SELECT 
        COALESCE(SUM(po.amount), 0) as total_spent,
        COUNT(po.id) as total_orders,
        COALESCE(SUM(po.points_awarded), 0) as total_points,
        COALESCE(AVG(po.amount), 0) as avg_order_amount,
        DATEDIFF(NOW(), u.created_at) as registration_days
      FROM users u
      LEFT JOIN payment_orders po ON u.id = po.user_id AND po.status = 'paid'
      WHERE u.id = ?
      GROUP BY u.id, u.created_at
    `
    const [overviewRows] = await connection.execute(overviewQuery, [userId])
    const overview = (overviewRows as RowDataPacket[])[0] || {}

    // 周期统计
    const periodQuery = `
      SELECT 
        COALESCE(SUM(po.amount), 0) as period_spent,
        COUNT(po.id) as period_orders,
        COALESCE(SUM(po.points_awarded), 0) as period_points
      FROM payment_orders po
      WHERE po.user_id = ? 
        AND po.status = 'paid'
        AND po.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `
    const [periodRows] = await connection.execute(periodQuery, [userId, periodDays])
    const period = (periodRows as RowDataPacket[])[0] || {}

    // 商户分布统计
    const merchantStatsQuery = `
      SELECT 
        m.id as merchant_id,
        m.merchant_name,
        COUNT(po.id) as order_count,
        SUM(po.amount) as total_amount,
        SUM(po.points_awarded) as total_points,
        ROUND(COUNT(po.id) * 100.0 / (
          SELECT COUNT(*) FROM payment_orders WHERE user_id = ? AND status = 'paid'
        ), 2) as percentage
      FROM payment_orders po
      JOIN merchants m ON po.merchant_id = m.id
      WHERE po.user_id = ? AND po.status = 'paid'
      GROUP BY m.id, m.merchant_name
      ORDER BY total_amount DESC
      LIMIT 10
    `
    const [merchantRows] = await connection.execute(merchantStatsQuery, [userId, userId])

    // 月度趋势
    const monthlyTrendQuery = `
      SELECT 
        DATE_FORMAT(po.created_at, '%Y-%m') as month,
        COUNT(po.id) as order_count,
        SUM(po.amount) as total_amount,
        SUM(po.points_awarded) as total_points
      FROM payment_orders po
      WHERE po.user_id = ? 
        AND po.status = 'paid'
        AND po.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(po.created_at, '%Y-%m')
      ORDER BY month DESC
    `
    const [trendRows] = await connection.execute(monthlyTrendQuery, [userId])

    return {
      totalSpent: parseInt(overview.total_spent) || 0,
      totalOrders: parseInt(overview.total_orders) || 0,
      totalPoints: parseInt(overview.total_points) || 0,
      avgOrderAmount: parseFloat(overview.avg_order_amount) || 0,
      registrationDays: parseInt(overview.registration_days) || 0,
      periodSpent: parseInt(period.period_spent) || 0,
      periodOrders: parseInt(period.period_orders) || 0,
      periodPoints: parseInt(period.period_points) || 0,
      merchantStats: merchantRows as RowDataPacket[],
      monthlyTrend: trendRows as RowDataPacket[]
    }
  }

  /**
   * 用户商户分析
   */
  static async getUserMerchantAnalysis(userId: string): Promise<any> {
    const connection = await getDBConnection()

    // 商户维度分析
    const merchantAnalysisQuery = `
      SELECT 
        m.id as merchant_id,
        m.merchant_name,
        m.business_category,
        COUNT(po.id) as order_count,
        SUM(po.amount) as total_amount,
        SUM(po.points_awarded) as total_points,
        AVG(po.amount) as avg_order_amount,
        MIN(po.created_at) as first_order_at,
        MAX(po.created_at) as last_order_at,
        ROUND(SUM(po.amount) * 100.0 / (
          SELECT SUM(amount) FROM payment_orders WHERE user_id = ? AND status = 'paid'
        ), 2) as percentage,
        ROW_NUMBER() OVER (ORDER BY SUM(po.amount) DESC) as rank
      FROM payment_orders po
      JOIN merchants m ON po.merchant_id = m.id
      WHERE po.user_id = ? AND po.status = 'paid'
      GROUP BY m.id, m.merchant_name, m.business_category
      ORDER BY total_amount DESC
    `
    const [merchantRows] = await connection.execute(merchantAnalysisQuery, [userId, userId])

    // 类目分布
    const categoryQuery = `
      SELECT 
        m.business_category as name,
        COUNT(DISTINCT m.id) as merchant_count,
        COUNT(po.id) as order_count,
        SUM(po.amount) as total_amount,
        ROUND(SUM(po.amount) * 100.0 / (
          SELECT SUM(amount) FROM payment_orders WHERE user_id = ? AND status = 'paid'
        ), 2) as percentage
      FROM payment_orders po
      JOIN merchants m ON po.merchant_id = m.id
      WHERE po.user_id = ? AND po.status = 'paid'
      GROUP BY m.business_category
      ORDER BY total_amount DESC
    `
    const [categoryRows] = await connection.execute(categoryQuery, [userId, userId])

    return {
      totalMerchants: (merchantRows as RowDataPacket[]).length,
      merchants: merchantRows as RowDataPacket[],
      categories: categoryRows as RowDataPacket[]
    }
  }

  /**
   * 用户总体概览
   */
  static async getUsersOverview(): Promise<any> {
    const connection = await getDBConnection()

    // 用户基础统计
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_users_today,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_this_month
      FROM users
    `
    const [userStatsRows] = await connection.execute(userStatsQuery)
    const userStats = (userStatsRows as RowDataPacket[])[0]

    // 用户价值统计
    const valueStatsQuery = `
      SELECT 
        COALESCE(SUM(po.amount), 0) as total_spent,
        COALESCE(AVG(user_value.total_spent), 0) as avg_user_value,
        COUNT(CASE WHEN user_value.total_spent >= 1000 THEN 1 END) as high_value_users,
        COALESCE(SUM(po.points_awarded), 0) as total_points_issued
      FROM payment_orders po
      RIGHT JOIN (
        SELECT 
          user_id,
          SUM(amount) as total_spent
        FROM payment_orders 
        WHERE status = 'paid'
        GROUP BY user_id
      ) as user_value ON po.user_id = user_value.user_id
      WHERE po.status = 'paid'
    `
    const [valueStatsRows] = await connection.execute(valueStatsQuery)
    const valueStats = (valueStatsRows as RowDataPacket[])[0] || {}

    // 活跃度统计
    const activityQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN id END) as daily_active_users,
        COUNT(DISTINCT CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN id END) as weekly_active_users,
        COUNT(DISTINCT CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN id END) as monthly_active_users
      FROM users
    `
    const [activityRows] = await connection.execute(activityQuery)
    const activity = (activityRows as RowDataPacket[])[0]

    // 注册趋势
    const registrationTrendQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `
    const [regTrendRows] = await connection.execute(registrationTrendQuery)

    // 消费趋势
    const spendingTrendQuery = `
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as amount,
        COUNT(DISTINCT user_id) as user_count
      FROM payment_orders
      WHERE status = 'paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `
    const [spendTrendRows] = await connection.execute(spendingTrendQuery)

    return {
      totalUsers: parseInt(userStats.total_users) || 0,
      activeUsers: parseInt(userStats.active_users) || 0,
      newUsersToday: parseInt(userStats.new_users_today) || 0,
      newUsersThisMonth: parseInt(userStats.new_users_this_month) || 0,
      totalSpent: parseInt(valueStats.total_spent) || 0,
      avgUserValue: parseFloat(valueStats.avg_user_value) || 0,
      highValueUsers: parseInt(valueStats.high_value_users) || 0,
      totalPointsIssued: parseInt(valueStats.total_points_issued) || 0,
      dailyActiveUsers: parseInt(activity.daily_active_users) || 0,
      weeklyActiveUsers: parseInt(activity.weekly_active_users) || 0,
      monthlyActiveUsers: parseInt(activity.monthly_active_users) || 0,
      registrationTrend: regTrendRows as RowDataPacket[],
      spendingTrend: spendTrendRows as RowDataPacket[]
    }
  }
}