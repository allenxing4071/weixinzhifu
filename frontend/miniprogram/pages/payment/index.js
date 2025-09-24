// payment/index.js
import { PaymentService } from '../../services/payment.js'
import { PointsService } from '../../services/points.js'
import { AuthService } from '../../services/auth.js'

const app = getApp()

Page({
  data: {
    merchantId: '',
    merchantInfo: {
      name: '演示商户',
      desc: '扫码支付获得积分奖励',
      avatar: '',
      address: '线上商户',
      verified: true,
      status: 'active'
    },
    amount: '',
    formattedAmount: '0.00',
    expectedPoints: 0,
    canPay: false,
    paying: false,
    showSuccessModal: false,
    awardedPoints: 0,
    showPointsAnimation: false,
    pointsAnimationText: '',
    remark: '',
    displayAmount: '',
    inputAmount: ''
  },

  onLoad(options) {
    console.log('支付页面参数:', options)
    
    // 检查登录状态
    if (!AuthService.isLoggedIn()) {
      wx.showModal({
        title: '登录提示',
        content: '支付功能需要先登录',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/points/index'
          })
        }
      })
      return
    }

    // 获取商户ID
    if (options.merchantId) {
      this.setData({ 
        merchantId: options.merchantId 
      })
      
      // 加载商户信息
      this.loadMerchantInfo(options.merchantId)
    } else {
      // 使用默认演示商户
      this.setData({ 
        merchantId: 'merchant_demo_001' 
      })
    }
  },

  /**
   * 加载商户信息
   */
  async loadMerchantInfo(merchantId) {
    try {
      // 模拟从微信支付平台API获取商户信息
      const mockMerchants = {
        'merchant_demo_001': {
          name: '数谷异联科技',
          desc: '科技服务专家',
          avatar: '/images/merchants/shugu.png',
          address: '北京市朝阳区中关村大街21号',
          verified: true,
          status: 'active',
          businessHours: '09:00-18:00',
          phone: '400-123-4567'
        },
        'merchant_xiaomi_001': {
          name: '小米便利店',
          desc: '便民服务小店',
          avatar: '/images/merchants/xiaomi.png',
          address: '上海市浦东新区世纪大道35号',
          verified: true,
          status: 'active',
          businessHours: '07:00-23:00'
        },
        'merchant_starbucks_001': {
          name: '星巴克咖啡',
          desc: '精品咖啡高品质服务',
          avatar: '/images/merchants/starbucks.png',
          address: '广州市天河区体育东路123号',
          verified: true,
          status: 'active',
          businessHours: '06:30-22:00'
        }
      }
      
      const merchantInfo = mockMerchants[merchantId] || {
        name: '未知商户',
        desc: '支付获得积分奖励',
        avatar: '/images/default-merchant.png',
        address: '线上商户',
        verified: true,
        status: 'active'
      }
      
      this.setData({ merchantInfo })
      
      console.log('商户信息加载成功:', merchantInfo.name)
      
    } catch (error) {
      console.error('加载商户信息失败:', error)
    }
  },

  /**
   * 备注输入处理
   */
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  /**
   * 数字键盘输入处理
   */
  inputNumber(e) {
    const num = e.currentTarget.dataset.num
    let currentAmount = this.data.inputAmount
    
    // 限制最多8位数
    if (currentAmount.length >= 8) return
    
    // 如果是第一位数字且是0，特殊处理
    if (currentAmount === '0' && num !== '.') {
      currentAmount = num
    } else {
      currentAmount += num
    }
    
    this.updateAmountDisplay(currentAmount)
  },

  /**
   * 输入小数点
   */
  inputDot() {
    let currentAmount = this.data.inputAmount
    
    // 已经有小数点了
    if (currentAmount.includes('.')) return
    
    // 空值时先输入0
    if (!currentAmount) {
      currentAmount = '0.'
    } else {
      currentAmount += '.'
    }
    
    this.updateAmountDisplay(currentAmount)
  },

  /**
   * 删除数字
   */
  deleteNumber() {
    let currentAmount = this.data.inputAmount
    
    if (currentAmount.length > 0) {
      currentAmount = currentAmount.slice(0, -1)
    }
    
    this.updateAmountDisplay(currentAmount)
  },

  /**
   * 更新金额显示
   */
  updateAmountDisplay(inputAmount) {
    const displayAmount = inputAmount || ''
    const numericAmount = parseFloat(inputAmount) || 0
    const formattedAmount = numericAmount.toFixed(2)
    const expectedPoints = Math.floor(numericAmount)
    const canPay = numericAmount >= 0.01 && numericAmount <= 5000
    
    this.setData({
      inputAmount,
      displayAmount,
      amount: numericAmount,
      formattedAmount,
      expectedPoints,
      canPay
    })
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  /**
   * 金额输入处理
   */
  onAmountInput(e) {
    let value = e.detail.value
    
    // 限制小数点后两位
    if (value.includes('.')) {
      const parts = value.split('.')
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substr(0, 2)
      }
    }
    
    this.updateAmount(value)
  },

  /**
   * 更新金额和积分预览
   */
  updateAmount(amountStr) {
    const amount = parseFloat(amountStr) || 0
    const formattedAmount = amount.toFixed(2)
    const expectedPoints = Math.floor(amount) // 1元=1积分，小数部分不计算
    const canPay = amount >= 0.01 && amount <= 10000 // 最小1分，最大1万元
    
    this.setData({
      amount: amountStr,
      formattedAmount,
      expectedPoints,
      canPay
    })
  },

  /**
   * 金额输入框聚焦
   */
  onAmountFocus() {
    // 可以在这里添加聚焦时的UI反馈
  },

  /**
   * 金额输入框失焦
   */
  onAmountBlur() {
    // 格式化显示金额
    if (this.data.amount) {
      const amount = parseFloat(this.data.amount) || 0
      this.setData({
        amount: amount.toFixed(2)
      })
    }
  },


  /**
   * 发起支付
   */
  async handlePayment() {
    if (!this.data.canPay || this.data.paying) {
      return
    }

    try {
      this.setData({ paying: true })
      
      const amount = Math.round(parseFloat(this.data.amount) * 100) // 转为分
      const description = `${this.data.merchantInfo.name}消费`
      
      // 确认支付弹窗
      const confirmRes = await wx.showModal({
        title: '确认支付',
        content: `向${this.data.merchantInfo.name}支付¥${this.data.formattedAmount}，将获得${this.data.expectedPoints}积分`,
        confirmText: '确认支付',
        cancelText: '取消'
      })
      
      if (!confirmRes.confirm) {
        this.setData({ paying: false })
        return
      }

      // 执行支付流程
      const paymentResult = await PaymentService.processPayment(
        this.data.merchantId,
        amount,
        description
      )

      console.log('✅ 支付成功:', paymentResult)
      
      // 显示支付成功弹窗（包含自动跳转逻辑）
      this.showPaymentSuccess(paymentResult)
      
      // 刷新用户积分数据
      await PointsService.refreshPointsBalance()

    } catch (error) {
      console.error('支付失败:', error)
      
      let errorMessage = '支付失败，请重试'
      if (error.message === '用户取消支付') {
        errorMessage = '支付已取消'
      } else if (error.message.includes('余额不足')) {
        errorMessage = '账户余额不足'
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接异常，请检查网络后重试'
      }
      
      wx.showModal({
        title: '支付失败',
        content: errorMessage,
        showCancel: false
      })
      
    } finally {
      this.setData({ paying: false })
    }
  },

  /**
   * 显示支付成功弹窗
   */
  showPaymentSuccess(paymentResult) {
    const pointsAwarded = paymentResult.pointsAwarded || this.data.expectedPoints
    
    this.setData({
      showSuccessModal: true,
      awardedPoints: pointsAwarded
    })
    
    // 播放成功音效
    wx.playBackgroundAudio && wx.playBackgroundAudio({
      dataUrl: '/sounds/success.mp3'
    }).catch(() => {
      // 音效播放失败不影响主流程
    })
    
    // 振动反馈
    wx.vibrateShort && wx.vibrateShort()
    
    // 关键：支付成功后直接跳转积分页面
    setTimeout(() => {
      this.playPointsAnimation(pointsAwarded)
    }, 1500) // 1.5秒后直接跳转
  },

  /**
   * 关闭成功弹窗
   */
  closeSuccessModal() {
    this.setData({ 
      showSuccessModal: false,
      amount: '',
      formattedAmount: '0.00',
      expectedPoints: 0,
      canPay: false
    })
  },

  /**
   * 查看积分页面
   */
  goToPoints() {
    this.closeSuccessModal()
    
    wx.switchTab({
      url: '/pages/points/index'
    })
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '积分助手 - 支付即得积分',
      path: '/pages/points/index',
      imageUrl: '/images/share-payment.png'
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '积分助手 - 支付即得积分',
      imageUrl: '/images/share-timeline.png'
    }
  },

  /**
   * 播放积分到账动画（丝滑引导核心）
   */
  playPointsAnimation(pointsAwarded) {
    // 隐藏成功弹窗
    this.setData({ showSuccessModal: false })
    
    // 显示积分动画
    this.setData({
      showPointsAnimation: true,
      pointsAnimationText: `+${pointsAwarded}积分已到账！`
    })
    
    // 振动反馈
    wx.vibrateShort()
    
    // 1秒后自动跳转到积分页面
    setTimeout(() => {
      this.redirectToPointsPage(pointsAwarded)
    }, 1000)
  },

  /**
   * 跳转到积分页面（丝滑引导）
   */
  redirectToPointsPage(pointsAwarded) {
    // 隐藏动画
    this.setData({ showPointsAnimation: false })
    
    // 设置跳转标记，供积分页面检测
    wx.setStorageSync('recentPaymentSuccess', {
      pointsAwarded: pointsAwarded,
      timestamp: Date.now()
    })
    
    // 跳转到积分页面
    wx.switchTab({
      url: '/pages/points/index',
      success: () => {
        console.log('支付成功后跳转到积分页面')
      },
      fail: () => {
        // 如果跳转失败，手动关闭弹窗
        wx.showToast({
          title: '支付成功，请手动查看积分',
          icon: 'success'
        })
      }
    })
  },

  /**
   * 提取商户ID（优化版本）
   */
  extractMerchantId(qrContent) {
    try {
      console.log('解析二维码内容:', qrContent)
      
      // 判断是否为微信支付二维码
      if (qrContent.includes('wxp://') || qrContent.includes('weixin://wxpay/')) {
        // 微信支付官方二维码格式
        console.log('识别为微信支付二维码')
        
        // 提取商户参数（模拟解析）
        if (qrContent.includes('mch_id=')) {
          const mchIdMatch = qrContent.match(/mch_id=([^&]+)/)
          if (mchIdMatch) {
            return this.mapMchIdToMerchantId(mchIdMatch[1])
          }
        }
      }
      
      // 自定义格式支持（测试用）
      if (qrContent.includes('merchantId=')) {
        const params = new URLSearchParams(qrContent.split('?')[1])
        return params.get('merchantId')
      }
      
      // 纯商户ID格式
      if (qrContent.startsWith('merchant_')) {
        return qrContent
      }
      
      // JSON格式二维码
      try {
        const qrData = JSON.parse(qrContent)
        if (qrData.merchantId) {
          return qrData.merchantId
        }
      } catch (e) {
        // 不是JSON格式，继续其他解析
      }
      
      // 默认演示商户
      console.log('使用默认演示商户')
      return 'merchant_demo_001'
      
    } catch (error) {
      console.error('解析二维码失败:', error)
      return 'merchant_demo_001' // 容错处理
    }
  },

  /**
   * 将微信支付商户号映射为内部商户ID
   */
  mapMchIdToMerchantId(mchId) {
    // 商户号映射表（实际应该从数据库查询）
    const mchIdMap = {
      '1234567890': 'merchant_demo_001',
      '1234567891': 'merchant_xiaomi_001', 
      '1234567892': 'merchant_starbucks_001'
    }
    
    return mchIdMap[mchId] || 'merchant_demo_001'
  }
})
