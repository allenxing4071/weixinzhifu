import crypto from 'crypto'
import axios from 'axios'
import xml2js from 'xml2js'
import { PaymentOrderModel, CreateOrderData } from '@/models/PaymentOrder'
import { UserModel } from '@/models/User'
import { PointsService } from './PointsService'
import { getDBConnection } from '@/config/database'
import config from '@/config'

export interface PaymentParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'MD5'
  paySign: string
}

export interface WechatPaymentCallback {
  return_code: string
  return_msg: string
  result_code: string
  out_trade_no: string
  transaction_id: string
  total_fee: string
  time_end: string
}

export class PaymentService {
  /**
   * 创建支付订单
   */
  static async createPaymentOrder(
    userId: string,
    merchantId: string,
    amount: number,
    description: string = '积分赠送支付'
  ) {
    // 验证用户存在
    const user = await UserModel.findById(userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    // 验证金额（最小1分钱）
    if (amount < 1) {
      throw new Error('支付金额不能小于0.01元')
    }
    
    // 创建订单
    const orderData: CreateOrderData = {
      userId,
      merchantId,
      amount,
      description
    }
    
    const order = await PaymentOrderModel.create(orderData)
    
    // 调用微信统一下单
    const paymentParams = await this.createWechatOrder(
      order.orderNo,
      amount,
      description,
      user.openid
    )
    
    return {
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.amount,
      pointsToAward: Math.floor(amount / 100), // 1元=1积分
      paymentParams,
      expiresAt: order.expiredAt
    }
  }
  
  /**
   * 调用微信统一下单API
   */
  private static async createWechatOrder(
    orderNo: string,
    amount: number,
    description: string,
    openid: string
  ): Promise<PaymentParams> {
    const nonceStr = this.generateNonceStr()
    
    // 构建请求参数
    const params = {
      appid: config.wechat.appId,
      mch_id: config.wechat.mchId,
      nonce_str: nonceStr,
      body: description,
      out_trade_no: orderNo,
      total_fee: amount.toString(),
      spbill_create_ip: '127.0.0.1',
      notify_url: config.wechat.notifyUrl,
      trade_type: 'JSAPI',
      openid: openid
    }
    
    // 生成签名
    const sign = this.generateSign(params)
    const requestData = { ...params, sign }
    
    // 构建XML请求体
    const xml = this.buildXml(requestData)
    
    try {
      // 调用微信API
      const response = await axios.post(
        'https://api.mch.weixin.qq.com/pay/unifiedorder',
        xml,
        {
          headers: { 'Content-Type': 'application/xml' },
          timeout: 30000
        }
      )
      
      // 解析响应
      const result = await this.parseXml(response.data)
      
      if (result.return_code !== 'SUCCESS') {
        throw new Error(`微信支付调用失败: ${result.return_msg}`)
      }
      
      if (result.result_code !== 'SUCCESS') {
        throw new Error(`微信支付失败: ${result.err_code_des}`)
      }
      
      // 生成小程序支付参数
      return this.generateMiniProgramPayParams(result.prepay_id)
      
    } catch (error) {
      console.error('微信支付调用异常:', error)
      throw new Error('支付服务暂时不可用，请稍后重试')
    }
  }
  
  /**
   * 生成小程序支付参数
   */
  private static generateMiniProgramPayParams(prepayId: string): PaymentParams {
    const timeStamp = Math.floor(Date.now() / 1000).toString()
    const nonceStr = this.generateNonceStr()
    const packageStr = `prepay_id=${prepayId}`
    const signType = 'MD5'
    
    // 生成支付签名
    const signParams = {
      appId: config.wechat.appId,
      timeStamp,
      nonceStr,
      package: packageStr,
      signType
    }
    
    const paySign = this.generateSign(signParams)
    
    return {
      timeStamp,
      nonceStr,
      package: packageStr,
      signType,
      paySign
    }
  }
  
  /**
   * 处理微信支付回调
   */
  static async handlePaymentCallback(callbackData: string): Promise<void> {
    try {
      // 解析回调数据
      const result = await this.parseXml(callbackData)
      
      // 验证签名
      if (!this.verifySign(result)) {
        throw new Error('签名验证失败')
      }
      
      // 检查支付结果
      if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
        console.error('支付失败回调:', result)
        return
      }
      
      const orderNo = result.out_trade_no
      const transactionId = result.transaction_id
      const totalFee = parseInt(result.total_fee)
      
      // 查找订单
      const order = await PaymentOrderModel.findByOrderNo(orderNo)
      if (!order) {
        throw new Error(`订单不存在: ${orderNo}`)
      }
      
      // 防止重复处理
      if (order.status === 'paid') {
        console.log(`订单已处理: ${orderNo}`)
        return
      }
      
      // 验证金额
      if (order.amount !== totalFee) {
        throw new Error(`金额不匹配: 期望${order.amount}，实际${totalFee}`)
      }
      
      // 开始事务处理
      await this.processPaymentSuccess(order.id, transactionId, totalFee)
      
    } catch (error) {
      console.error('支付回调处理失败:', error)
      throw error
    }
  }
  
