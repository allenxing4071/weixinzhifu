/**
 * 积分服务
 */

import request from '../utils/request.js'

export class PointsService {
  /**
   * 获取用户积分余额
   */
  static async getPointsBalance() {
    try {
      const response = await request.get('/points/balance')
      
      if (response.success) {
        const balanceData = response.data
        
        // 更新缓存
        wx.setStorageSync('pointsBalance', balanceData)
        
        return balanceData
      } else {
        throw new Error(response.message || '查询积分余额失败')
      }
    } catch (error) {
      console.error('获取积分余额失败:', error)
      
      // 返回缓存数据
      const cachedBalance = wx.getStorageSync('pointsBalance')
      if (cachedBalance) {
        console.log('使用缓存的积分数据')
        return cachedBalance
      }
      
      throw error
    }
  }

  /**
   * 获取积分记录
   */
  static async getPointsHistory(source = null, page = 1, pageSize = 20) {
    try {
      const params = { page, pageSize }
      if (source) {
        params.source = source
      }

      const response = await request.get('/points/history', params)

      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '查询积分记录失败')
      }
    } catch (error) {
      console.error('获取积分记录失败:', error)
      throw error
    }
  }

  /**
   * 刷新积分余额（不显示loading）
   */
  static async refreshPointsBalance() {
    try {
      const balanceData = await this.getPointsBalance()
      
      // 更新全局数据
      const app = getApp()
      if (app.globalData.userInfo) {
        app.globalData.userInfo.pointsBalance = balanceData.balance
        wx.setStorageSync('userInfo', app.globalData.userInfo)
      }
      
      return balanceData
    } catch (error) {
      console.warn('刷新积分余额失败:', error)
      return null
    }
  }

  /**
   * 格式化积分显示
   */
  static formatPoints(points) {
    if (typeof points !== 'number') {
      return '0'
    }
    
    // 格式化为千分位
    return Math.floor(points).toLocaleString()
  }

  /**
   * 格式化积分变化
   */
  static formatPointsChange(change) {
    if (typeof change !== 'number') {
      return '0'
    }
    
    const absChange = Math.abs(change)
    const formatted = absChange.toLocaleString()
    
    return change > 0 ? `+${formatted}` : `-${formatted}`
  }

  /**
   * 获取积分来源描述
   */
  static getSourceDescription(source) {
    const sourceMap = {
      'payment_reward': '支付奖励',
      'mall_consumption': '商城消费',
      'admin_adjust': '管理调整',
      'expired_deduct': '过期扣除'
    }
    
    return sourceMap[source] || '未知来源'
  }

  /**
   * 获取积分来源图标
   */
  static getSourceIcon(source) {
    const iconMap = {
      'payment_reward': '🎁',
      'mall_consumption': '🛒',
      'admin_adjust': '⚙️',
      'expired_deduct': '⏰'
    }
    
    return iconMap[source] || '💰'
  }

  /**
   * 积分到期提醒
   */
  static checkExpiringPoints(balanceData) {
    if (balanceData.expiringPoints > 0) {
      const days = this.calculateDaysToExpiry(balanceData.expiringPoints)
      
      if (days <= 7) {
        wx.showModal({
          title: '积分即将过期',
          content: `您有${balanceData.expiringPoints}积分将在${days}天后过期，请及时使用`,
          confirmText: '去使用',
          cancelText: '知道了',
          success: (res) => {
            if (res.confirm) {
              // 跳转到积分商城（预留）
              wx.showToast({
                title: '积分商城即将上线',
                icon: 'none'
              })
            }
          }
        })
      }
    }
  }

  /**
   * 计算积分过期天数（示例逻辑）
   */
  static calculateDaysToExpiry(expiringPoints) {
    // 这里应该根据实际的过期时间计算
    // 暂时返回固定值，实际应该从接口获取详细信息
    return 7
  }

  /**
   * 积分动画效果
   */
  static animatePointsIncrease(element, fromValue, toValue, duration = 1000) {
    const steps = 30
    const stepValue = (toValue - fromValue) / steps
    const stepDuration = duration / steps
    
    let currentStep = 0
    
    const animate = () => {
      if (currentStep <= steps) {
        const currentValue = fromValue + (stepValue * currentStep)
        
        // 更新显示值
        if (element && element.setData) {
          element.setData({
            animatedPoints: Math.floor(currentValue)
          })
        }
        
        currentStep++
        setTimeout(animate, stepDuration)
      }
    }
    
    animate()
  }
}
