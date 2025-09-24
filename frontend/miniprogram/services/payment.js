/**
 * 支付服务
 */

import request, { requestWithLoading } from '../utils/request.js'

export class PaymentService {
  /**
   * 创建支付订单
   */
  static async createPaymentOrder(merchantId, amount, description = '积分赠送支付') {
    try {
      const response = await requestWithLoading(
        () => request.post('/payments', {
          merchantId,
          amount,
          description
        }),
        '创建订单中...'
      )

      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '创建订单失败')
      }
    } catch (error) {
      console.error('创建支付订单失败:', error)
      throw error
    }
  }

  /**
   * 调起微信支付
   */
  static async requestPayment(paymentParams) {
    try {
      const result = await wx.requestPayment({
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.package,
        signType: paymentParams.signType,
        paySign: paymentParams.paySign
      })

      // 支付成功
      if (result.errMsg === 'requestPayment:ok') {
        return { success: true }
      } else {
        throw new Error('支付失败')
      }

    } catch (error) {
      console.error('微信支付调用失败:', error)
      
      // 处理不同的支付错误
      if (error.errMsg === 'requestPayment:fail cancel') {
        throw new Error('用户取消支付')
      } else if (error.errMsg === 'requestPayment:fail') {
        throw new Error('支付失败，请重试')
      } else {
        throw new Error('支付异常，请稍后重试')
      }
    }
  }

  /**
   * 完整支付流程
   */
  static async processPayment(merchantId, amount, description) {
    try {
      // 1. 创建订单
      const orderInfo = await this.createPaymentOrder(merchantId, amount, description)
      
      // 2. 显示支付确认页面的积分预览
      const pointsToAward = orderInfo.pointsToAward
      
      wx.showLoading({
        title: '正在调起支付...',
        mask: true
      })

      // 3. 调起微信支付
      await this.requestPayment(orderInfo.paymentParams)
      
      wx.hideLoading()

      // 4. 支付成功，等待积分发放
      const paymentResult = await this.waitForPaymentResult(orderInfo.orderId)
      
      return {
        success: true,
        orderId: orderInfo.orderId,
        orderNo: orderInfo.orderNo,
        amount: orderInfo.amount,
        pointsAwarded: paymentResult.pointsAwarded || pointsToAward
      }

    } catch (error) {
      wx.hideLoading()
      console.error('支付流程失败:', error)
      throw error
    }
  }

  /**
   * 等待支付结果确认
   */
  static async waitForPaymentResult(orderId, maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await request.get(`/payments/${orderId}`)
        
        if (response.success) {
          const orderData = response.data
          
          if (orderData.status === 'paid') {
            return orderData
          } else if (orderData.status === 'cancelled' || orderData.status === 'expired') {
            throw new Error('支付已取消或过期')
          }
          
          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.warn(`支付结果查询失败 (${i + 1}/${maxRetries}):`, error)
        
        if (i === maxRetries - 1) {
          throw new Error('支付结果确认超时，请手动查询订单状态')
        }
        
        // 等待2秒后重试
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    throw new Error('支付结果确认超时')
  }

  /**
   * 查询订单状态
   */
  static async getOrderStatus(orderId) {
    try {
      const response = await request.get(`/payments/${orderId}`)
      
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '查询失败')
      }
    } catch (error) {
      console.error('查询订单状态失败:', error)
      throw error
    }
  }

  /**
   * 获取支付历史
   */
  static async getPaymentHistory(page = 1, pageSize = 20) {
    try {
      const response = await request.get('/payments/history', {
        page,
        pageSize
      })

      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '查询支付历史失败')
      }
    } catch (error) {
      console.error('获取支付历史失败:', error)
      throw error
    }
  }

  /**
   * 扫码支付（从二维码进入）
   */
  static async scanQRPayment(scene) {
    try {
      // 解析场景值获取商户ID
      const merchantId = this.parseSceneValue(scene)
      
      if (!merchantId) {
        throw new Error('无效的支付二维码')
      }

      return {
        merchantId,
        // 可以在这里添加商户信息查询
      }
    } catch (error) {
      console.error('处理扫码支付失败:', error)
      throw error
    }
  }

  /**
   * 解析场景值
   */
  static parseSceneValue(scene) {
    try {
      // 场景值格式: merchantId 或 merchantId:additionalInfo
      const parts = scene.split(':')
      return parts[0]
    } catch (error) {
      console.error('解析场景值失败:', error)
      return null
    }
  }

  /**
   * 格式化金额显示
   */
  static formatAmount(amount) {
    return (amount / 100).toFixed(2)
  }

  /**
   * 格式化积分显示
   */
  static formatPoints(points) {
    return Math.floor(points).toLocaleString()
  }
}
