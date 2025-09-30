// app.js - 纯UI测试版本
App({
  globalData: {
    userInfo: {
      id: 'demo_user_001',
      nickname: '演示用户',
      avatar: '',
      pointsBalance: 1288
    },
    token: 'demo_token_123',
    baseUrl: '',  // 空地址，不发送网络请求
    version: '1.0.0',
    demoMode: true
  },

  onLaunch() {
    console.log('📱 积分小程序启动（演示模式）')
    
    // 设置演示数据
    wx.setStorageSync('userInfo', this.globalData.userInfo)
    wx.setStorageSync('token', this.globalData.token)
    wx.setStorageSync('pointsBalance', {
      balance: 1288,
      totalEarned: 2000,
      totalSpent: 712,
      expiringPoints: 200
    })
  },

  onShow() {
    console.log('📱 积分小程序显示（演示模式）')
  },

  clearLoginState() {
    // 演示模式不清除登录状态
    console.log('演示模式：保持登录状态')
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
