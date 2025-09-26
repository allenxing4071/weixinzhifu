// points/index.js - 生产环境版本
const app = getApp()

Page({
  data: {
    balanceInfo: {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      expiringPoints: 0
    },
    formattedBalance: '0',
    pointsValue: '0.00',
    records: [],
    currentFilter: 'all',
    filterTabs: [
      { label: '全部', value: 'all' },
      { label: '获得', value: 'payment_reward' },
      { label: '消费', value: 'mall_consumption' },
      { label: '调整', value: 'admin_adjust' }
    ],
    loading: false,
    loadingMore: false,
    refreshing: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 20,
    showPaymentSuccess: false,
    newPointsAmount: 0
  },

  onLoad(options) {
    console.log('📱 积分页面加载（生产模式）')
    
    // 检查是否来自支付成功页面
    if (options.paymentSuccess === 'true') {
      this.setData({ showPaymentSuccess: true })
      this.showPaymentSuccessAnimation()
    }
    
    this.initPage()
  },

  onShow() {
    console.log('📱 积分页面显示')
    
    // 检查登录状态
    if (!app.isLoggedIn()) {
      this.showLoginPrompt()
      return
    }
    
    this.loadData()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore()
    }
  },

  /**
   * 显示登录提示
   */
  showLoginPrompt() {
    wx.showModal({
      title: '登录提示',
      content: '查看积分需要先登录微信账号',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 触发重新登录
          app.doWechatLogin().then(() => {
            this.loadData()
          })
        }
      }
    })
  },

  /**
   * 页面初始化
   */
  async initPage() {
    try {
      console.log('🔄 初始化积分页面（生产模式）')
      this.setData({ loading: true })
      
      // 等待登录完成
      if (!app.isLoggedIn()) {
        await this.waitForLogin()
      }
      
      // 加载真实数据
      await this.loadData()
      
    } catch (error) {
      console.error('❌ 页面初始化失败:', error)
      this.showErrorState()
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 等待登录完成
   */
  waitForLogin(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const checkLogin = () => {
        if (app.isLoggedIn()) {
          resolve()
        } else {
          setTimeout(checkLogin, 500)
        }
      }
      
      checkLogin()
      
      // 超时处理
      setTimeout(() => {
        if (!app.isLoggedIn()) {
          reject(new Error('登录超时'))
        }
      }, timeout)
    })
  },

  /**
   * 加载真实数据
   */
  async loadData(refresh = false) {
    try {
      console.log('📊 开始加载真实积分数据')
      
      if (!app.isLoggedIn()) {
        console.warn('⚠️ 用户未登录，无法加载数据')
        return
      }
      
      const page = refresh ? 1 : this.data.currentPage
      const source = this.data.currentFilter === 'all' ? null : this.data.currentFilter
      
      // 并行加载余额和记录
      const [balanceResult, recordsResult] = await Promise.all([
        this.loadPointsBalance(),
        this.loadPointsHistory(source, page, this.data.pageSize)
      ])
      
      console.log('✅ 积分数据加载成功')
      
      // 更新余额信息
      if (balanceResult) {
        this.setData({
          balanceInfo: balanceResult,
          formattedBalance: this.formatNumber(balanceResult.balance),
          pointsValue: (balanceResult.balance * 1).toFixed(2)
        })
      }
      
      // 更新记录信息
      if (recordsResult) {
        const newRecords = recordsResult.records || []
        this.setData({
          records: refresh ? newRecords : [...this.data.records, ...newRecords],
          hasMore: recordsResult.hasMore !== false,
          currentPage: page
        })
      }
      
    } catch (error) {
      console.error('❌ 加载积分数据失败:', error)
      
      // 网络错误时显示友好提示
      wx.showToast({
        title: '数据加载失败',
        icon: 'error',
        duration: 2000
      })
      
      this.showErrorState()
    }
  },

  /**
   * 加载积分余额
   */
  async loadPointsBalance() {
    try {
      const response = await app.requestAPI('/points/balance', 'GET')
      
      if (response.success) {
        return {
          balance: response.data.balance || 0,
          totalEarned: response.data.totalEarned || 0,
          totalSpent: response.data.totalSpent || 0,
          expiringPoints: response.data.expiringPoints || 0
        }
      } else {
        throw new Error(response.message || '获取积分余额失败')
      }
    } catch (error) {
      console.error('❌ 获取积分余额失败:', error)
      return null
    }
  },

  /**
   * 加载积分历史记录
   */
  async loadPointsHistory(source = null, page = 1, pageSize = 20) {
    try {
      const params = { page, pageSize }
      if (source) {
        params.source = source
      }
      
      const query = new URLSearchParams(params).toString()
      const response = await app.requestAPI(`/points/history?${query}`, 'GET')
      
      if (response.success) {
        return {
          records: response.data.records || [],
          hasMore: response.data.hasMore !== false,
          total: response.data.total || 0
        }
      } else {
        throw new Error(response.message || '获取积分记录失败')
      }
    } catch (error) {
      console.error('❌ 获取积分记录失败:', error)
      return null
    }
  },

  /**
   * 显示错误状态
   */
  showErrorState() {
    // 只显示加载失败的提示，不显示假数据
    this.setData({
      balanceInfo: {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        expiringPoints: 0
      },
      formattedBalance: '0',
      pointsValue: '0.00',
      records: []
    })
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      this.setData({
        refreshing: true,
        currentPage: 1,
        hasMore: true
      })
      
      await this.loadData(true)
      
    } catch (error) {
      console.error('❌ 刷新数据失败:', error)
    } finally {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 加载更多
   */
  async loadMore() {
    try {
      this.setData({ 
        loadingMore: true,
        currentPage: this.data.currentPage + 1
      })
      
      await this.loadData()
      
    } catch (error) {
      console.error('❌ 加载更多失败:', error)
      this.setData({
        currentPage: this.data.currentPage - 1
      })
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  /**
   * 切换筛选
   */
  async switchFilter(e) {
    try {
      const filter = e.currentTarget.dataset.filter
      
      this.setData({
        currentFilter: filter,
        loading: true,
        currentPage: 1,
        hasMore: true
      })
      
      await this.loadData(true)
      
    } catch (error) {
      console.error('❌ 切换筛选失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 显示支付成功动画
   */
  showPaymentSuccessAnimation() {
    // 检查本地存储中是否有最新支付信息
    const recentPayment = wx.getStorageSync('recentPaymentSuccess')
    
    if (recentPayment) {
      this.setData({
        newPointsAmount: recentPayment.awardedPoints || 0
      })
      
      // 显示积分获得动画
      setTimeout(() => {
        this.setData({ showPaymentSuccess: false })
        wx.removeStorageSync('recentPaymentSuccess')
      }, 3000)
    }
  },

  /**
   * 格式化数字
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  /**
   * 跳转功能
   */
  goToScan() {
    // 扫码功能
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        console.log('扫码结果:', res.result)
        
        // 解析二维码内容，如果是支付链接则跳转
        if (res.result.includes('merchantId')) {
          const url = new URL(res.result)
          const merchantId = url.searchParams.get('merchantId')
          
          if (merchantId) {
            wx.navigateTo({
              url: `/pages/payment/index?merchantId=${merchantId}`
            })
          }
        } else {
          wx.showToast({
            title: '无效的商户二维码',
            icon: 'error'
          })
        }
      },
      fail: (error) => {
        console.error('扫码失败:', error)
      }
    })
  },

  goToMall() {
    wx.showToast({
      title: '积分商城即将上线',
      icon: 'none'
    })
  },

  /**
   * 手动刷新
   */
  manualRefresh() {
    this.setData({ loading: true })
    this.loadData(true).finally(() => {
      this.setData({ loading: false })
    })
  }
})