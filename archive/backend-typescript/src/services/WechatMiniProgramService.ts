import axios from 'axios'
import { config } from '../config'

/**
 * 微信小程序服务
 * 用于生成小程序码和获取Access Token
 */
export class WechatMiniProgramService {
  private static accessToken: string | null = null
  private static tokenExpireTime: number = 0

  /**
   * 获取微信小程序Access Token
   */
  static async getAccessToken(): Promise<string> {
    // 检查是否有有效的token
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken
    }

    try {
      const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: config.wechat.appId,
          secret: config.wechat.appSecret
        }
      })

      if (response.data.access_token) {
        this.accessToken = response.data.access_token
        // token有效期7200秒，提前5分钟过期
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000
        return this.accessToken
      } else {
        throw new Error(`获取Access Token失败: ${response.data.errmsg}`)
      }
    } catch (error) {
      console.error('获取微信Access Token失败:', error)
      throw new Error('无法获取微信Access Token')
    }
  }

  /**
   * 生成小程序码
   * @param page 小程序页面路径
   * @param scene 场景值（页面参数）
   * @param width 二维码宽度，默认430px
   */
  static async generateMiniProgramCode(
    page: string,
    scene: string,
    width: number = 430
  ): Promise<Buffer> {
    try {
      const accessToken = await this.getAccessToken()
      
      const response = await axios.post(
        `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
        {
          page,
          scene,
          width,
          auto_color: false,
          line_color: { r: 0, g: 0, b: 0 },
          is_hyaline: false
        },
        {
          responseType: 'arraybuffer'
        }
      )

      // 检查是否返回了错误信息
      if (response.headers['content-type']?.includes('application/json')) {
        const errorData = JSON.parse(response.data.toString())
        throw new Error(`生成小程序码失败: ${errorData.errmsg}`)
      }

      return Buffer.from(response.data)
    } catch (error) {
      console.error('生成小程序码失败:', error)
      throw new Error('小程序码生成失败')
    }
  }

  /**
   * 生成带参数的小程序码
   * @param merchantId 商户ID
   * @param subMchId 特约商户号
   * @param amount 金额（分）
   */
  static async generatePaymentQRCode(
    merchantId: string,
    subMchId: string,
    amount?: number
  ): Promise<Buffer> {
    // 构建场景值（小程序码的参数）
    const sceneParams = {
      m: merchantId,  // 商户ID简写
      s: subMchId,    // 特约商户号简写
      ...(amount && { a: amount.toString() })  // 金额简写
    }
    
    const scene = Object.entries(sceneParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    // 小程序页面路径
    const page = 'pages/payment/index'

    return await this.generateMiniProgramCode(page, scene, 300)
  }
}
