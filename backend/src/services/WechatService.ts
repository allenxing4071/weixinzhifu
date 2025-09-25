import axios from 'axios'
import { getRedisClient } from '../config/database'
import config from '../config/index'

export interface WechatUserInfo {
  openid: string
  nickname: string
  avatar: string
  unionid?: string
}

export class WechatService {
  /**
   * 通过code获取用户openid
   */
  static async getOpenidByCode(code: string): Promise<{
    openid: string
    session_key: string
    unionid?: string
  }> {
    const url = 'https://api.weixin.qq.com/sns/jscode2session'
    const params = {
      appid: config.wechat.appId,
      secret: config.wechat.appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    }
    
    try {
      const response = await axios.get(url, { params, timeout: 10000 })
      const data = response.data
      
      if (data.errcode) {
        throw new Error(`微信登录失败: ${data.errmsg}`)
      }
      
      return {
        openid: data.openid,
        session_key: data.session_key,
        unionid: data.unionid
      }
      
    } catch (error) {
      console.error('微信登录API调用失败:', error)
      throw new Error('微信登录服务暂时不可用')
    }
  }
  
  /**
   * 获取微信Access Token
   */
  static async getAccessToken(): Promise<string> {
    const redis = await getRedisClient()
    const cacheKey = 'wechat:access_token'
    
    // 先从缓存获取
    const cachedToken = await redis.get(cacheKey)
    if (cachedToken) {
      return cachedToken
    }
    
    // 从微信API获取
    const url = 'https://api.weixin.qq.com/cgi-bin/token'
    const params = {
      grant_type: 'client_credential',
      appid: config.wechat.appId,
      secret: config.wechat.appSecret
    }
    
    try {
      const response = await axios.get(url, { params, timeout: 10000 })
      const data = response.data
      
      if (data.errcode) {
        throw new Error(`获取Access Token失败: ${data.errmsg}`)
      }
      
      // 缓存token（提前5分钟过期）
      const expiresIn = data.expires_in - 300
      await redis.setEx(cacheKey, expiresIn, data.access_token)
      
      return data.access_token
      
    } catch (error) {
      console.error('获取微信Access Token失败:', error)
      throw new Error('微信服务暂时不可用')
    }
  }
  
  /**
   * 验证用户session
   */
  static async validateSession(sessionKey: string, signature: string, rawData: string): Promise<boolean> {
    const crypto = require('crypto')
    const hash = crypto.createHash('sha1')
    hash.update(rawData + sessionKey)
    const expectedSignature = hash.digest('hex')
    
    return signature === expectedSignature
  }
  
  /**
   * 解密用户敏感数据
   */
  static decryptData(encryptedData: string, iv: string, sessionKey: string): any {
    const crypto = require('crypto')
    
    try {
      const key = Buffer.from(sessionKey, 'base64')
      const ivBuffer = Buffer.from(iv, 'base64')
      const encrypted = Buffer.from(encryptedData, 'base64')
      
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, ivBuffer)
      decipher.setAutoPadding(true)
      
      let decrypted = decipher.update(encrypted, null, 'utf8')
      decrypted += decipher.final('utf8')
      
      return JSON.parse(decrypted)
      
    } catch (error) {
      console.error('微信数据解密失败:', error)
      throw new Error('用户数据解密失败')
    }
  }
  
  /**
   * 生成小程序码（商户收款码）
   */
  static async generateQRCode(merchantId: string, scene?: string): Promise<Buffer> {
    const accessToken = await this.getAccessToken()
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`
    
    const params = {
      scene: scene || merchantId,
      page: 'pages/payment/index',
      width: 280,
      auto_color: false,
      line_color: { r: 0, g: 0, b: 0 },
      is_hyaline: false
    }
    
    try {
      const response = await axios.post(url, params, {
        responseType: 'arraybuffer',
        timeout: 30000
      })
      
      // 检查是否是错误响应
      const contentType = response.headers['content-type']
      if (contentType && contentType.includes('application/json')) {
        const errorInfo = JSON.parse(response.data.toString())
        throw new Error(`生成小程序码失败: ${errorInfo.errmsg}`)
      }
      
      return Buffer.from(response.data)
      
    } catch (error) {
      console.error('生成小程序码失败:', error)
      throw new Error('小程序码生成服务暂时不可用')
    }
  }
  
  /**
   * 发送模板消息（支付成功通知）
   */
  static async sendPaymentSuccessMessage(
    openid: string,
    orderInfo: {
      orderNo: string
      amount: number
      pointsAwarded: number
      merchantName: string
    }
  ): Promise<void> {
    const accessToken = await this.getAccessToken()
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`
    
    const message = {
      touser: openid,
      template_id: process.env.WECHAT_TEMPLATE_ID || '',
      page: 'pages/points/index',
      miniprogram_state: config.app.env === 'production' ? 'formal' : 'trial',
      data: {
        thing1: { value: `订单${orderInfo.orderNo}` },
        amount2: { value: `¥${(orderInfo.amount / 100).toFixed(2)}` },
        thing3: { value: orderInfo.merchantName },
        number4: { value: orderInfo.pointsAwarded.toString() },
        date5: { value: new Date().toLocaleString('zh-CN') }
      }
    }
    
    try {
      const response = await axios.post(url, message, { timeout: 10000 })
      const data = response.data
      
      if (data.errcode !== 0) {
        console.error('发送模板消息失败:', data.errmsg)
      } else {
        console.log('✅ 支付成功通知已发送')
      }
      
    } catch (error) {
      console.error('发送模板消息异常:', error)
      // 不影响主流程，只记录错误
    }
  }
}
