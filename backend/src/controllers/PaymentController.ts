import { Request, Response } from 'express'
import { PaymentService } from '@/services/PaymentService'
import { PaymentOrderModel } from '@/models/PaymentOrder'

export class PaymentController {
  /**
   * 创建支付订单
   */
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      const { merchantId, amount, description } = req.body
      
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '用户未登录'
        })
        return
      }
      
      // 参数验证
      if (!merchantId || !amount) {
        res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          message: '缺少必要参数'
        })
        return
      }
      
      if (amount < 1 || amount > 100000000) { // 最大1000万分（10万元）
        res.status(400).json({
          success: false,
          code: 'INVALID_AMOUNT',
          message: '支付金额无效'
        })
        return
      }
      
      // 创建支付订单
      const orderResult = await PaymentService.createPaymentOrder(
        userId,
        merchantId,
        amount,
        description || '积分赠送支付'
      )
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '订单创建成功',
        data: orderResult
      })
      
    } catch (error) {
      console.error('创建支付订单失败:', error)
      res.status(500).json({
        success: false,
        code: 'CREATE_ORDER_FAILED',
        message: error instanceof Error ? error.message : '创建订单失败'
      })
    }
  }
  
  /**
   * 查询订单状态
   */
  static async getOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params
      const userId = req.user?.userId
      
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '用户未登录'
        })
        return
      }
      
      const orderStatus = await PaymentService.getOrderStatus(orderId)
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '查询成功',
        data: orderStatus
      })
      
    } catch (error) {
      console.error('查询订单状态失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '查询失败'
      })
    }
  }
  
  /**
   * 微信支付回调处理
   */
  static async handlePaymentCallback(req: Request, res: Response): Promise<void> {
    try {
      // 微信回调是XML格式，需要先解析
      let callbackData = req.body
      
      // 如果是字符串，说明是原始XML数据
      if (typeof callbackData === 'string') {
        // 直接传递XML字符串给服务层处理
        await PaymentService.handlePaymentCallback(callbackData)
      } else {
        // 如果已经被解析为对象，转回XML
        const xml2js = require('xml2js')
        const builder = new xml2js.Builder({ rootName: 'xml', headless: true })
        callbackData = builder.buildObject(callbackData)
        await PaymentService.handlePaymentCallback(callbackData)
      }
      
      // 返回微信要求的格式
      const successResponse = `
        <xml>
          <return_code><![CDATA[SUCCESS]]></return_code>
          <return_msg><![CDATA[OK]]></return_msg>
        </xml>
      `
      
      res.set('Content-Type', 'application/xml')
      res.send(successResponse)
      
    } catch (error) {
      console.error('支付回调处理失败:', error)
      
      // 返回失败响应
      const failResponse = `
        <xml>
          <return_code><![CDATA[FAIL]]></return_code>
          <return_msg><![CDATA[${error instanceof Error ? error.message : 'UNKNOWN_ERROR'}]]></return_msg>
        </xml>
      `
      
      res.set('Content-Type', 'application/xml')
      res.status(400).send(failResponse)
    }
  }
  
  /**
   * 查询支付历史
   */
  static async getPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      const { page = 1, pageSize = 20 } = req.query
      
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '用户未登录'
        })
        return
      }
      
      const result = await PaymentOrderModel.getUserPaymentHistory(
        userId,
        parseInt(page as string),
        parseInt(pageSize as string)
      )
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '查询成功',
        data: {
          orders: result.orders.map(order => ({
            id: order.id,
            orderNo: order.orderNo,
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
          }
        }
      })
      
    } catch (error) {
      console.error('查询支付历史失败:', error)
      res.status(500).json({
        success: false,
        code: 'QUERY_FAILED',
        message: error instanceof Error ? error.message : '查询失败'
      })
    }
  }
}
