// profile/index.js - 生产环境版本
const app = getApp()

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
    loading: true,
    menuItems: [
      {
        icon: '/images/icons/history.png',
        title: '积分记录',
        desc: '查看积分获得和使用记录',
        url: '/pages/points/history'
      },
      {
        icon: '/images/icons/order.png',
        title: '支付记录',
        desc: '查看支付订单历史',
        url: '/pages/payment/history'
      },
      {
        icon: '/images/icons/help.png',
        title: '帮助中心',
        desc: '常见问题和使用指南',
        action: 'showHelp'
      },
      {
        icon: '/images/icons/about.png',
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
    
    // 检查登录状态
    if (!app.isLoggedIn()) {
      this.showLoginPrompt()
      return
    }
    
    this.loadUserData()
  },

  onPullDownRefresh() {
    this.refreshData()
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