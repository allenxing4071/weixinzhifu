import QRCode from 'qrcode'
import crypto from 'crypto'
import { config } from '../config/index'

/**
 * 商户二维码生成服务
 * 基于微信支付服务商模式为特约商户生成支付二维码
 */
export class MerchantQRCodeService {
  
  /**
   * 为商户生成支付二维码
   * @param merchantId 商户ID
   * @param subMchId 特约商户号（微信支付分配）
   * @param fixedAmount 固定金额（分），可选
   * @returns 二维码Buffer和相关信息
   */
  static async generateMerchantQRCode(
    merchantId: string,
    subMchId: string,
    fixedAmount?: number
  ): Promise<{
    qrCodeBuffer: Buffer
    qrCodeUrl: string
    qrCodeData: string
    expiresAt: Date
  }> {
    try {
      // 1. 生成二维码数据
      const qrCodeData = this.buildQRCodeData(merchantId, subMchId, fixedAmount)
      
      // 2. 生成二维码图片
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      })
      
      // 3. 构建访问URL（小程序扫码后跳转的页面）
      const qrCodeUrl = this.buildMiniProgramUrl(merchantId, subMchId, fixedAmount)
      
      // 4. 设置二维码有效期（24小时）
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)
      
      return {
        qrCodeBuffer,
        qrCodeUrl,
        qrCodeData,
        expiresAt
      }
      
    } catch (error) {
      console.error('生成商户二维码失败:', error)
      throw new Error('二维码生成失败')
    }
  }
  
  /**
   * 构建二维码数据内容
   * 使用小程序码规范：页面路径 + 参数
   */
  private static buildQRCodeData(
    merchantId: string, 
    subMchId: string, 
    fixedAmount?: number
  ): string {
    // 构建小程序页面路径和参数
    const basePath = 'pages/payment/index'
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() }),
      timestamp: Date.now().toString(),
      sign: this.generateSign(merchantId, subMchId, fixedAmount)
    })
    
    // 小程序二维码格式
    return `${basePath}?${params.toString()}`
  }
  
  /**
   * 构建小程序访问URL（用于分享和链接）
   */
  private static buildMiniProgramUrl(
    merchantId: string,
    subMchId: string,
    fixedAmount?: number
  ): string {
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() })
    })
    
    return `https://api.guandongfang.cn/miniprogram/payment?${params.toString()}`
  }
  
  /**
   * 生成安全签名防止二维码被篡改
   */
  private static generateSign(
    merchantId: string,
    subMchId: string,
    fixedAmount?: number
  ): string {
    const data = `${merchantId}${subMchId}${fixedAmount || ''}${config.wechat.apiV3Key}`
    return crypto.createHash('md5').update(data).digest('hex').toLowerCase()
  }
  
  /**
   * 验证二维码签名
   */
  static verifyQRCodeSign(
    merchantId: string,
    subMchId: string,
    sign: string,
    fixedAmount?: number
  ): boolean {
    const expectedSign = this.generateSign(merchantId, subMchId, fixedAmount)
    return sign === expectedSign
  }
  
  /**
   * 为商户生成微信支付Native扫码支付二维码
   * 适用于线下收银台场景
   */
  static async generateWechatNativeQRCode(
    merchantId: string,
    subMchId: string,
    amount: number,
    productDescription: string = '商户收款'
  ): Promise<{
    qrCodeBuffer: Buffer
    codeUrl: string
    orderNo: string
    expiresAt: Date
  }> {
    try {
      // 1. 生成订单号
      const orderNo = this.generateOrderNo()
      
      // 2. 调用微信支付Native下单API
      const codeUrl = await this.createWechatNativeOrder(
        orderNo,
        subMchId,
        amount,
        productDescription
      )
      
      // 3. 生成二维码
      const qrCodeBuffer = await QRCode.toBuffer(codeUrl, {
        type: 'png',
        quality: 0.92,
        margin: 1,
        width: 300
      })
      
      // 4. 设置有效期（30分钟）
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 30)
      
      return {
        qrCodeBuffer,
        codeUrl,
        orderNo,
        expiresAt
      }
      
    } catch (error) {
      console.error('生成微信Native二维码失败:', error)
      throw new Error('微信支付二维码生成失败')
    }
  }
  
  /**
   * 调用微信支付Native下单API（服务商模式）
   */
  private static async createWechatNativeOrder(
    orderNo: string,
    subMchId: string,
    amount: number,
    description: string
  ): Promise<string> {
    const axios = (await import('axios')).default
    
    // 构建请求参数（服务商模式）
    const params = {
      appid: config.wechat.appId,
      mch_id: config.wechat.mchId, // 服务商商户号
      sub_mch_id: subMchId, // 特约商户号
      nonce_str: this.generateNonceStr(),
      body: description,
      out_trade_no: orderNo,
      total_fee: amount.toString(),
      spbill_create_ip: '127.0.0.1',
      notify_url: config.wechat.notifyUrl,
      trade_type: 'NATIVE'
    }
    
    // 生成签名
    const sign = this.generateWechatSign(params)
    const requestData = { ...params, sign }
    
    // 构建XML请求体
    const xml = this.buildXml(requestData)
    
    try {
      const response = await axios.post(
        'https://api.mch.weixin.qq.com/pay/unifiedorder',
        xml,
        {
          headers: { 'Content-Type': 'application/xml' },
          timeout: 30000
        }
      )
      
      const result = await this.parseXml(response.data)
      
      if (result.return_code !== 'SUCCESS') {
        throw new Error(`微信支付调用失败: ${result.return_msg}`)
      }
      
      if (result.result_code !== 'SUCCESS') {
        throw new Error(`微信支付失败: ${result.err_code_des}`)
      }
      
      return result.code_url
      
    } catch (error) {
      console.error('微信支付Native下单失败:', error)
      throw error
    }
  }
  
  /**
   * 生成订单号
   */
  private static generateOrderNo(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `QR${timestamp}${random}`
  }
  
  /**
   * 生成随机字符串
   */
  private static generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
  
  /**
   * 生成微信支付签名
   */
  private static generateWechatSign(params: Record<string, string>): string {
    // 排序参数
    const sortedKeys = Object.keys(params).sort()
    const stringA = sortedKeys
      .filter(key => params[key] !== '' && params[key] !== undefined)
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    const stringSignTemp = `${stringA}&key=${config.wechat.apiV3Key}`
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase()
  }
  
  /**
   * 构建XML请求体
   */
  private static buildXml(data: Record<string, string>): string {
    let xml = '<xml>'
    for (const [key, value] of Object.entries(data)) {
      xml += `<${key}><![CDATA[${value}]]></${key}>`
    }
    xml += '</xml>'
    return xml
  }
  
  /**
   * 解析XML响应
   */
  private static async parseXml(xml: string): Promise<any> {
    const xml2js = (await import('xml2js')).default
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result.xml)
        }
      })
    })
  }
}
