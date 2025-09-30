import { Request, Response } from 'express'
import { PointsService } from '../services/PointsService'

export class PointsController {
  /**
   * 获取用户积分余额
   */
  static async getPointsBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '用户未登录'
        })
        return
      }
      
      const balanceInfo = await PointsService.getUserPointsBalance(userId)
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '查询成功',
        data: balanceInfo
      })
      
    } catch (error) {
      console.error('查询积分余额失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '查询失败'
      })
    }
  }
  
  /**
   * 获取积分记录
   */
  static async getPointsHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      const { source, page = 1, pageSize = 20 } = req.query
      
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '用户未登录'
        })
        return
      }
      
      const result = await PointsService.getUserPointsHistory(
        userId,
        source as any,
        parseInt(page as string),
        parseInt(pageSize as string)
      )
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '查询成功',
        data: {
          records: result.records.map(record => ({
            id: record.id,
            pointsChange: record.pointsChange,
            pointsBalance: record.pointsBalance,
            source: record.source,
            description: record.description,
            expiresAt: record.expiresAt,
            createdAt: record.createdAt,
            // 关联信息
            orderNo: (record as any).order_no,
            merchantName: (record as any).merchant_name
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
      console.error('查询积分记录失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '查询失败'
      })
    }
  }
  
  /**
   * 获取积分统计
   */
  static async getPointsStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query
      
      let start: Date | undefined
      let end: Date | undefined
      
      if (startDate) {
        start = new Date(startDate as string)
        if (isNaN(start.getTime())) {
          res.status(400).json({
            success: false,
            code: 'INVALID_DATE',
            message: '开始日期格式错误'
          })
          return
        }
      }
      
      if (endDate) {
        end = new Date(endDate as string)
        if (isNaN(end.getTime())) {
          res.status(400).json({
            success: false,
            code: 'INVALID_DATE',
            message: '结束日期格式错误'
          })
          return
        }
      }
      
      const statistics = await PointsService.getPointsStatistics(start, end)
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '查询成功',
        data: statistics
      })
      
    } catch (error) {
      console.error('查询积分统计失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '查询失败'
      })
    }
  }
}
