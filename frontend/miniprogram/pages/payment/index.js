// 支付页面 - 对接真实API
const { PaymentService } = require('../../services/PaymentService');
const { PointsService } = require('../../services/PointsService');

Page({
  data: {
    merchantId: '',
    subMchId: '',
    merchantInfo: null,
    amount: '',
    loading: false,
    userInputAmount: true, // 允许用户输入金额
    expectedPoints: 0,
    qrCodeParams: null // 存储二维码参数
  },

  onLoad(options) {
    console.log('💳 支付页面加载, options:', options);
    
    // 处理二维码扫描的参数
    if (options.merchantId) {
      this.setData({ merchantId: options.merchantId });
      
      // 存储二维码完整参数
      const qrCodeParams = {
        merchantId: options.merchantId,
        subMchId: options.subMchId,
        timestamp: options.timestamp,
        sign: options.sign
      };
      this.setData({ 
        qrCodeParams: qrCodeParams,
        subMchId: options.subMchId || ''
      });
      
      console.log('🔍 二维码参数:', qrCodeParams);
      
      // 验证二维码签名（演示模式下跳过）
      if (options.sign && options.timestamp && options.subMchId && !getApp().globalData.demoMode) {
        this.verifyQRCodeSignature(qrCodeParams);
      } else if (getApp().globalData.demoMode) {
        console.log('🎮 演示模式：跳过二维码签名验证');
        wx.showToast({
          title: '演示模式已激活',
          icon: 'success',
          duration: 1000
        });
      }
      
      this.loadMerchantInfo(options.merchantId);
    }
    
    // 如果URL中有amount参数，设置为默认值但允许修改
    if (options.amount) {
      this.setData({ 
        amount: options.amount,
        userInputAmount: true 
      });
      this.calculatePoints();
    }
  },

  // 验证二维码签名
  async verifyQRCodeSignature(qrCodeParams) {
    try {
      console.log('🔐 验证二维码签名...');
      
      const response = await wx.request({
        url: `${getApp().globalData.baseUrl}/admin/qrcode/verify`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        data: {
          merchantId: qrCodeParams.merchantId,
          subMchId: qrCodeParams.subMchId,
          sign: qrCodeParams.sign,
          fixedAmount: qrCodeParams.amount ? parseFloat(qrCodeParams.amount) : undefined
        }
      });

      if (response.data && response.data.success) {
        console.log('✅ 二维码验证通过:', response.data.data.merchant);
        wx.showToast({
          title: '二维码验证通过',
          icon: 'success',
          duration: 1000
        });
      } else {
        console.warn('⚠️ 二维码验证失败:', response.data?.message);
        wx.showModal({
          title: '安全提示',
          content: '二维码验证失败，可能是伪造的二维码',
          showCancel: false
        });
      }
    } catch (error) {
      console.error('❌ 二维码验证异常:', error);
      wx.showToast({
        title: '验证失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载商户信息
  async loadMerchantInfo(merchantId) {
    try {
      this.setData({ loading: true });
      
      // 演示模式直接使用本地数据
      if (getApp().globalData.demoMode) {
        console.log('🎮 演示模式：使用本地商户数据');
        this.loadLocalMerchantInfo(merchantId);
        return;
      }
      
      // 调用真实商户API
      const response = await wx.request({
        url: `${getApp().globalData.baseUrl}/api/v1/admin/merchants/${merchantId}`,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });

      if (response.data && response.data.success) {
        const merchant = response.data.data.merchant;
        this.setData({ 
          merchantInfo: {
            name: merchant.merchantName,
            businessCategory: merchant.businessCategory,
            subMchId: merchant.subMchId
          }
        });
        console.log('✅ 商户信息加载成功:', merchant.merchantName);
      } else {
        // 如果API失败，使用本地商户数据作为备选
        console.log('⚠️ 商户API失败，使用本地数据');
        this.loadLocalMerchantInfo(merchantId);
      }
    } catch (error) {
      console.error('❌ 加载商户信息失败:', error);
      this.loadLocalMerchantInfo(merchantId);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 本地商户数据备选
  loadLocalMerchantInfo(merchantId) {
    const localMerchants = {
      'merchant-001': {
        name: '仁寿县怀仁街道云锦汇会所（个体工商户）',
        businessCategory: '休闲娱乐',
        subMchId: '1728001633'
      },
      'merchant-002': {
        name: '仁寿县怀仁街道储府鱼庄店（个体工商户）',
        businessCategory: '餐饮',
        subMchId: '1727952181'
      },
      'merchant-003': {
        name: '仁寿县怀仁街道颐善滋养园养生馆（个体工商户）',
        businessCategory: '生活服务',
        subMchId: '1727857063'
      },
      'merchant-004': {
        name: '成都市中鑫博海国际酒业贸易有限公司',
        businessCategory: '酒类贸易',
        subMchId: '1727774152'
      },
      'merchant-005': {
        name: '德阳市叁思科技有限公司',
        businessCategory: '数字娱乐',
        subMchId: '1727565030'
      }
    };

    const merchantInfo = localMerchants[merchantId];
    if (merchantInfo) {
      this.setData({ merchantInfo });
      console.log('✅ 使用本地商户数据:', merchantInfo.name);
    }
  },

  // 金额输入
  onAmountInput(e) {
    const amount = e.detail.value;
    this.setData({ amount });
    this.calculatePoints();
  },

  // 计算预期积分
  calculatePoints() {
    const amount = parseFloat(this.data.amount) || 0;
    const expectedPoints = Math.max(Math.floor(amount * 1), 1); // 1元=1积分，最少1积分
    this.setData({ expectedPoints });
  },

  // 发起支付
  async onPay() {
    if (!this.data.amount || parseFloat(this.data.amount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    if (!this.data.merchantId) {
      wx.showToast({ title: '商户信息错误', icon: 'none' });
      return;
    }

    try {
      this.setData({ loading: true });
      
      const amountInCents = Math.round(parseFloat(this.data.amount) * 100);
      
      console.log('💳 创建支付订单:', {
        merchantId: this.data.merchantId,
        amount: amountInCents
      });

      // 调用支付创建API
      const paymentData = await PaymentService.createPayment({
        merchantId: this.data.merchantId,
        subMchId: this.data.subMchId || this.data.merchantInfo?.subMchId,
        amount: amountInCents,
        qrCodeParams: this.data.qrCodeParams // 传递二维码参数用于验证
      });

      console.log('✅ 支付订单创建成功:', paymentData);

      // 显示支付确认
      const confirmResult = await this.showPaymentConfirm(paymentData);
      if (!confirmResult) {
        return;
      }

      // 模拟支付成功（实际项目中调用微信支付）
      await this.mockPaymentSuccess(paymentData.orderId);

    } catch (error) {
      console.error('❌ 支付失败:', error);
      wx.showToast({ 
        title: error.message || '支付失败，请重试', 
        icon: 'none' 
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 显示支付确认弹窗
  showPaymentConfirm(paymentData) {
    return new Promise((resolve) => {
      wx.showModal({
        title: '确认支付',
        content: `商户：${paymentData.merchantName || this.data.merchantInfo?.name}\n金额：¥${this.data.amount}\n预计积分：${paymentData.expectedPoints}`,
        confirmText: '确认支付',
        cancelText: '取消',
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  },

  // 模拟支付成功
  async mockPaymentSuccess(orderId) {
    try {
      console.log('🎉 模拟支付成功:', orderId);
      
      // 调用支付成功API
      const successResult = await PaymentService.mockPaymentSuccess(orderId);
      
      console.log('✅ 积分发放成功:', successResult);

      // 显示成功提示
      wx.showToast({
        title: `支付成功！获得${successResult.pointsAwarded}积分`,
        icon: 'success',
        duration: 2000
      });

      // 延迟跳转到积分页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/points/index'
        });
      }, 2000);

    } catch (error) {
      console.error('❌ 支付回调失败:', error);
      wx.showToast({ 
        title: '支付成功，但积分发放异常', 
        icon: 'none' 
      });
    }
  },

  // 查看积分
  onViewPoints() {
    wx.navigateTo({
      url: '/pages/points/index'
    });
  }
});
