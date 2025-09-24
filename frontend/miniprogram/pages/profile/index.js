// profile/index.js
import { AuthService } from '../../services/auth.js'
import { PointsService } from '../../services/points.js'
import { PaymentService } from '../../services/payment.js'

const app = getApp()

Page({
  data: {
    userInfo: null,
    pointsInfo: {
      balance: 0,
      totalEarned: 0
    },
    paymentInfo: {
      totalOrders: 0,
      totalAmount: '0.00'
    },
    formattedJoinTime: '',
    version: '1.0.0',
    showPaymentHistory: false,
    paymentHistory: [],
    loadingHistory: false
  },

  onLoad() {
    this.setData({
      version: app.globalData.version
    })
  },

  onShow() {
    this.initPage()
  },

  /**
   * 页面初始化
   */
  async initPage() {
    try {
      if (AuthService.isLoggedIn()) {
        this.setData({ userInfo: app.globalData.userInfo })
        this.formatJoinTime()
        await this.loadUserStats()
      }
    } catch (error) {
      console.error('个人中心初始化失败:', error)
    }
  },

  /**
   * 格式化注册时间
   */
  formatJoinTime() {
    if (!this.data.userInfo?.createdAt) return
    
    const date = new Date(this.data.userInfo.createdAt)
    const formatted = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    
    this.setData({ formattedJoinTime: formatted })
  },

  /**
   * 加载用户统计数据
   */
  async loadUserStats() {
    try {
      // 并行加载积分和支付统计
      const [pointsData, paymentsData] = await Promise.allSettled([
        PointsService.getPointsBalance(),
        PaymentService.getPaymentHistory(1, 1000) // 获取全部用于统计
      ])
      
      // 更新积分信息
      if (pointsData.status === 'fulfilled') {
        this.setData({
          pointsInfo: pointsData.value
        })
      }
      
      // 更新支付信息
      if (paymentsData.status === 'fulfilled') {
        const orders = paymentsData.value.orders.filter(order => order.status === 'paid')
        const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0)
        
        this.setData({
          paymentInfo: {
            totalOrders: orders.length,
            totalAmount: PaymentService.formatAmount(totalAmount)
          }
        })
      }
      
    } catch (error) {
      console.error('加载用户统计失败:', error)
    }
  },

  /**
   * 处理登录
   */
  async handleLogin() {
    try {
      wx.showLoading({
        title: '登录中...',
        mask: true
      })

      // 获取用户信息
      let userInfo = null
      try {
        userInfo = await AuthService.getUserProfile()
      } catch (error) {
        console.log('用户取消授权，使用默认信息登录')
      }

      // 执行登录
      const userData = await AuthService.wechatLogin(userInfo)
      
      this.setData({ userInfo: userData })
      this.formatJoinTime()
      
      wx.hideLoading()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 加载用户数据
      setTimeout(() => {
        this.loadUserStats()
      }, 1500)

    } catch (error) {
      wx.hideLoading()
      console.error('登录失败:', error)
      
      wx.showModal({
        title: '登录失败',
        content: error.message || '登录失败，请稍后重试',
        showCancel: false
      })
    }
  },

  /**
   * 编辑资料
   */
  async editProfile() {
    try {
      // 获取用户信息
      const userInfo = await AuthService.getUserProfile()
      
      // 显示编辑对话框
      wx.showModal({
        title: '编辑资料',
        content: `当前昵称：${this.data.userInfo.nickname}\n\n点击确定重新获取微信信息`,
        confirmText: '更新信息',
        cancelText: '取消',
        success: async (res) => {
          if (res.confirm) {
            try {
              // 重新登录获取最新信息
              const newUserInfo = await AuthService.wechatLogin(userInfo)
              this.setData({ userInfo: newUserInfo })
              
              wx.showToast({
                title: '信息更新成功',
                icon: 'success'
              })
            } catch (error) {
              wx.showToast({
                title: '更新失败',
                icon: 'none'
              })
            }
          }
        }
      })
      
    } catch (error) {
      console.error('编辑资料失败:', error)
      wx.showToast({
        title: '获取信息失败',
        icon: 'none'
      })
    }
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
   * 跳转到积分商城
   */
  goToMall() {
    wx.showToast({
      title: '积分商城即将上线',
      icon: 'none'
    })
  },

  /**
   * 跳转到支付历史
   */
  /**
   * 切换支付记录显示
   */
  async togglePaymentHistory() {
    const showHistory = !this.data.showPaymentHistory
    this.setData({ showPaymentHistory: showHistory })
    
    if (showHistory && this.data.paymentHistory.length === 0) {
      await this.loadPaymentHistory()
    }
  },

  /**
   * 加载支付记录
   */
  async loadPaymentHistory() {
    try {
      this.setData({ loadingHistory: true })
      
      // 模拟支付记录数据（实际应该调用PaymentService）
      const mockHistory = [
        {
          id: 'pay_001',
          merchantName: '小米便利店',
          description: '微信支付',
          amount: 100,
          formattedAmount: '100.00',
          pointsAwarded: 100,
          orderNo: 'NO123456',
          paidAt: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
          status: 'success',
          statusText: '支付成功'
        },
        {
          id: 'pay_002',
          merchantName: '星巴克咖啡',
          description: '微信支付',
          amount: 45,
          formattedAmount: '45.00',
          pointsAwarded: 45,
          orderNo: 'NO123455',
          paidAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
          status: 'success',
          statusText: '支付成功'
        },
        {
          id: 'pay_003',
          merchantName: '麦当劳',
          description: '微信支付',
          amount: 67,
          formattedAmount: '67.00',
          pointsAwarded: 67,
          orderNo: 'NO123454',
          paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
          status: 'success',
          statusText: '支付成功'
        }
      ]
      
      // 格式化时间
      const formattedHistory = mockHistory.map(item => ({
        ...item,
        formattedTime: this.formatPaymentTime(item.paidAt)
      }))
      
      this.setData({ 
        paymentHistory: formattedHistory,
        loadingHistory: false 
      })
      
    } catch (error) {
      console.error('加载支付记录失败:', error)
      this.setData({ loadingHistory: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
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
      content: `商户：${order.merchantName}\n金额：¥${order.formattedAmount}\n积分：+${order.pointsAwarded}\n时间：${order.formattedTime}\n订单号：${order.orderNo}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 跳转到完整记录页面
   */
  goToFullHistory() {
    wx.navigateTo({
      url: '/pages/payment/history'
    })
  },

  /**
   * 跳转到积分记录页面
   */
  goToPointsHistory() {
    wx.navigateTo({
      url: '/pages/points/history'
    })
  },

  /**
   * 格式化支付时间
   */
  formatPaymentTime(date) {
    if (!date) return ''
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 1小时内
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes}分钟前`
    }
    
    // 今天
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours}小时前`
    }
    
    // 昨天
    if (diff < 48 * 60 * 60 * 1000) {
      return '昨天'
    }
    
    // 更早
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  /**
   * 显示关于我们
   */
  showAbout() {
    wx.showModal({
      title: '关于积分助手',
      content: '积分助手是一款为用户提供支付积分奖励服务的小程序。支付即得积分，积分可用于消费抵扣。',
      showCancel: false
    })
  },

  /**
   * 显示用户协议
   */
  showUserAgreement() {
    wx.showModal({
      title: '用户服务协议',
      content: '1. 积分为虚拟奖励，仅限平台内使用\n2. 积分有效期为1年\n3. 平台保留最终解释权',
      showCancel: false
    })
  },

  /**
   * 显示隐私政策
   */
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私保护政策',
      content: '我们严格保护用户隐私，仅收集必要信息用于提供服务，不会泄露用户个人信息。',
      showCancel: false
    })
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00',
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4001234567'
          }).catch(() => {
            wx.showToast({
              title: '拨打失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  /**
   * 显示帮助
   */
  showHelp() {
    wx.showModal({
      title: '常见问题',
      content: 'Q: 积分如何获得？\nA: 支付后立即获得1:1积分\n\nQ: 积分如何使用？\nA: 可在积分商城消费抵扣',
      showCancel: false
    })
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          AuthService.logout()
          this.setData({
            userInfo: null,
            pointsInfo: { balance: 0, totalEarned: 0 },
            paymentInfo: { totalOrders: 0, totalAmount: '0.00' }
          })
        }
      }
    })
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '积分助手 - 支付赚积分',
      path: '/pages/points/index',
      imageUrl: '/images/share-profile.png'
    }
  }
})
