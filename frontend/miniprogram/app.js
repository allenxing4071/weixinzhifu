// app.js - 生产环境版本
App({
  globalData: {
    userInfo: null,     // 用户信息由真实登录获取
    token: null,        // JWT Token由真实登录获取
    baseUrl: 'http://8.156.84.226/api/v1',  // 生产环境API地址
    version: '1.0.0',
    productionMode: true,   // 生产环境模式
    demoMode: false,       // 关闭演示模式
  },

  onLaunch() {
    console.log('🚀 积分助手小程序启动（生产模式）')
    
    // 生产模式：检查真实登录状态
    this.checkLoginStatus()
    this.checkUpdate()
  },

  onShow() {
    console.log('📱 积分小程序显示（生产模式）')
  },

  onHide() {
    console.log('📱 积分小程序隐藏')
  },

  /**
   * 检查登录状态 - 生产环境
   */
  async checkLoginStatus() {
    try {
      console.log('🔑 检查登录状态...')
      
      // 1. 检查本地存储的token
      const storedToken = wx.getStorageSync('token')
      const storedUserInfo = wx.getStorageSync('userInfo')
      
      if (storedToken && storedUserInfo) {
        // 2. 验证token有效性
        const isValid = await this.validateToken(storedToken)
        
        if (isValid) {
          this.globalData.token = storedToken
          this.globalData.userInfo = storedUserInfo
          console.log('✅ 登录状态有效:', storedUserInfo.nickname)
          return
        }
      }
      
      // 3. token无效或不存在，执行微信登录
      console.log('🔑 执行微信登录...')
      await this.doWechatLogin()
      
    } catch (error) {
      console.error('❌ 检查登录状态失败:', error)
      // 登录失败时清除可能的错误数据
      this.clearLoginState()
    }
  },

  /**
   * 执行微信登录
   */
  async doWechatLogin() {
    try {
      console.log('🔑 开始微信登录流程...')
      
      // 1. 获取微信授权码
      const loginResult = await wx.login()
      if (!loginResult.code) {
        throw new Error('获取微信授权码失败')
      }
      
      console.log('✅ 获取授权码成功:', loginResult.code)
      
      // 2. 调用后端登录接口
      const response = await this.requestAPI('/auth/wechat-login', 'POST', {
        code: loginResult.code
      })
      
      if (response.success) {
        // 3. 保存登录信息
        this.globalData.token = response.data.token
        this.globalData.userInfo = response.data.userInfo
        
        wx.setStorageSync('token', response.data.token)
        wx.setStorageSync('userInfo', response.data.userInfo)
        
        console.log('✅ 微信登录成功:', response.data.userInfo.nickname)
      } else {
        throw new Error(response.message || '登录失败')
      }
      
    } catch (error) {
      console.error('❌ 微信登录失败:', error)
      
      // 登录失败时使用临时访客模式
      wx.showModal({
        title: '登录失败',
        content: '微信登录失败，是否重试？',
        confirmText: '重试',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            this.doWechatLogin()
          }
        }
      })
    }
  },

  /**
   * 验证Token有效性
   */
  async validateToken(token) {
    try {
      const response = await this.requestAPI('/auth/validate', 'POST', {}, {
        'Authorization': `Bearer ${token}`
      })
      
      return response.success
    } catch (error) {
      console.error('❌ Token验证失败:', error)
      return false
    }
  },

  /**
   * 统一网络请求方法
   */
  requestAPI(url, method = 'GET', data = {}, customHeaders = {}) {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
      }
      
      // 如果有token且不是登录接口，添加Authorization头
      if (this.globalData.token && !url.includes('/auth/wechat-login')) {
        headers['Authorization'] = `Bearer ${this.globalData.token}`
      }
      
      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        data,
        header: headers,
        timeout: 10000,
        success: (res) => {
          console.log(`📡 API请求: ${method} ${url}`, res.data)
          
          if (res.statusCode === 200) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // Token过期，清除登录状态
            this.clearLoginState()
            wx.showModal({
              title: '登录过期',
              content: '请重新登录',
              showCancel: false,
              success: () => {
                this.doWechatLogin()
              }
            })
            reject(new Error('登录过期'))
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail: (error) => {
          console.error(`❌ API请求失败: ${method} ${url}`, error)
          reject(error)
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
    wx.removeStorageSync('pointsBalance')
    console.log('🔑 已清除登录状态')
  },

  /**
   * 获取用户信息（供页面调用）
   */
  getUserInfo() {
    return this.globalData.userInfo
  },

  /**
   * 检查是否已登录（供页面调用）
   */
  isLoggedIn() {
    return !!(this.globalData.token && this.globalData.userInfo)
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