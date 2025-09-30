import QRCode from 'qrcode'
import crypto from 'crypto'
import { config } from '../config/index'

/**
 * 商户二维码生成服务 - 生产版本
 * 确保返回真实的base64数据，解决QR码显示问题
 */
export class MerchantQRCodeService {
  
  /**
   * 生成商户收款二维码 - 主要方法
   * @param merchantId 商户ID  
   * @param fixedAmount 固定金额（分），可选
   * @returns 包含真实base64数据的QR码信息
   */
  static async generateQRCode(
    merchantId: string,
    fixedAmount?: number
  ): Promise<{
    qrCodeData: string    // 真实的base64图片数据
    qrCodeUrl: string     // 扫码后跳转的URL
  }> {
    try {
      console.log(`🎯 生成QR码: merchantId=${merchantId}, amount=${fixedAmount}`)
      
      // 1. 构建支付页面URL
      const paymentUrl = this.buildPaymentUrl(merchantId, fixedAmount)
      console.log(`📍 支付URL: ${paymentUrl}`)
      
      // 2. 生成真实的QR码图片Buffer
      const qrCodeBuffer = await QRCode.toBuffer(paymentUrl, {
        type: 'png',
        quality: 0.95,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        height: 256
      })
      
      // 3. 转换为base64 - 确保格式正确
      const base64String = qrCodeBuffer.toString('base64')
      const qrCodeData = `data:image/png;base64,${base64String}`
      
      console.log(`✅ QR码生成成功，数据大小: ${base64String.length} 字符`)
      
      return {
        qrCodeData,    // 完整的base64图片数据
        qrCodeUrl: paymentUrl  // 扫码后的跳转URL
      }
      
    } catch (error) {
      console.error('❌ QR码生成失败:', error)
      throw new Error(`QR码生成失败: ${error.message}`)
    }
  }
  
  /**
   * 构建支付页面URL
   */
  private static buildPaymentUrl(merchantId: string, fixedAmount?: number): string {
    const baseUrl = 'https://www.guandongfang.cn/miniprogram/payment.html'
    const params = new URLSearchParams({ merchantId })
    
    // 只有当fixedAmount有值时才添加金额参数
    if (fixedAmount && fixedAmount > 0) {
      params.set('amount', (fixedAmount / 100).toString())
    }
    
    // 添加时间戳防止缓存
    params.set('t', Date.now().toString())
    
    return `${baseUrl}?${params.toString()}`
  }
  
  /**
   * 批量生成二维码
   */
  static async generateBatchQRCodes(
    merchantIds: string[],
    fixedAmount?: number
  ): Promise<{
    success: Array<{ merchantId: string; qrCodeData: string; qrCodeUrl: string }>
    failed: Array<{ merchantId: string; error: string }>
  }> {
    const success: Array<{ merchantId: string; qrCodeData: string; qrCodeUrl: string }> = []
    const failed: Array<{ merchantId: string; error: string }> = []
    
    // 并发生成QR码，但限制并发数量避免过载
    const batchSize = 5
    for (let i = 0; i < merchantIds.length; i += batchSize) {
      const batch = merchantIds.slice(i, i + batchSize)
      
      const promises = batch.map(async (merchantId) => {
        try {
          const result = await this.generateQRCode(merchantId, fixedAmount)
          success.push({ merchantId, ...result })
        } catch (error) {
          failed.push({ merchantId, error: error.message })
        }
      })
      
      await Promise.all(promises)
    }
    
    return { success, failed }
  }
  
  /**
   * 验证二维码数据格式
   */
  static validateQRCodeData(qrCodeData: string): boolean {
    return (
      typeof qrCodeData === 'string' &&
      qrCodeData.startsWith('data:image/png;base64,') &&
      qrCodeData.length > 50
    )
  }
}