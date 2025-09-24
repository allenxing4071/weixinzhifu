/**
 * 认证服务
 */

import request from '../utils/request.js'

const app = getApp()

export class AuthService {
  /**
   * 微信登录
   */
  static async wechatLogin(userInfo = null) {
    try {
      // 1. 获取微信授权码
      const loginRes = await wx.login()
      if (!loginRes.code) {
        throw new Error('获取微信授权码失败')
      }

      // 2. 调用后端登录接口
      const response = await request.post('/auth/wechat-login', {
        code: loginRes.code,
        userInfo: userInfo
      })

      if (response.success) {
        // 3. 保存登录状态
        const { token, userInfo: userData } = response.data
        
        app.globalData.token = token
        app.globalData.userInfo = userData
        
        wx.setStorageSync('token', token)
        wx.setStorageSync('userInfo', userData)
        
        console.log('✅ 登录成功:', userData.nickname)
        return userData
      } else {
        throw new Error(response.message || '登录失败')
      }

    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  }

  /**
   * 获取用户信息（需要点击触发）
   */
  static async getUserProfile() {
    try {
      const userProfile = await wx.getUserProfile({
        desc: '用于完善用户资料和积分奖励服务'
      })
      
      return {
        nickName: userProfile.userInfo.nickName,
        avatarUrl: userProfile.userInfo.avatarUrl
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw new Error('获取用户信息失败')
    }
  }

  /**
   * 刷新用户信息
   */
  static async refreshUserInfo() {
    try {
      const response = await request.get('/auth/user-info')
      
      if (response.success) {
        const userInfo = response.data
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        return userInfo
      } else {
        throw new Error(response.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUserInfo(updateData) {
    try {
      const response = await request.put('/auth/user-info', updateData)
      
      if (response.success) {
        // 刷新本地用户信息
        await this.refreshUserInfo()
        return true
      } else {
        throw new Error(response.message || '更新失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  }

  /**
   * 检查登录状态
   */
  static isLoggedIn() {
    return !!(app.globalData.token && app.globalData.userInfo)
  }

  /**
   * 退出登录
   */
  static logout() {
    app.clearLoginState()
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
    
    // 跳转到首页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/points/index'
      })
    }, 1500)
  }

  /**
   * 登录检查装饰器
   */
  static requireLogin(showModal = true) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value
      
      descriptor.value = async function(...args) {
        if (!AuthService.isLoggedIn()) {
          if (showModal) {
            const modal = await wx.showModal({
              title: '登录提示',
              content: '此功能需要登录后使用',
              confirmText: '去登录',
              cancelText: '取消'
            })
            
            if (modal.confirm) {
              wx.switchTab({
                url: '/pages/points/index'
              })
            }
          }
          return false
        }
        
        return originalMethod.apply(this, args)
      }
      
      return descriptor
    }
  }
}
