// 仪表板控制器

import { Request, Response } from 'express'
import { getDBConnection } from '../../config/database'

export class DashboardController {
  // 获取仪表板统计数据
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const connection = await getDBConnection()
      
      const today = new Date()
      const startOfToday = new Date(today.setHours(0, 0, 0, 0))
      const endOfToday = new Date(today.setHours(23, 59, 59, 999))
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0))
      const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999))

      // 并行查询各项统计数据
      const [
        totalUsersResult,
        totalMerchantsResult,
        todayOrdersResult,
        yesterdayOrdersResult,
        todayPointsResult,
        todayNewUsersResult,
        yesterdayNewUsersResult
      ] = await Promise.all([
        // 总用户数
        connection.execute('SELECT COUNT(*) as count FROM users'),
        
        // 总商户数
        connection.execute('SELECT COUNT(*) as count FROM merchants'),
        
        // 今日订单
        connection.execute(
          `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount 
           FROM payment_orders 
           WHERE status = 'paid' AND paid_at BETWEEN ? AND ?`,
          [startOfToday, endOfToday]
        ),
        
        // 昨日订单数量
        connection.execute(
          'SELECT COUNT(*) as count FROM payment_orders WHERE status = ? AND paid_at BETWEEN ? AND ?',
          ['paid', startOfYesterday, endOfYesterday]
        ),
        
        // 今日积分发放
        connection.execute(
          `SELECT COALESCE(SUM(points_change), 0) as points 
           FROM points_records 
           WHERE points_change > 0 AND created_at BETWEEN ? AND ?`,
          [startOfToday, endOfToday]
        ),
        
        // 今日新增用户
        connection.execute(
          'SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN ? AND ?',
          [startOfToday, endOfToday]
        ),
        
        // 昨日新增用户
        connection.execute(
          'SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN ? AND ?',
          [startOfYesterday, endOfYesterday]
        )
      ])

      // 解析查询结果
      const totalUsers = (totalUsersResult[0] as any)[0].count
      const totalMerchants = (totalMerchantsResult[0] as any)[0].count
      const todayOrdersCount = (todayOrdersResult[0] as any)[0].count
      const todayAmount = (todayOrdersResult[0] as any)[0].amount
      const yesterdayOrdersCount = (yesterdayOrdersResult[0] as any)[0].count
      const todayPoints = (todayPointsResult[0] as any)[0].points
      const todayNewUsers = (todayNewUsersResult[0] as any)[0].count
      const yesterdayNewUsers = (yesterdayNewUsersResult[0] as any)[0].count

      // 获取近7天趋势数据
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const start = new Date(date.setHours(0, 0, 0, 0))
        const end = new Date(date.setHours(23, 59, 59, 999))
        
        const [dayUsersResult, dayPaymentsResult, dayPointsResult] = await Promise.all([
          connection.execute(
            'SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN ? AND ?',
            [start, end]
          ),
          connection.execute(
            `SELECT COALESCE(SUM(amount), 0) as amount 
             FROM payment_orders 
             WHERE status = 'paid' AND paid_at BETWEEN ? AND ?`,
            [start, end]
          ),
          connection.execute(
            `SELECT COALESCE(SUM(points_change), 0) as points 
             FROM points_records 
             WHERE points_change > 0 AND created_at BETWEEN ? AND ?`,
            [start, end]
          )
        ])
        
        last7Days.push({
          date: `${date.getMonth() + 1}-${date.getDate()}`,
          users: (dayUsersResult[0] as any)[0].count,
          payments: parseInt((dayPaymentsResult[0] as any)[0].amount || '0'),
          points: parseInt((dayPointsResult[0] as any)[0].points || '0')
        })
      }

      // 构建响应数据
      const stats = {
        overview: {
          totalUsers,
          activeUsers: totalUsers, // 简化为总用户数
          totalMerchants,
          activeMerchants: totalMerchants, // 简化为总商户数
          todayOrders: todayOrdersCount,
          todayAmount: parseInt(todayAmount || '0'),
          todayPoints: parseInt(todayPoints || '0'),
          todayNewUsers
        },
        trends: {
          userGrowth: last7Days.map(day => ({
            date: day.date,
            value: day.users
          })),
          paymentTrend: last7Days.map(day => ({
            date: day.date,
            value: day.payments
          })),
          pointsTrend: last7Days.map(day => ({
            date: day.date,
            value: day.points
          }))
        },
        alerts: [
          // 根据实际情况生成告警
          ...(todayOrdersCount > yesterdayOrdersCount * 1.5 ? [{
            id: 'high_orders',
            type: 'warning',
            title: '订单量异常增长',
            message: `今日订单量(${todayOrdersCount})较昨日增长超过50%`,
            value: `+${((todayOrdersCount / (yesterdayOrdersCount || 1) - 1) * 100).toFixed(1)}%`,
            time: new Date().toISOString(),
            handled: false
          }] : []),
          ...(todayNewUsers > yesterdayNewUsers * 2 ? [{
            id: 'high_users',
            type: 'info',
            title: '用户增长异常',
            message: `今日新用户(${todayNewUsers})较昨日翻倍增长`,
            value: `+${todayNewUsers - yesterdayNewUsers}`,
            time: new Date().toISOString(),
            handled: false
          }] : [])
        ]
      }

      res.json({
        success: true,
        data: stats
      })

    } catch (error) {
      console.error('Dashboard stats error:', error)
      res.status(500).json({
        success: false,
        message: '获取仪表板数据失败'
      })
    }
  }

  // 获取系统监控数据
  static async getMonitor(_req: Request, res: Response): Promise<void> {
    try {
      // 模拟系统监控数据
      const monitor = {
        server: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          disk: Math.random() * 100,
          network: (Math.random() * 1000).toFixed(2) + ' Mbps'
        },
        application: {
          responseTime: Math.random() * 1000,
          errorRate: Math.random() * 5,
          concurrentUsers: Math.floor(Math.random() * 500),
          apiCalls: Math.floor(Math.random() * 10000)
        },
        database: {
          connections: Math.floor(Math.random() * 50),
          queryTime: Math.random() * 100,
          storage: Math.random() * 100
        }
      }

      res.json({
        success: true,
        data: monitor
      })

    } catch (error) {
      console.error('System monitor error:', error)
      res.status(500).json({
        success: false,
        message: '获取系统监控数据失败'
      })
    }
  }

  // 获取待处理事项
  static async getTodos(_req: Request, res: Response): Promise<void> {
    try {
      const connection = await getDBConnection()

      // 获取待审核商户数量
      const [pendingMerchantsResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM merchants WHERE status = ?',
        ['pending']
      )
      const pendingMerchants = (pendingMerchantsResult as any)[0].count

      // 获取异常订单数量
      const [abnormalOrdersResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM payment_orders WHERE status = ?',
        ['expired']
      )
      const abnormalOrders = (abnormalOrdersResult as any)[0].count

      const todos = []

      if (pendingMerchants > 0) {
        todos.push({
          id: 'pending_merchants',
          type: 'merchant_approval',
          title: '商户审核',
          description: `有 ${pendingMerchants} 个商户申请待审核`,
          count: pendingMerchants,
          priority: 'high',
          createdAt: new Date().toISOString()
        })
      }

      if (abnormalOrders > 0) {
        todos.push({
          id: 'expired_orders',
          type: 'order_cleanup',
          title: '异常订单',
          description: `有 ${abnormalOrders} 个过期订单需要处理`,
          count: abnormalOrders,
          priority: 'medium',
          createdAt: new Date().toISOString()
        })
      }

      res.json({
        success: true,
        data: todos
      })

    } catch (error) {
      console.error('Get todos error:', error)
      res.status(500).json({
        success: false,
        message: '获取待处理事项失败'
      })
    }
  }
}