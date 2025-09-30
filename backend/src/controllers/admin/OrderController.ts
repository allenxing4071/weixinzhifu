// 订单管理控制器 - 管理后台专用
// 新增功能：订单列表、详情、统计、导出等功能
import { Request, Response } from 'express'
import { AppDataSource } from '../../config/database'
// 模型导入
import { Between } from 'typeorm'

export class OrderController {
  // 获取订单列表（分页、筛选、搜索）
  static async getOrders(req: Request, res: Response) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        merchantId,
        userId,
        dateFrom,
        dateTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query

      const orderRepository = AppDataSource.getRepository('PaymentOrder')
      
      // 构建查询条件
      const queryBuilder = orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.merchant', 'merchant')

      // 状态筛选
      if (status) {
        queryBuilder.andWhere('order.status = :status', { status })
      }

      // 商户筛选
      if (merchantId) {
        queryBuilder.andWhere('order.merchantId = :merchantId', { merchantId })
      }

      // 用户筛选
      if (userId) {
        queryBuilder.andWhere('order.userId = :userId', { userId })
      }

      // 日期范围筛选
      if (dateFrom && dateTo) {
        queryBuilder.andWhere('order.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: new Date(dateFrom as string),
          dateTo: new Date(dateTo as string)
        })
        return
      }

      // 搜索功能（订单号、商户名称、用户昵称）
      if (search) {
        queryBuilder.andWhere(
          '(order.orderNo LIKE :search OR merchant.merchantName LIKE :search OR user.nickname LIKE :search)',
          { search: `%${search}%` }
        )
      }

      // 排序
      queryBuilder.orderBy(`order.${sortBy}`, sortOrder as 'ASC' | 'DESC')

      // 分页
      const offset = (Number(page) - 1) * Number(pageSize)
      queryBuilder.skip(offset).take(Number(pageSize))

      // 执行查询
      const [orders, total] = await queryBuilder.getManyAndCount()

      // 格式化返回数据
      const formattedOrders = orders.map(order => ({
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        pointsAwarded: order.pointsAwarded,
        status: order.status,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        description: order.description,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        expiredAt: order.expiredAt,
        user: order.user ? {
          id: order.user.id,
          nickname: order.user.nickname,
          wechatId: order.user.wechatId
        } : null,
        merchant: order.merchant ? {
          id: order.merchant.id,
          merchantName: order.merchant.merchantName,
          contactPerson: order.merchant.contactPerson
        } : null
      }))

      res.json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total,
            totalPages: Math.ceil(total / Number(pageSize))
          }
        }
      })

    } catch (error) {
      console.error('获取订单列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  // 获取订单详情
  static async getOrderDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const orderRepository = AppDataSource.getRepository('PaymentOrder')

      const order = await orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.merchant', 'merchant')
        .where('order.id = :id', { id })
        .getOne()

      if (!order) {
        res.status(404).json({
          success: false,
          message: '订单不存在'
        })
        return
      }

      // 获取关联的积分记录
      const pointsRepository = AppDataSource.getRepository('PointsRecord')
      const pointsRecords = await pointsRepository.find({
        where: { orderId: order.id },
        order: { createdAt: 'DESC' }
      })

      // 格式化详细信息
      const orderDetail = {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        pointsAwarded: order.pointsAwarded,
        status: order.status,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        description: order.description,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        expiredAt: order.expiredAt,
        updatedAt: order.updatedAt,
        user: order.user ? {
          id: order.user.id,
          nickname: order.user.nickname,
          wechatId: order.user.wechatId,
          openid: order.user.openid,
          phone: order.user.phone,
          pointsBalance: order.user.pointsBalance
        } : null,
        merchant: order.merchant ? {
          id: order.merchant.id,
          merchantName: order.merchant.merchantName,
          merchantNo: order.merchant.merchantNo,
          contactPerson: order.merchant.contactPerson,
          contactPhone: order.merchant.contactPhone,
          subMchId: order.merchant.subMchId
        } : null,
        pointsRecords: pointsRecords.map(record => ({
          id: record.id,
          pointsChange: record.pointsChange,
          pointsBalance: record.pointsBalance,
          source: record.source,
          description: record.description,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt
        }))
      }

      res.json({
        success: true,
        data: { order: orderDetail }
      })

    } catch (error) {
      console.error('获取订单详情失败:', error)
      res.status(500).json({
        success: false,
        message: '获取订单详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  // 获取订单统计数据
  static async getOrderStats(_req: Request, res: Response): Promise<void> {
    try {
      const orderRepository = AppDataSource.getRepository('PaymentOrder')
      
      // 获取今日统计
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // 获取本月统计
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

      // 总订单统计
      const totalOrders = await orderRepository.count()
      const paidOrders = await orderRepository.count({ where: { status: 'paid' } })
      const pendingOrders = await orderRepository.count({ where: { status: 'pending' } })
      const cancelledOrders = await orderRepository.count({ where: { status: 'cancelled' } })

      // 今日订单统计
      const todayOrders = await orderRepository.count({
        where: { createdAt: Between(today, tomorrow) }
      })
      const todayPaidOrders = await orderRepository.count({
        where: { 
          createdAt: Between(today, tomorrow),
          status: 'paid'
        }
      })

      // 今日金额统计
      const todayAmountResult = await orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.amount)', 'totalAmount')
        .where('order.createdAt BETWEEN :today AND :tomorrow', { today, tomorrow })
        .andWhere('order.status = :status', { status: 'paid' })
        .getRawOne()

      // 本月统计
      const monthOrders = await orderRepository.count({
        where: { createdAt: Between(monthStart, monthEnd) }
      })
      const monthAmountResult = await orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.amount)', 'totalAmount')
        .where('order.createdAt BETWEEN :monthStart AND :monthEnd', { monthStart, monthEnd })
        .andWhere('order.status = :status', { status: 'paid' })
        .getRawOne()

      // 总金额统计
      const totalAmountResult = await orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.amount)', 'totalAmount')
        .where('order.status = :status', { status: 'paid' })
        .getRawOne()

      // 支付成功率
      const successRate = totalOrders > 0 ? (paidOrders / totalOrders * 100).toFixed(2) : 0
      const todaySuccessRate = todayOrders > 0 ? (todayPaidOrders / todayOrders * 100).toFixed(2) : 0

      res.json({
        success: true,
        data: {
          overview: {
            totalOrders,
            paidOrders,
            pendingOrders,
            cancelledOrders,
            totalAmount: parseInt(totalAmountResult?.totalAmount || '0'),
            successRate: parseFloat(successRate as string)
          },
          today: {
            orders: todayOrders,
            paidOrders: todayPaidOrders,
            amount: parseInt(todayAmountResult?.totalAmount || '0'),
            successRate: parseFloat(todaySuccessRate as string)
          },
          month: {
            orders: monthOrders,
            amount: parseInt(monthAmountResult?.totalAmount || '0')
          }
        }
      })

    } catch (error) {
      console.error('获取订单统计失败:', error)
      res.status(500).json({
        success: false,
        message: '获取订单统计失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  // 更新订单状态
  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { status, reason } = req.body

      const orderRepository = AppDataSource.getRepository('PaymentOrder')
      const order = await orderRepository.findOne({ where: { id } })

      if (!order) {
        res.status(404).json({
          success: false,
          message: '订单不存在'
        })
        return
      }

      // 验证状态变更合法性
      const validStatuses = ['pending', 'paid', 'cancelled', 'expired', 'refunded']
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: '无效的订单状态'
        })
        return
      }

      // 更新订单状态
      order.status = status
      order.updatedAt = new Date()
      
      // 如果是取消或退款，记录原因
      if ((status === 'cancelled' || status === 'refunded') && reason) {
        order.description = `${order.description || ''} [${status === 'cancelled' ? '取消' : '退款'}原因: ${reason}]`
      }

      await orderRepository.save(order)

      res.json({
        success: true,
        message: '订单状态更新成功',
        data: { order }
      })

    } catch (error) {
      console.error('更新订单状态失败:', error)
      res.status(500).json({
        success: false,
        message: '更新订单状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  // 导出订单数据
  static async exportOrders(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        merchantId,
        dateFrom,
        dateTo,
        format = 'json'
      } = req.query

      const orderRepository = AppDataSource.getRepository('PaymentOrder')
      
      // 构建查询条件
      const queryBuilder = orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.merchant', 'merchant')

      if (status) {
        queryBuilder.andWhere('order.status = :status', { status })
      }

      if (merchantId) {
        queryBuilder.andWhere('order.merchantId = :merchantId', { merchantId })
      }

      if (dateFrom && dateTo) {
        queryBuilder.andWhere('order.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: new Date(dateFrom as string),
          dateTo: new Date(dateTo as string)
        })
        return
      }

      queryBuilder.orderBy('order.createdAt', 'DESC')

      const orders = await queryBuilder.getMany()

      // 格式化导出数据
      const exportData = orders.map(order => ({
        订单号: order.orderNo,
        商户名称: order.merchant?.merchantName || '未知',
        用户昵称: order.user?.nickname || '未知',
        支付金额: (order.amount / 100).toFixed(2),
        奖励积分: order.pointsAwarded,
        订单状态: order.status,
        支付方式: order.paymentMethod,
        微信交易号: order.transactionId || '',
        创建时间: order.createdAt.toLocaleString('zh-CN'),
        支付时间: order.paidAt?.toLocaleString('zh-CN') || '',
        订单描述: order.description || ''
      }))

      if (format === 'csv') {
        // CSV格式导出
        const csvHeader = Object.keys(exportData[0] || {}).join(',')
        const csvRows = exportData.map(row => Object.values(row).join(','))
        const csvContent = [csvHeader, ...csvRows].join('\n')

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv')
        res.send('\uFEFF' + csvContent) // BOM for Excel UTF-8 support
      } else {
        // JSON格式导出
        res.json({
          success: true,
          data: {
            orders: exportData,
            exportTime: new Date().toISOString(),
            total: exportData.length
          }
        })
        return
      }

    } catch (error) {
      console.error('导出订单数据失败:', error)
      res.status(500).json({
        success: false,
        message: '导出订单数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}