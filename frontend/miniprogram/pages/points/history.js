// pages/points/history.js
import { PointsService } from '../../services/points.js'
import { AuthService } from '../../services/auth.js'

Page({
  data: {
    records: [],
    pointsStats: {
      currentBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      expiringPoints: 0
    },
    currentFilter: 'all',
    filterOptions: [
      { label: '全部', value: 'all' },
      { label: '获得', value: 'earn' },
      { label: '使用', value: 'spend' },
      { label: '过期', value: 'expired' },
      { label: '调整', value: 'adjust' }
    ],
    loading: false,
    loadingMore: false,
    refreshing: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 20
  },

  onLoad() {
    // 检查登录状态
    if (!AuthService.isLoggedIn()) {
      wx.showModal({
        title: '登录提示',
        content: '查看积分记录需要先登录',
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
      await this.loadPointsRecords()
      this.calculateStatistics()
    } catch (error) {
      console.error('积分记录页面初始化失败:', error)
      this.showErrorToast('加载失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      this.setData({ refreshing: true })
      this.setData({
        currentPage: 1,
        hasMore: true,
        records: []
      })
      await this.loadPointsRecords()
      this.calculateStatistics()
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      this.setData({ refreshing: false })
    }
  },

  /**
   * 加载积分记录
   */
  async loadPointsRecords() {
    try {
      // 生成模拟积分记录
      const mockRecords = this.generateMockPointsRecords()
      
      const formattedRecords = mockRecords.map(record => ({
        ...record,
        formattedTime: this.formatTime(record.createdAt),
        expirationInfo: this.getExpirationInfo(record)
      }))
      
      this.setData({ records: formattedRecords })
      
    } catch (error) {
      console.error('加载积分记录失败:', error)
      throw error
    }
  },

  /**
   * 生成模拟积分记录
   */
  generateMockPointsRecords() {
    const recordTypes = [
      {
        type: 'earn',
        changeType: 'earn',
        sourceName: '支付奖励',
        sourceIcon: '💰',
        description: '支付获得积分',
        merchants: ['小米便利店', '星巴克咖啡', '麦当劳', '肯德基']
      },
      {
        type: 'spend',
        changeType: 'spend',
        sourceName: '积分消费',
        sourceIcon: '🛒',
        description: '积分商城消费',
        merchants: ['积分商城']
      },
      {
        type: 'expired',
        changeType: 'spend',
        sourceName: '积分过期',
        sourceIcon: '⏰',
        description: '积分到期清零',
        merchants: ['系统']
      },
      {
        type: 'adjust',
        changeType: 'earn',
        sourceName: '积分调整',
        sourceIcon: '⚙️',
        description: '客服积分调整',
        merchants: ['客服']
      }
    ]

    const records = []
    let currentBalance = 1288 // 当前积分

    for (let i = 0; i < 20; i++) {
      const typeInfo = recordTypes[Math.floor(Math.random() * recordTypes.length)]
      const pointsChange = Math.floor(Math.random() * 100) + 10 // 10-110积分
      const timeOffset = Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000 // 最近30天
      const createdAt = new Date(Date.now() - timeOffset)
      const merchant = typeInfo.merchants[Math.floor(Math.random() * typeInfo.merchants.length)]

      // 计算变更后余额（倒推）
      if (typeInfo.changeType === 'earn') {
        currentBalance -= pointsChange
      } else {
        currentBalance += pointsChange
      }

      const record = {
        id: `points_${Date.now()}_${i}`,
        type: typeInfo.type,
        changeType: typeInfo.changeType,
        sourceName: typeInfo.sourceName,
        sourceIcon: typeInfo.sourceIcon,
        description: `${merchant}${typeInfo.description}`,
        pointsChange: pointsChange,
        balanceAfter: Math.max(0, currentBalance + pointsChange),
        createdAt: createdAt,
        orderNo: typeInfo.type === 'earn' ? `NO${String(Date.now()).slice(-6)}${i}` : null
      }

      // 添加关联支付信息（仅限支付奖励类型）
      if (typeInfo.type === 'earn' && typeInfo.sourceName === '支付奖励') {
        record.relatedPayment = {
          merchantName: merchant,
          amount: (pointsChange / 100).toFixed(2) // 假设1元=1积分
        }
      }

      records.push(record)
    }

    return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  /**
   * 计算统计信息
   */
  calculateStatistics() {
    const { records } = this.data
    
    const earnRecords = records.filter(r => r.changeType === 'earn')
    const spendRecords = records.filter(r => r.changeType === 'spend')
    
    const totalEarned = earnRecords.reduce((sum, r) => sum + r.pointsChange, 0)
    const totalSpent = spendRecords.reduce((sum, r) => sum + r.pointsChange, 0)
    const currentBalance = totalEarned - totalSpent
    const expiringPoints = Math.floor(Math.random() * 200) // 模拟即将过期积分

    this.setData({
      pointsStats: {
        currentBalance,
        totalEarned,
        totalSpent,
        expiringPoints
      }
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
    // 实现筛选逻辑
    const allRecords = this.data.records
    let filteredRecords = allRecords

    if (filter !== 'all') {
      filteredRecords = allRecords.filter(record => record.type === filter)
    }

    this.setData({ records: filteredRecords })
  },

  /**
   * 查看详情
   */
  viewDetail(e) {
    const record = e.currentTarget.dataset.record
    
    let content = `类型：${record.sourceName}\n`
    content += `变动：${record.changeType === 'earn' ? '+' : '-'}${record.pointsChange}积分\n`
    content += `余额：${record.balanceAfter}积分\n`
    content += `时间：${record.formattedTime}\n`
    
    if (record.orderNo) {
      content += `订单号：${record.orderNo}\n`
    }
    
    if (record.relatedPayment) {
      content += `关联支付：${record.relatedPayment.merchantName} ¥${record.relatedPayment.amount}`
    }

    wx.showModal({
      title: '积分记录详情',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 获取过期信息
   */
  getExpirationInfo(record) {
    if (record.changeType === 'earn') {
      // 模拟过期时间（获得积分1年后过期）
      const expirationDate = new Date(record.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      
      if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
        return `${daysUntilExpiration}天后过期`
      }
    }
    return null
  },

  /**
   * 加载更多
   */
  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return

    try {
      this.setData({ loadingMore: true })
      
      // 模拟加载更多
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      this.setData({ 
        loadingMore: false,
        hasMore: false
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