// payment/index.js - 生产环境版本 - 修复商户信息加载
const app = getApp()

Page({
  data: {
    merchantId: '',
    merchantInfo: {
      name: '加载中...',
      desc: '正在获取商户信息',
      avatar: '',
      address: '',
      verified: false,
      status: 'loading',
      subMchId: '',
      businessCategory: ''
    },
    amount: '',
    formattedAmount: '0.00',
    expectedPoints: 0,
    canPay: false,
    paying: false,
    loading: true,
    remark: '',
    displayAmount: '',
    inputAmount: ''
  },

  onLoad(options) {
    console.log('💰 支付页面参数:', options)
    
    // 检查登录状态
    if (!app.isLoggedIn()) {
      this.showLoginPrompt()
      return
    }

    // 获取商户ID和金额
    if (options.merchantId) {
      this.setData({ 
        merchantId: options.merchantId,
        amount: options.amount || ''
      })
      
      // 加载真实商户信息
      this.loadRealMerchantInfo(options.merchantId)
    } else {
      wx.showModal({
        title: '参数错误',
        content: '缺少商户信息，请重新扫码',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  onShow() {
    // 每次显示时检查登录状态
    if (!app.isLoggedIn()) {
      this.showLoginPrompt()
    }
  },

  /**
   * 显示登录提示
   */
  showLoginPrompt() {
    wx.showModal({
      title: '登录提示',
      content: '支付功能需要先登录微信账号',
      confirmText: '去登录',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          app.doWechatLogin().then(() => {
            this.loadRealMerchantInfo(this.data.merchantId)
          })
        } else {
          wx.navigateBack()
        }
      }
    })
  },

  /**
   * 加载真实商户信息 - 修复版
   */
  async loadRealMerchantInfo(merchantId) {
    try {
      console.log('🏪 加载真实商户信息:', merchantId)
      this.setData({ loading: true })
      
      // 调用真实商户API - 不再使用硬编码数据
      const response = await app.requestAPI(`/merchants/${merchantId}`, 'GET')
      
      if (response.success) {
        const merchantData = response.data.merchant || response.data
        
        console.log('✅ 获取到真实商户数据:', merchantData)
        
        this.setData({
          merchantInfo: {
            name: merchantData.merchantName || merchantData.name || '未知商户',
            desc: merchantData.businessCategory || merchantData.desc || '商户服务',
            avatar: merchantData.avatar || '/images/default-merchant.png',
            address: merchantData.address || '线上商户',
            verified: merchantData.status === 'active',
            status: merchantData.status || 'unknown',
            subMchId: merchantData.subMchId || merchantData.sub_mch_id,
            businessCategory: merchantData.businessCategory || merchantData.business_category,
            contactPerson: merchantData.contactPerson || merchantData.contact_person,
            contactPhone: merchantData.contactPhone || merchantData.contact_phone
          }
        })
        
        console.log('✅ 商户信息设置成功:', this.data.merchantInfo.name)
      } else {
        throw new Error(response.message || '获取商户信息失败')
      }
      
    } catch (error) {
      console.error('❌ 加载商户信息失败:', error)
      
      // API失败时显示错误状态，不使用假数据
      this.setData({
        merchantInfo: {
          name: '商户信息加载失败',
          desc: '请检查网络连接后重试',
          avatar: '/images/error-merchant.png',
          address: '未知地址',
          verified: false,
          status: 'error',
          subMchId: '',
          businessCategory: ''
        }
      })
      
      wx.showModal({
        title: '加载失败',
        content: `商户信息加载失败: ${error.message}`,
        confirmText: '重试',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            this.loadRealMerchantInfo(merchantId)
          } else {
            wx.navigateBack()
          }
        }
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 金额输入处理
   */
  onAmountInput(e) {
    const value = e.detail.value
    const amount = parseFloat(value) || 0
    
    this.setData({
      inputAmount: value,
      amount: amount,
      formattedAmount: amount.toFixed(2),
      expectedPoints: Math.floor(amount), // 1元=1积分
      canPay: amount >= 0.01 // 最小支付金额1分
    })
  },

  /**
   * 快速金额选择
   */
  selectQuickAmount(e) {
    const amount = parseFloat(e.currentTarget.dataset.amount)
    
    this.setData({
      inputAmount: amount.toString(),
      amount: amount,
      formattedAmount: amount.toFixed(2),
      expectedPoints: Math.floor(amount),
      canPay: true
    })
  },

  /**
   * 处理支付 - 真实微信支付
   */
  async handlePay() {
    if (!this.data.canPay || this.data.paying) {
      return
    }

    if (!app.isLoggedIn()) {
      this.showLoginPrompt()
      return
    }

    if (this.data.amount < 0.01) {
      wx.showToast({
        title: '金额不能小于0.01元',
        icon: 'error'
      })
      return
    }

    // 检查商户状态
    if (this.data.merchantInfo.status === 'error') {
      wx.showModal({
        title: '商户信息错误',
        content: '商户信息加载失败，请重新扫码或联系商户',
        showCancel: false
      })
      return
    }

    try {
      console.log('💳 开始真实支付流程...', {
        merchantId: this.data.merchantId,
        amount: this.data.amount,
        merchantName: this.data.merchantInfo.name
      })
      
      this.setData({ paying: true })

      // 1. 创建支付订单
      console.log('📝 创建支付订单...')
      const orderResponse = await app.requestAPI('/payments/create', 'POST', {
        merchantId: this.data.merchantId,
        amount: Math.round(this.data.amount * 100), // 转换为分
        description: `${this.data.merchantInfo.name}收款`,
        remark: this.data.remark
      })

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || '创建订单失败')
      }

      console.log('✅ 订单创建成功:', orderResponse.data.orderId)

      // 2. 调用微信支付
      console.log('💰 调用微信支付...')
      const paymentParams = orderResponse.data

      await wx.requestPayment({
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.packageStr,
        signType: 'RSA',
        paySign: paymentParams.paySign
      })

      console.log('✅ 微信支付成功')

      // 3. 支付成功处理
      await this.handlePaymentSuccess({
        orderId: paymentParams.orderId,
        amount: this.data.amount,
        awardedPoints: this.data.expectedPoints,
        merchantName: this.data.merchantInfo.name
      })

    } catch (error) {
      console.error('❌ 支付失败:', error)
      
      if (error.errMsg && error.errMsg.includes('requestPayment:cancel')) {
        // 用户取消支付
        wx.showToast({
          title: '支付已取消',
          icon: 'none'
        })
      } else {
        // 其他支付错误
        wx.showModal({
          title: '支付失败',
          content: error.message || '支付过程中出现错误，请重试',
          showCancel: false
        })
      }
    } finally {
      this.setData({ paying: false })
    }
  },

  /**
   * 支付成功处理
   */
  async handlePaymentSuccess(paymentResult) {
    try {
      console.log('🎉 处理支付成功:', paymentResult)

      // 1. 保存支付成功信息到本地存储
      wx.setStorageSync('recentPaymentSuccess', {
        orderId: paymentResult.orderId,
        amount: paymentResult.amount,
        awardedPoints: paymentResult.awardedPoints,
        merchantName: paymentResult.merchantName,
        timestamp: Date.now()
      })

      // 2. 显示支付成功提示
      wx.showToast({
        title: `支付成功，获得${paymentResult.awardedPoints}积分`,
        icon: 'success',
        duration: 2000
      })

      // 3. 延迟跳转到积分页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/points/index?paymentSuccess=true'
        })
      }, 2000)

    } catch (error) {
      console.error('❌ 支付成功处理失败:', error)
      
      // 即使处理失败，也跳转到积分页面
      wx.redirectTo({
        url: '/pages/points/index?paymentSuccess=true'
      })
    }
  },

  /**
   * 查询支付状态（用于验证支付结果）
   */
  async checkPaymentStatus(orderId) {
    try {
      const response = await app.requestAPI(`/payments/status/${orderId}`, 'GET')
      
      if (response.success) {
        return response.data.status
      }
      
      return 'unknown'
    } catch (error) {
      console.error('❌ 查询支付状态失败:', error)
      return 'unknown'
    }
  },

  /**
   * 备注输入
   */
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  },

  /**
   * 查看商户详情
   */
  viewMerchantDetail() {
    if (this.data.merchantInfo.status === 'error') {
      // 重新加载商户信息
      this.loadRealMerchantInfo(this.data.merchantId)
      return
    }

    const info = this.data.merchantInfo
    wx.showModal({
      title: info.name,
      content: `商户类型：${info.businessCategory || '未知'}\n联系人：${info.contactPerson || '未知'}\n联系电话：${info.contactPhone || '未知'}\n状态：${info.verified ? '已认证' : '未认证'}\n商户号：${info.subMchId || '未配置'}`,
      showCancel: false
    })
  }
})