// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://api.guandongfang.cn/api/v1',
    version: '1.0.0',
    debugMode: true  // 调试模式，跳过网络请求
  },

  onLaunch() {
    console.log('📱 积分小程序启动')
    
    // 检查微信版本
    this.checkWechatVersion()
    
    // 初始化应用
    this.initializeApp()
  },

  onShow() {
    console.log('📱 积分小程序显示')
  },

  onHide() {
    console.log('📱 积分小程序隐藏')
  },

  /**
   * 检查微信版本
   */
  checkWechatVersion() {
    const systemInfo = wx.getSystemInfoSync()
    console.log('系统信息:', {
      platform: systemInfo.platform,
      version: systemInfo.version,
      SDKVersion: systemInfo.SDKVersion
    })

    // 检查基础库版本
    if (this.compareVersion(systemInfo.SDKVersion, '2.0.0') < 0) {
      wx.showModal({
        title: '版本过低',
        content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
        showCancel: false
      })
    }
  },

  /**
   * 初始化应用
   */
  async initializeApp() {
    try {
      // 1. 恢复登录状态
      await this.restoreLoginState()
      
      // 2. 预加载关键数据
      this.preloadData()
      
    } catch (error) {
      console.error('应用初始化失败:', error)
    }
  },

  /**
   * 恢复登录状态
   */
  async restoreLoginState() {
    try {
      // 调试模式跳过网络验证
      if (this.globalData.debugMode) {
        console.log('🧪 调试模式：跳过登录状态恢复')
        return
      }
      
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      
      if (token && userInfo) {
        this.globalData.token = token
        this.globalData.userInfo = userInfo
        
        // 验证token有效性
        const isValid = await this.verifyToken(token)
        if (!isValid) {
          // token无效，清除本地数据
          this.clearLoginState()
        }
      }
    } catch (error) {
      console.error('恢复登录状态失败:', error)
      this.clearLoginState()
    }
  },

  /**
   * 验证token有效性
   */
  async verifyToken(token) {
    return new Promise((resolve) => {
      wx.request({
        url: `${this.globalData.baseUrl}/auth/user-info`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          resolve(res.statusCode === 200 && res.data.success)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  /**
   * 清除登录状态
   */
  clearLoginState() {
    this.globalData.token = null
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  },

  /**
   * 预加载数据
   */
  preloadData() {
    // 调试模式跳过预加载
    if (this.globalData.debugMode) {
      console.log('🧪 调试模式：跳过数据预加载')
      return
    }
    
    // 预加载积分余额（如果已登录）
    if (this.globalData.token) {
      this.preloadPointsBalance()
    }
  },

  /**
   * 预加载积分余额
   */
  preloadPointsBalance() {
    wx.request({
      url: `${this.globalData.baseUrl}/points/balance`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          wx.setStorageSync('pointsBalance', res.data.data)
        }
      },
      fail: (error) => {
        console.warn('预加载积分余额失败:', error)
      }
    })
  },

  /**
   * 版本比较工具
   */
  compareVersion(v1, v2) {
    const v1parts = v1.split('.')
    const v2parts = v2.split('.')
    const maxLength = Math.max(v1parts.length, v2parts.length)

    for (let i = 0; i < maxLength; i++) {
      const v1part = parseInt(v1parts[i] || '0')
      const v2part = parseInt(v2parts[i] || '0')

      if (v1part < v2part) return -1
      if (v1part > v2part) return 1
    }

    return 0
  }
})
