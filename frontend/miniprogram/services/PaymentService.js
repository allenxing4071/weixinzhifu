// 支付服务 - 对接真实API
class PaymentService {
  static async createPayment(data) {
    try {
      console.log('💳 创建支付订单请求:', data);
      
      // 获取或生成用户ID
      let userId = wx.getStorageSync('userId');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        wx.setStorageSync('userId', userId);
      }
      
      const response = await wx.request({
        url: `${getApp().globalData.baseUrl}/payments`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wx.getStorageSync('token')}`,
          'user-id': userId
        },
        data: data
      });

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || '创建支付订单失败');
      }
    } catch (error) {
      console.error('❌ 创建支付订单失败:', error);
      throw error;
    }
  }

  static async mockPaymentSuccess(orderId) {
    try {
      console.log('🎉 模拟支付成功请求:', orderId);
      
      // 获取用户ID
      const userId = wx.getStorageSync('userId');
      
      const response = await wx.request({
        url: `${getApp().globalData.baseUrl}/payments/callback`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wx.getStorageSync('token')}`,
          'user-id': userId
        },
        data: { orderId }
      });

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || '支付回调失败');
      }
    } catch (error) {
      console.error('❌ 支付回调失败:', error);
      throw error;
    }
  }

  static async getPaymentHistory(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await wx.request({
        url: `${getApp().globalData.baseUrl}/payments/history?${query}`,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        }
      });

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || '获取支付记录失败');
      }
    } catch (error) {
      console.error('❌ 获取支付记录失败:', error);
      throw error;
    }
  }

  static async getMerchantStats() {
    try {
      const response = await wx.request({
        url: `${getApp().globalData.baseUrl}/payments/merchant-stats`,
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        }
      });

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || '获取商户统计失败');
      }
    } catch (error) {
      console.error('❌ 获取商户统计失败:', error);
      throw error;
    }
  }
}

module.exports = { PaymentService };
