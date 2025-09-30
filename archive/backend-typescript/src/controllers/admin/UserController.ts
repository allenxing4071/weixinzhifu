/**
 * 用户管理控制器 - 后台管理
 * 提供完整的用户信息、消费记录、积分追踪功能
 */

import { Request, Response } from 'express'
import { UserService } from '../../services/UserService'

export class UserController {

  /**
   * 获取用户列表（支持分页、筛选）
   */
  static async getUserList(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        keyword = '', 
        status = '', 
        registerDateStart = '', 
        registerDateEnd = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      console.log('📋 获取用户列表:', { page, pageSize, keyword, status })

      const result = await UserService.getUserList({
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        keyword: keyword as string,
        status: status as string,
        registerDateStart: registerDateStart as string,
        registerDateEnd: registerDateEnd as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
      })

      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取用户列表成功',
        data: {
          users: result.users.map(user => ({
            id: user.id,
            nickname: user.nickname,
            phone: user.phone,
            avatar: user.avatar,
            pointsBalance: user.pointsBalance,
            totalSpent: user.totalSpent,
            totalOrders: user.totalOrders,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            status: user.status
          })),
          pagination: {
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(pageSize as string))
          }
        }
      })

    } catch (error) {
      console.error('❌ 获取用户列表失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '获取用户列表失败'
      })
    }
  }

  /**
   * 获取用户详细信息
   */
  static async getUserDetail(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params

      console.log('👤 获取用户详情:', userId)

      const userDetail = await UserService.getUserDetail(userId)

      if (!userDetail) {
        res.status(404).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        })
        return
      }

      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取用户详情成功',
        data: {
          user: {
            id: userDetail.id,
            openid: userDetail.openid,
            nickname: userDetail.nickname,
            phone: userDetail.phone,
            avatar: userDetail.avatar,
            pointsBalance: userDetail.pointsBalance,
            totalSpent: userDetail.totalSpent,
            totalOrders: userDetail.totalOrders,
            totalPointsEarned: userDetail.totalPointsEarned,
            avgOrderAmount: userDetail.avgOrderAmount,
            favoriteCategory: userDetail.favoriteCategory,
            lastLoginAt: userDetail.lastLoginAt,
            createdAt: userDetail.createdAt,
            updatedAt: userDetail.updatedAt,
            status: userDetail.status
          }
        }
      })

    } catch (error) {
      console.error('❌ 获取用户详情失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '获取用户详情失败'
      })
    }
  }

  /**
   * 获取用户消费记录
   */
  static async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const { 
        page = 1, 
        pageSize = 20,
        startDate = '',
        endDate = '',
        merchantId = ''
      } = req.query

      console.log('🛒 获取用户订单记录:', { userId, page, pageSize })

      const result = await UserService.getUserOrders(userId, {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        startDate: startDate as string,
        endDate: endDate as string,
        merchantId: merchantId as string
      })

      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取用户订单记录成功',
        data: {
          orders: result.orders.map(order => ({
            id: order.id,
            orderNo: order.orderNo,
            merchantId: order.merchantId,
            merchantName: order.merchantName,
            amount: order.amount,
            pointsAwarded: order.pointsAwarded,
            status: order.status,
            description: order.description,
            paidAt: order.paidAt,
            createdAt: order.createdAt
          })),
          pagination: {
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(pageSize as string))
          },
          summary: {
            totalAmount: result.totalAmount,
            totalPoints: result.totalPoints,
            orderCount: result.total
          }
        }
      })

    } catch (error) {
      console.error('❌ 获取用户订单记录失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '获取用户订单记录失败'
      })
    }
  }

  /**
   * 获取用户积分记录
   */
  static async getUserPoints(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const { 
        page = 1, 
        pageSize = 20,
        source = '',
        startDate = '',
        endDate = ''
      } = req.query

      console.log('🎯 获取用户积分记录:', { userId, page, pageSize })

      const result = await UserService.getUserPoints(userId, {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        source: source as string,
        startDate: startDate as string,
        endDate: endDate as string
      })

      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取用户积分记录成功',
        data: {
          records: result.records.map(record => ({
            id: record.id,
            pointsChange: record.pointsChange,
            pointsBalance: record.pointsBalance,
            source: record.source,
            description: record.description,
            orderNo: record.orderNo,
            merchantName: record.merchantName,
            expiresAt: record.expiresAt,
            createdAt: record.createdAt
          })),
          pagination: {
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string),
            total: result.total,
            totalPages: Math.ceil(result.total / parseInt(pageSize as string))
          },
          summary: {
            totalEarned: result.totalEarned,
            totalSpent: result.totalSpent,
            currentBalance: result.currentBalance
          }
        }
      })

    } catch (error) {
      console.error('❌ 获取用户积分记录失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '获取用户积分记录失败'
      })
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const { period = '30' } = req.query // 统计周期（天）

      console.log('📊 获取用户统计信息:', { userId, period })

      const statistics = await UserService.getUserStatistics(userId, parseInt(period as string))

      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取用户统计信息成功',
        data: {
          overview: {
            totalSpent: statistics.totalSpent,
            totalOrders: statistics.totalOrders,
            totalPoints: statistics.totalPoints,
            avgOrderAmount: statistics.avgOrderAmount,
            registrationDays: statistics.registrationDays
          },
          periodData: {
            periodDays: parseInt(period as string),
            periodSpent: statistics.periodSpent,
            periodOrders: statistics.periodOrders,
            periodPoints: statistics.periodPoints
          },
          merchantDistribution: statistics.merchantStats.map((stat: any) => ({
            merchantId: stat.merchantId,
            merchantName: stat.merchantName,
            orderCount: stat.orderCount,
            totalAmount: stat.totalAmount,
            totalPoints: stat.totalPoints,
            percentage: stat.percentage
          })),
          monthlyTrend: statistics.monthlyTrend.map((trend: any) => ({
            month: trend.month,
            orderCount: trend.orderCount,
            totalAmount: trend.totalAmount,
            totalPoints: trend.totalPoints
          }))
        }
      })

    } catch (error) {
      console.error('❌ 获取用户统计信息失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '获取用户统计信息失败'
      })
    }
  }

  /**
   * 用户消费分析（按商户分组）
   */
  static async getUserMerchantAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params

      console.log('🏪 获取用户商户分析:', userId)

      const analysis = await UserService.getUserMerchantAnalysis(userId)

      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取用户商户分析成功',
        data: {
          totalMerchants: analysis.totalMerchants,
          merchantAnalysis: analysis.merchants.map((merchant: any) => ({
            merchantId: merchant.merchantId,
            merchantName: merchant.merchantName,
            businessCategory: merchant.businessCategory,
            orderCount: merchant.orderCount,
            totalAmount: merchant.totalAmount,
            totalPoints: merchant.totalPoints,
            avgOrderAmount: merchant.avgOrderAmount,
            firstOrderAt: merchant.firstOrderAt,
            lastOrderAt: merchant.lastOrderAt,
            percentage: merchant.percentage,
            rank: merchant.rank
          })),
          categoryDistribution: analysis.categories.map((category: any) => ({
            category: category.name,
            merchantCount: category.merchantCount,
            orderCount: category.orderCount,
            totalAmount: category.totalAmount,
            percentage: category.percentage
          }))
        }
      })

    } catch (error) {
      console.error('❌ 获取用户商户分析失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '获取用户商户分析失败'
      })
    }
  }

  /**
   * 获取所有用户统计概览
   */
  static async getUsersOverview(_req: Request, res: Response): Promise<void> {
    try {
      console.log('📈 获取用户总体概览')

      const overview = await UserService.getUsersOverview()

      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取用户概览成功',
        data: {
          summary: {
            totalUsers: overview.totalUsers,
            activeUsers: overview.activeUsers,
            newUsersToday: overview.newUsersToday,
            newUsersThisMonth: overview.newUsersThisMonth
          },
          userValue: {
            totalSpent: overview.totalSpent,
            avgUserValue: overview.avgUserValue,
            highValueUsers: overview.highValueUsers,
            totalPointsIssued: overview.totalPointsIssued
          },
          activity: {
            dailyActiveUsers: overview.dailyActiveUsers,
            weeklyActiveUsers: overview.weeklyActiveUsers,
            monthlyActiveUsers: overview.monthlyActiveUsers
          },
          trends: {
            registrationTrend: overview.registrationTrend.map((trend: any) => ({
              date: trend.date,
              count: trend.count
            })),
            spendingTrend: overview.spendingTrend.map((trend: any) => ({
              date: trend.date,
              amount: trend.amount,
              userCount: trend.userCount
            }))
          }
        }
      })

    } catch (error) {
      console.error('❌ 获取用户概览失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '获取用户概览失败'
      })
    }
  }
}