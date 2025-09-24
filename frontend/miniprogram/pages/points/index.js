// points/index.js
import { PointsService } from '../../services/points.js'
import { AuthService } from '../../services/auth.js'
import { PaymentService } from '../../services/payment.js'

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
    pageSize: 20
  },

  /**
   * 添加新的功能方法
   */
  goToScan() {
    wx.switchTab({
      url: '/pages/points/index'
    })
  },

  goToMall() {
    wx.showToast({
      title: '积分商城即将上线',
      icon: 'none'
    })
  },

  /**
   * 显示积分规则
   */
  showPointsRules() {
    wx.showModal({
      title: '积分规则',
      content: '• 使用微信扫一扫支付，每消费1元立得1积分\n• 积分在支付成功后立即入账\n• 积分无使用期限，长期有效\n• 1积分 = 1元钱，可在商城兑换商品',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  onLoad() {
    // 检查登录状态
    if (!AuthService.isLoggedIn()) {
      wx.showModal({
        title: '登录提示',
        content: '查看积分需要先登录',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/points/index'
          })
        }
      })
      return
    }

    this.initPage()
  },

  onShow() {
    // 每次显示时刷新数据
    if (AuthService.isLoggedIn()) {
      this.refreshData()
      
      // 确保积分价值正确计算
      const cachedBalance = wx.getStorageSync('pointsBalance')
      if (cachedBalance && cachedBalance.balance) {
        const pointsValue = cachedBalance.balance.toFixed(2) // 1积分=1元钱
        this.setData({
          pointsValue: pointsValue,
          balanceInfo: cachedBalance,
          formattedBalance: PointsService.formatPoints(cachedBalance.balance)
        })
      }
      
      // 检查是否从支付页面跳转过来，显示特殊动画
      this.checkPaymentRedirect()
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
      await this.loadData()
    } catch (error) {
      console.error('页面初始化失败:', error)
      this.showErrorMessage(error)
    } finally {
      this.setData({ loading: false })
    }
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
      console.error('刷新数据失败:', error)
      this.showErrorMessage(error)
    } finally {
      this.setData({ refreshing: false })
    }
  },

  /**
   * 加载数据
   */
  async loadData(refresh = false) {
    try {
      const page = refresh ? 1 : this.data.currentPage
      const source = this.data.currentFilter === 'all' ? null : this.data.currentFilter
      
      // 并行加载余额和记录
      const [balanceData, recordsData] = await Promise.all([
        PointsService.getPointsBalance(),
        PointsService.getPointsHistory(source, page, this.data.pageSize)
      ])
      
      // 更新余额信息
      const pointsValue = balanceData.balance.toFixed(2) // 1积分=1元钱
      this.setData({
        balanceInfo: balanceData,
        formattedBalance: PointsService.formatPoints(balanceData.balance),
        pointsValue: pointsValue
      })
      
      // 处理记录数据
      const formattedRecords = recordsData.records.map(record => ({
        ...record,
        sourceIcon: PointsService.getSourceIcon(record.source),
        sourceText: PointsService.getSourceDescription(record.source),
        formattedChange: PointsService.formatPointsChange(record.pointsChange),
        formattedTime: this.formatTime(record.createdAt),
        expiryText: this.getExpiryText(record.expiresAt)
      }))
      
      // 更新记录列表
      if (refresh) {
        this.setData({
          records: formattedRecords,
          currentPage: 1
        })
      } else {
        this.setData({
          records: [...this.data.records, ...formattedRecords]
        })
      }
      
      // 更新分页状态
      this.setData({
        hasMore: recordsData.records.length >= this.data.pageSize,
        currentPage: page
      })
      
    } catch (error) {
      console.error('加载数据失败:', error)
      throw error
    }
  },

  /**
   * 刷新余额
   */
  async refreshBalance() {
    try {
      this.setData({ refreshing: true })
      
      const balanceData = await PointsService.getPointsBalance()
      
      const pointsValue = balanceData.balance.toFixed(2) // 1积分=1元钱
      this.setData({
        balanceInfo: balanceData,
        formattedBalance: PointsService.formatPoints(balanceData.balance),
        pointsValue: pointsValue
      })
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('刷新余额失败:', error)
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    } finally {
      this.setData({ refreshing: false })
    }
  },

  /**
   * 切换筛选器
   */
  async switchFilter(e) {
    const filter = e.currentTarget.dataset.filter
    
    if (filter === this.data.currentFilter) {
      return
    }

    try {
      this.setData({
        currentFilter: filter,
        loading: true,
        currentPage: 1,
        hasMore: true
      })
      
      await this.loadData(true)
      
    } catch (error) {
      console.error('切换筛选失败:', error)
      this.showErrorMessage(error)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 加载更多
   */
  async loadMore() {
    if (!this.data.hasMore || this.data.loadingMore) {
      return
    }

    try {
      this.setData({ 
        loadingMore: true,
        currentPage: this.data.currentPage + 1
      })
      
      await this.loadData()
      
    } catch (error) {
      console.error('加载更多失败:', error)
      // 恢复页码
      this.setData({
        currentPage: this.data.currentPage - 1
      })
      this.showErrorMessage(error)
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  /**
   * 跳转到积分商城
   */
  goToMall() {
    wx.showToast({
      title: '积分商城即将上线',
      icon: 'none'
    })
    
    // 这里为将来的积分商城预留接口
    // wx.navigateTo({
    //   url: '/pages/mall/index'
    // })
  },

  /**
   * 跳转到扫码支付
   */
  goToScan() {
    wx.switchTab({
      url: '/pages/points/index'
    })
  },

  /**
   * 格式化时间
   */
  formatTime(dateString) {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 今天
    if (diff < 24 * 60 * 60 * 1000) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 昨天
    if (diff < 48 * 60 * 60 * 1000) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
    
    // 本年内
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
    
    // 跨年
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  },

  /**
   * 获取过期时间文本
   */
  getExpiryText(expiresAt) {
    if (!expiresAt) return ''
    
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
    
    if (days <= 0) {
      return '已过期'
    } else if (days <= 7) {
      return `${days}天后过期`
    } else if (days <= 30) {
      return `${Math.ceil(days / 7)}周后过期`
    } else {
      return `${Math.ceil(days / 30)}月后过期`
    }
  },

  /**
   * 显示错误信息
   */
  showErrorMessage(error) {
    const message = error.message || '操作失败，请稍后重试'
    
    wx.showModal({
      title: '提示',
      content: message,
      showCancel: false
    })
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '积分助手 - 支付赚积分',
      path: '/pages/points/index',
      imageUrl: '/images/share-points.png'
    }
  },

  /**
   * 检查是否从支付页面跳转（丝滑引导）
   */
  checkPaymentRedirect() {
    // 检查是否有新的积分到账
    const recentPayment = wx.getStorageSync('recentPaymentSuccess')
    if (recentPayment && Date.now() - recentPayment.timestamp < 5000) {
      // 5秒内的支付成功，显示积分更新动画
      this.animatePointsUpdate(recentPayment.pointsAwarded)
      
      // 清除标记
      wx.removeStorageSync('recentPaymentSuccess')
    }
  },

  /**
   * 积分更新动画（从支付跳转时）
   */
  animatePointsUpdate(newPoints) {
    // 显示积分到账提示
    setTimeout(() => {
      wx.showToast({
        title: `恭喜获得${newPoints}积分！`,
        icon: 'success',
        duration: 2500
      })
    }, 500)
    
    // 播放积分数字更新动画
    const query = this.createSelectorQuery()
    query.select('.balance-number').boundingClientRect()
    query.exec((res) => {
      if (res[0]) {
        // 添加更新动画类
        this.setData({
          balanceNumberAnimation: 'updating'
        })
        
        setTimeout(() => {
          this.setData({
            balanceNumberAnimation: ''
          })
        }, 1200)
      }
    })
  }
})
