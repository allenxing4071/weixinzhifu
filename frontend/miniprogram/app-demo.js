// app.js
App({
  globalData: {
    userInfo: null,  // 生产环境：用户信息由登录获取
    token: null,     // 生产环境：token由登录获取
    baseUrl: 'http://8.156.84.226/api/v1',   // 开发环境API地址（HTTP）
    version: '1.0.0',
    productionMode: false,   // 正式环境模式
    demoMode: true,        // 演示模式，使用真实数据
  },

  onLaunch() {
    console.log('🚀 积分助手小程序启动（演示模式）')
    
    // 演示模式：自动设置用户信息
    this.autoLogin()
    
    this.checkUpdate()
  },

  onShow() {
    console.log('📱 积分小程序显示（演示模式）')
  },

  onHide() {
    console.log('📱 积分小程序隐藏')
  },

  // 自动登录（演示用）
  async autoLogin() {
    try {
      console.log('🔑 演示模式：自动登录...')
      
      // 设置演示用户信息
      this.globalData.token = 'demo-token-' + Date.now()
      this.globalData.userInfo = {
        nickname: '积分测试用户',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxCqRzuYWQmpwiaqQEjNxbC7HaJial/132',
        openid: 'demo-openid-123',
        phone: '138****8888'
      }
      
      // 保存到本地存储
      wx.setStorageSync('token', this.globalData.token)
      wx.setStorageSync('userInfo', this.globalData.userInfo)
      
      console.log('✅ 演示模式登录成功:', this.globalData.userInfo.nickname)
      
    } catch (error) {
      console.error('❌ 演示模式登录失败:', error)
    }
  },

  /**
   * 清除登录状态
   */
  clearLoginState() {
    this.globalData.token = null
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('pointsBalance')
    console.log('🔑 已清除登录状态')
  },

  /**
   * 检查版本更新
   */
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      
      updateManager.onCheckForUpdate(res => {
        if (res.hasUpdate) {
          console.log('📱 发现新版本')
        }
      })
      
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: res => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })
    }
  }
})
