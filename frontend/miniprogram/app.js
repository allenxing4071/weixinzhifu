// app.js - 纯UI测试版本
App({
  globalData: {
    userInfo: null,  // 生产环境：用户信息由登录获取
    token: null,     // 生产环境：token由登录获取
    baseUrl: 'http://8.156.84.226/api/v1',   // 开发环境API地址（HTTP）
    version: '1.0.0',
    productionMode: true,   // 正式环境模式
    demoMode: false,        // 关闭演示模式，使用真实数据
  },

  onLaunch() {
    console.log('📱 积分小程序启动（生产环境）')
    
    // 生产环境：检查本地存储的登录状态
    const savedToken = wx.getStorageSync('token')
    const savedUserInfo = wx.getStorageSync('userInfo')
    
    if (savedToken && savedUserInfo) {
      this.globalData.token = savedToken
      this.globalData.userInfo = savedUserInfo
      console.log('✅ 恢复登录状态:', savedUserInfo.nickname)
    } else {
      console.log('🔑 未登录，需要进行微信授权')
    }
  },

  onShow() {
    console.log('📱 积分小程序显示（生产环境）')
  },

  clearLoginState() {
    // 生产环境：清除登录状态
    this.globalData.token = null
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('pointsBalance')
    console.log('🔑 已清除登录状态')
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
