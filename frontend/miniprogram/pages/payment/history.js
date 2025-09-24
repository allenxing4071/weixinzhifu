// pages/payment/history.js
import { PaymentService } from '../../services/payment.js'
import { AuthService } from '../../services/auth.js'

Page({
  data: {
    records: [],
    totalOrders: 0,
    totalAmount: '0.00',
    totalPoints: 0,
    totalPointsValue: '0.00',
    currentFilter: 'all',
    filterOptions: [
      { label: '全部', value: 'all' },
      { label: '成功', value: 'success' },
      { label: '处理中', value: 'pending' },
      { label: '失败', value: 'failed' }
    ],
    loading: false,
    loadingMore: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 20
  },

  onLoad() {
    // 检查登录状态
    if (!AuthService.isLoggedIn()) {
      wx.showModal({
        title: '登录提示',
        content: '查看支付记录需要先登录',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/profile/index'
          })
        }
      })
      return
    }

    this.initPage()
  },

  onShow() {
    // 如果已经加载过数据，刷新一下
    if (this.data.records.length > 0) {
      this.refreshData()
    }
  },

  onPullDownRefresh() {
    this.refreshData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 页面初始化
   */
  async initPage() {
    try {
      this.setData({ loading: true })
      await this.loadPaymentRecords()
      this.calculateStatistics()
    } catch (error) {
      console.error('支付记录页面初始化失败:', error)
      this.showErrorToast('加载失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    this.setData({
      currentPage: 1,
      hasMore: true,
      records: []
    })
    await this.loadPaymentRecords()
    this.calculateStatistics()
  },

  /**
   * 加载支付记录
   */
  async loadPaymentRecords() {
    try {
      // 模拟支付记录数据（实际应该调用PaymentService）
      const mockRecords = this.generateMockRecords()
      
      const formattedRecords = mockRecords.map(record => ({
        ...record,
        formattedAmount: this.formatAmount(record.amount),
        formattedTime: this.formatTime(record.createdAt),
        completedAt: this.formatCompletionTime(record.paidAt)
      }))
      
      this.setData({ records: formattedRecords })
      
    } catch (error) {
      console.error('加载支付记录失败:', error)
      throw error
    }
  },

  /**
   * 生成模拟数据
   */
  generateMockRecords() {
    const merchants = [
      { name: '小米便利店', icon: '🏪' },
      { name: '星巴克咖啡', icon: '☕' },
      { name: '麦当劳', icon: '🍔' },
      { name: '肯德基', icon: '🍗' },
      { name: 'CoCo奶茶', icon: '🧋' },
      { name: '华为体验店', icon: '📱' },
      { name: '优衣库', icon: '👔' },
      { name: '711便利店', icon: '🏪' }
    ]

    const records = []
    for (let i = 0; i < 15; i++) {
      const merchant = merchants[Math.floor(Math.random() * merchants.length)]
      const amount = Math.floor(Math.random() * 200) + 10 // 10-210元
      const timeOffset = Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000 // 最近30天
      const createdAt = new Date(Date.now() - timeOffset)
      const paidAt = new Date(createdAt.getTime() + Math.random() * 60000) // 支付完成时间

      records.push({
        id: `pay_${Date.now()}_${i}`,
        merchantName: merchant.name,
        merchantIcon: merchant.icon,
        amount: amount,
        pointsAwarded: amount, // 1:1积分
        orderNo: `NO${String(Date.now()).slice(-8)}${String(i).padStart(2, '0')}`,
        description: `${merchant.name}消费`,
        paymentMethod: '微信支付',
        status: Math.random() > 0.1 ? 'success' : (Math.random() > 0.5 ? 'pending' : 'failed'),
        statusText: Math.random() > 0.1 ? '支付成功' : (Math.random() > 0.5 ? '处理中' : '支付失败'),
        createdAt: createdAt,
        paidAt: paidAt,
        canRefund: Math.random() > 0.7 && amount > 50 // 随机一些可退款的订单
      })
    }

    return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  /**
   * 计算统计信息
   */
  calculateStatistics() {
    const { records } = this.data
    const successRecords = records.filter(r => r.status === 'success')
    
    const totalOrders = successRecords.length
    const totalAmount = successRecords.reduce((sum, r) => sum + r.amount, 0)
    const totalPoints = successRecords.reduce((sum, r) => sum + r.pointsAwarded, 0)
    const totalPointsValue = totalPoints.toFixed(2) // 1积分=1元

    this.setData({
      totalOrders,
      totalAmount: this.formatAmount(totalAmount),
      totalPoints,
      totalPointsValue
    })
  },

  /**
   * 切换筛选器
   */
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ currentFilter: filter })
    this.filterRecords(filter)
  },

  /**
   * 筛选记录
   */
  filterRecords(filter) {
    // 这里可以实现真实的筛选逻辑
    // 暂时显示所有记录
    console.log('筛选条件:', filter)
  },

  /**
   * 查看详情
   */
  viewDetail(e) {
    const record = e.currentTarget.dataset.record
    
    wx.showModal({
      title: '支付详情',
      content: `商户：${record.merchantName}\n金额：¥${record.formattedAmount}\n积分：+${record.pointsAwarded}\n订单号：${record.orderNo}\n支付时间：${record.formattedTime}\n状态：${record.statusText}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 申请退款
   */
  async requestRefund(e) {
    const order = e.currentTarget.dataset.order
    
    const confirm = await wx.showModal({
      title: '申请退款',
      content: `确认要申请退款吗？\n订单金额：¥${order.formattedAmount}\n获得积分：${order.pointsAwarded}`,
      confirmText: '确认退款',
      cancelText: '取消'
    })

    if (confirm.confirm) {
      try {
        wx.showLoading({
          title: '申请退款中...',
          mask: true
        })

        // 模拟退款处理
        await new Promise(resolve => setTimeout(resolve, 2000))

        wx.hideLoading()
        wx.showToast({
          title: '退款申请已提交',
          icon: 'success'
        })

        // 刷新页面数据
        this.refreshData()

      } catch (error) {
        wx.hideLoading()
        wx.showToast({
          title: '退款申请失败',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 加载更多
   */
  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return

    try {
      this.setData({ loadingMore: true })
      
      // 模拟加载更多数据
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 这里应该加载下一页数据
      console.log('加载更多数据...')
      
      this.setData({ 
        loadingMore: false,
        hasMore: false // 模拟数据加载完毕
      })

    } catch (error) {
      this.setData({ loadingMore: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 跳转到支付页面
   */
  goToPayment() {
    wx.navigateTo({
      url: '/pages/payment/index?merchantId=merchant_demo_001'
    })
  },

  /**
   * 格式化金额
   */
  formatAmount(amount) {
    return (amount / 100).toFixed(2)
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
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
    
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      return `${days}天前`
    }
    
    // 更早
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  /**
   * 格式化完成时间
   */
  formatCompletionTime(date) {
    if (!date) return ''
    
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return `今天 ${timeStr}`
    }
    
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${timeStr}`
    }
    
    return `${date.getMonth() + 1}/${date.getDate()} ${timeStr}`
  },

  /**
   * 显示错误提示
   */
  showErrorToast(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  }
})