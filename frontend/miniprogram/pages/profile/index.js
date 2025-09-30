// profile/index.js - 生产环境版本

Page({
  data: {
    userInfo: {
      nickname: '加载中...',
      avatar: '/images/default-avatar.png',
      phone: '',
      level: 1,
      levelName: '普通会员'
    },
    pointsInfo: {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      monthlyEarned: 0
    },
    paymentInfo: {
      totalOrders: 0,
      totalAmount: '0.00'
    },
    paymentHistory: [],
    showPaymentHistory: false,
    loadingHistory: false,
    version: '1.0.0',
    loading: true,
    menuItems: [
      {
        icon: '📊',
        title: '积分记录',
        desc: '查看积分获得和使用记录',
        url: '/pages/points/history'
      },
      {
        icon: '💳',
        title: '支付记录',
        desc: '查看支付订单历史',
        url: '/pages/payment/history'
      },
      {
        icon: '❓',
        title: '帮助中心',
        desc: '常见问题和使用指南',
        action: 'showHelp'
      },
      {
        icon: 'ℹ️',
        title: '关于我们',
        desc: '了解积分助手',
        action: 'showAbout'
      }
    ]
  },

  onLoad() {
    console.log('👤 个人中心页面加载（生产模式）')
  },

  onShow() {
    console.log('👤 个人中心页面显示')
    console.log('🔍 检查全局数据:', getApp().globalData)
    
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    
    // 检查是否为演示模式
    if (getApp().globalData.demoMode) {
      console.log('🎮 演示模式：使用演示用户数据')
      this.loadDemoUserData()
    } else {
      console.log('🔗 真实模式：调用API加载数据')
      this.loadUserData()
    }
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  /**
   * 加载演示用户数据
   */
  loadDemoUserData() {
    console.log('🎮 加载演示用户数据...')
    
    const demoUserInfo = {
      nickname: '测试用户',
      avatar: '/images/demo-avatar.png',
      phone: '138****8888',
      level: 3,
      levelName: '黄金会员',
      joinDate: '2024-08-15',
      totalSaves: 458.60
    }
    
    const demoPointsInfo = {
      balance: 1580,
      totalEarned: 1630,
      totalSpent: 50,
      monthlyEarned: 388
    }
    
    const demoPaymentInfo = {
      totalOrders: 2,
      totalAmount: '238.00'
    }
    
    this.setData({
      userInfo: demoUserInfo,
      pointsInfo: demoPointsInfo,
      paymentInfo: demoPaymentInfo,
      loading: false
    })
    
    console.log('✅ 演示用户数据加载完成')
    
    // 显示演示模式提示
    wx.showToast({
      title: '演示模式已激活',
      icon: 'success',
      duration: 1500
    })
  },

  /**
   * 显示登录提示
   */
  showLoginPrompt() {
    this.setData({
      userInfo: {
        nickname: '未登录',
        avatar: '/images/default-avatar.png',
        phone: '',
        level: 0,
        levelName: '请先登录'
      },
      pointsInfo: {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        monthlyEarned: 0
      },
      loading: false
    })
  },

  /**
   * 加载用户数据
   */
  async loadUserData() {
    try {
      console.log('👤 加载用户数据...')
      this.setData({ loading: true })
      
      // 并行加载用户信息和积分信息
      const [userResult, pointsResult] = await Promise.all([
        this.loadUserInfo(),
        this.loadPointsInfo()
      ])
      
      if (userResult) {
        this.setData({ userInfo: userResult })
      }
      
      if (pointsResult) {
        this.setData({ pointsInfo: pointsResult })
      }
      
      console.log('✅ 用户数据加载成功')
      
    } catch (error) {
      console.error('❌ 加载用户数据失败:', error)
      
      wx.showToast({
        title: '数据加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      const response = await app.requestAPI('/auth/user-info', 'GET')
      
      if (response.success) {
        const userData = response.data
        
        return {
          nickname: userData.nickname || '微信用户',
          avatar: userData.avatar || '/images/default-avatar.png',
          phone: userData.phone || '',
          level: userData.level || 1,
          levelName: this.getLevelName(userData.level || 1),
          openid: userData.openid,
          registeredAt: userData.registeredAt
        }
      } else {
        throw new Error(response.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error)
      
      // 从本地缓存获取用户信息作为备选
      const cachedUserInfo = app.getUserInfo()
      if (cachedUserInfo) {
        return {
          nickname: cachedUserInfo.nickname || '微信用户',
          avatar: cachedUserInfo.avatar || '/images/default-avatar.png',
          phone: cachedUserInfo.phone || '',
          level: 1,
          levelName: '普通会员'
        }
      }
      
      return null
    }
  },

  /**
   * 加载积分信息
   */
  async loadPointsInfo() {
    try {
      const response = await app.requestAPI('/points/balance', 'GET')
      
      if (response.success) {
        const pointsData = response.data
        
        return {
          balance: pointsData.balance || 0,
          totalEarned: pointsData.totalEarned || 0,
          totalSpent: pointsData.totalSpent || 0,
          monthlyEarned: pointsData.monthlyEarned || 0
        }
      } else {
        throw new Error(response.message || '获取积分信息失败')
      }
    } catch (error) {
      console.error('❌ 获取积分信息失败:', error)
      return null
    }
  },

  /**
   * 获取会员等级名称
   */
  getLevelName(level) {
    const levelNames = {
      1: '普通会员',
      2: '银牌会员',
      3: '金牌会员',
      4: '钻石会员',
      5: '至尊会员'
    }
    return levelNames[level] || '普通会员'
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      await this.loadUserData()
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 处理菜单项点击
   */
  handleMenuClick(e) {
    const item = e.currentTarget.dataset.item
    
    if (item.url) {
      // 页面跳转
      wx.navigateTo({
        url: item.url
      })
    } else if (item.action) {
      // 执行特定动作
      this[item.action]()
    }
  },

  /**
   * 显示帮助
   */
  showHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 扫描商户二维码进行支付\n2. 支付成功后自动获得积分\n3. 积分可用于兑换商品或优惠\n4. 查看积分记录和支付历史',
      showCancel: false
    })
  },

  /**
   * 显示关于信息
   */
  showAbout() {
    wx.showModal({
      title: '关于积分助手',
      content: '积分助手 v1.0.0\n\n一个简单易用的积分管理小程序，帮您轻松管理和使用积分奖励。\n\n技术支持：华夏数谷科技',
      showCancel: false
    })
  },

  /**
   * 手动登录
   */
  async doLogin() {
    try {
      wx.showLoading({ title: '登录中...' })
      
      await app.doWechatLogin()
      
      // 登录成功后刷新数据
      this.loadUserData()
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('❌ 手动登录失败:', error)
      
      wx.showModal({
        title: '登录失败',
        content: '登录过程中出现错误，请稍后重试',
        showCancel: false
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginState()
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          
          // 更新页面状态
          this.showLoginPrompt()
        }
      }
    })
  },

  /**
   * 更新用户信息
   */
  async updateUserInfo() {
    if (!app.isLoggedIn()) {
      this.showLoginPrompt()
      return
    }

    // 获取用户信息
    try {
      const userProfile = await wx.getUserProfile({
        desc: '用于完善会员资料'
      })
      
      const response = await app.requestAPI('/auth/update-profile', 'PUT', {
        nickname: userProfile.userInfo.nickName,
        avatar: userProfile.userInfo.avatarUrl
      })
      
      if (response.success) {
        wx.showToast({
          title: '资料更新成功',
          icon: 'success'
        })
        
        // 刷新用户数据
        this.loadUserData()
      } else {
        throw new Error(response.message)
      }
      
    } catch (error) {
      console.error('❌ 更新用户信息失败:', error)
      
      if (error.errMsg && error.errMsg.includes('getUserProfile:cancel')) {
        // 用户取消授权
        return
      }
      
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
    }
  },

  /**
   * 切换支付记录显示状态
   */
  togglePaymentHistory() {
    const showPaymentHistory = !this.data.showPaymentHistory
    this.setData({ showPaymentHistory })
    
    // 如果是首次展开且没有支付记录，则加载数据
    if (showPaymentHistory && (!this.data.paymentHistory || this.data.paymentHistory.length === 0)) {
      this.loadPaymentHistory()
    }
  },

  /**
   * 加载支付记录
   */
  async loadPaymentHistory() {
    try {
      this.setData({ loadingHistory: true })
      
      // 演示模式下加载演示数据
      if (getApp().globalData.demoMode) {
        const demoPaymentHistory = [
          {
            id: 'pay_demo_001',
            orderNo: 'PAY20241227001',
            merchantName: '成都市中鑫博海国际酒业贸易有限公司',
            description: '微信支付',
            formattedAmount: '88.00',
            pointsAwarded: 88,
            status: 'completed',
            statusText: '支付成功',
            formattedTime: '12/27 14:30'
          },
          {
            id: 'pay_demo_002',
            orderNo: 'PAY20241226002',
            merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
            description: '微信支付',
            formattedAmount: '150.00',
            pointsAwarded: 150,
            status: 'completed',
            statusText: '支付成功',
            formattedTime: '12/26 19:45'
          }
        ]
        
        this.setData({ 
          paymentHistory: demoPaymentHistory,
          loadingHistory: false
        })
        return
      }
      
      // 调用真实API获取支付记录
      const response = await getApp().requestAPI('/payments/history', 'GET', {
        page: 1,
        pageSize: 10
      })
      
      if (response.success) {
        const records = (response.data.records || []).map(record => ({
          id: record.orderId,
          orderNo: record.orderNo,
          merchantName: record.merchantName,
          description: record.description || '微信支付',
          formattedAmount: (record.amount / 100).toFixed(2),
          pointsAwarded: record.pointsEarned,
          status: record.status,
          statusText: record.status === 'completed' ? '支付成功' : '处理中',
          formattedTime: this.formatTime(record.createdAt)
        }))
        
        this.setData({ 
          paymentHistory: records,
          loadingHistory: false
        })
      }
      
    } catch (error) {
      console.error('❌ 加载支付记录失败:', error)
      this.setData({ loadingHistory: false })
      
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  /**
   * 查看支付详情
   */
  viewPaymentDetail(e) {
    const order = e.currentTarget.dataset.order
    
    wx.showModal({
      title: '支付详情',
      content: `商户：${order.merchantName}\n订单号：${order.orderNo}\n金额：¥${order.formattedAmount}\n积分：+${order.pointsAwarded}\n时间：${order.formattedTime}`,
      showCancel: false
    })
  },

  /**
   * 跳转到完整支付记录页面
   */
  goToFullHistory() {
    wx.navigateTo({
      url: '/pages/payment/history'
    })
  },

  /**
   * 跳转到积分页面
   */
  goToPoints() {
    wx.switchTab({
      url: '/pages/points/index'
    })
  },

  /**
   * 跳转到积分商城（暂未开放）
   */
  goToMall() {
    wx.showToast({
      title: '即将上线',
      icon: 'none'
    })
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    const date = new Date(timeStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hours}:${minutes}`
  },

  /**
   * 显示用户协议
   */
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议内容...',
      showCancel: false
    })
  },

  /**
   * 显示隐私政策
   */
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策内容...',
      showCancel: false
    })
  },

  /**
   * 处理登录
   */
  handleLogin() {
    // 如果是演示模式，直接设置演示用户
    if (getApp().globalData.demoMode) {
      getApp().setupDemoMode()
      this.loadDemoUserData()
      return
    }
    
    // 否则执行真实登录
    getApp().doWechatLogin()
  },

  /**
   * 处理退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          getApp().clearLoginState()
          
          this.setData({
            userInfo: null,
            pointsInfo: {
              balance: 0,
              totalEarned: 0,
              totalSpent: 0,
              monthlyEarned: 0
            },
            paymentHistory: [],
            showPaymentHistory: false
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 编辑个人资料
   */
  editProfile() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00\n或点击确定复制客服微信号',
      confirmText: '复制微信',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'points_helper_service',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }
})