  /**
   * 处理支付成功（事务保证）
   */
  private static async processPaymentSuccess(
    orderId: string,
    transactionId: string,
    amount: number
  ): Promise<void> {
    const connection = await getDBConnection()
    
    // 开始事务
    await connection.beginTransaction()
    
    try {
      // 1. 更新订单状态
      const pointsAwarded = Math.floor(amount / 100) // 1元=1积分
      const orderUpdated = await PaymentOrderModel.markAsPaid(
        orderId,
        transactionId,
        pointsAwarded
      )
      
      if (!orderUpdated) {
        throw new Error('订单状态更新失败')
      }
      
      // 2. 发放积分
      const order = await PaymentOrderModel.findById(orderId)
      if (!order) {
        throw new Error('订单查询失败')
      }
      
      await PointsService.awardPoints(
        order.userId,
        pointsAwarded,
        'payment_reward',
        `支付订单${order.orderNo}获得积分`,
        orderId
      )
      
      // 3. 更新商户统计
      // 这里可以添加商户统计更新逻辑
      
      // 提交事务
      await connection.commit()
      console.log(`✅ 支付成功处理完成: ${orderId}, 积分: ${pointsAwarded}`)
      
    } catch (error) {
      // 回滚事务
      await connection.rollback()
      console.error('支付处理事务失败:', error)
      throw error
    }
  }
  
  /**
   * 生成随机字符串
   */
  private static generateNonceStr(): string {
    return Math.random().toString(36).substr(2, 15)
  }
  
  /**
   * 生成签名
   */
  private static generateSign(params: Record<string, any>): string {
    // 排序参数
    const sortedKeys = Object.keys(params).sort()
    const stringA = sortedKeys
      .filter(key => params[key] !== undefined && params[key] !== '')
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    const stringSignTemp = `${stringA}&key=${config.wechat.apiKey}`
    
    return crypto
      .createHash('md5')
      .update(stringSignTemp, 'utf8')
      .digest('hex')
      .toUpperCase()
  }
  
  /**
   * 验证签名
   */
  private static verifySign(params: Record<string, any>): boolean {
    const sign = params.sign
    delete params.sign
    
    const expectedSign = this.generateSign(params)
    return sign === expectedSign
  }
  
  /**
   * 构建XML请求体
   */
  private static buildXml(params: Record<string, any>): string {
    const builder = new xml2js.Builder({
      rootName: 'xml',
      headless: true,
      renderOpts: { pretty: false }
    })
    
    return builder.buildObject(params)
  }
  
  /**
   * 解析XML响应
   */
  private static async parseXml(xml: string): Promise<any> {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true
    })
    
    return new Promise((resolve, reject) => {
      parser.parseString(xml, (err: any, result: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(result.xml)
        }
      })
    })
  }
  
  /**
   * 查询订单状态
   */
  static async getOrderStatus(orderId: string) {
    const order = await PaymentOrderModel.findById(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }
    
    return {
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      amount: order.amount,
      pointsAwarded: order.pointsAwarded,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      expiredAt: order.expiredAt
    }
  }
}
