/**
 * 演示版网络请求工具类
 */

class DemoRequestManager {
  constructor() {
    this.demoData = {
      userInfo: {
        id: 'demo_user_001',
        nickname: '演示用户',
        avatar: '',
        pointsBalance: 1288
      },
      pointsBalance: {
        balance: 1288,
        totalEarned: 2000,
        totalSpent: 712,
        expiringPoints: 200
      },
      pointsHistory: [
        {
          id: 'points_001',
          pointsChange: 100,
          pointsBalance: 1288,
          source: 'payment_reward',
          description: '支付订单NO123456获得积分',
          createdAt: new Date().toISOString(),
          orderNo: 'NO123456',
          merchantName: '演示商户'
        },
        {
          id: 'points_002', 
          pointsChange: 50,
          pointsBalance: 1188,
          source: 'payment_reward',
          description: '支付订单NO123455获得积分',
          createdAt: new Date(Date.now() - 24*60*60*1000).toISOString(),
          orderNo: 'NO123455',
          merchantName: '测试商户'
        }
      ]
    }
  }

  async request(options) {
    console.log('🧪 演示模式请求:', options.url)
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const url = options.url
    
    // 模拟不同API的响应
    if (url.includes('/auth/user-info')) {
      return {
        success: true,
        code: 'SUCCESS',
        message: '获取成功',
        data: this.demoData.userInfo
      }
    }
    
    if (url.includes('/points/balance')) {
      return {
        success: true,
        code: 'SUCCESS', 
        message: '查询成功',
        data: this.demoData.pointsBalance
      }
    }
    
    if (url.includes('/points/history')) {
      return {
        success: true,
        code: 'SUCCESS',
        message: '查询成功',
        data: {
          records: this.demoData.pointsHistory,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 2,
            totalPages: 1
          }
        }
      }
    }
    
    if (url.includes('/payments') && options.method === 'POST') {
      return {
        success: true,
        code: 'SUCCESS',
        message: '订单创建成功',
        data: {
          orderId: 'demo_order_' + Date.now(),
          orderNo: 'NO' + Date.now(),
          amount: options.data?.amount || 5000,
          pointsToAward: Math.floor((options.data?.amount || 5000) / 100),
          paymentParams: {
            timeStamp: Math.floor(Date.now() / 1000).toString(),
            nonceStr: 'demo_nonce',
            package: 'prepay_id=demo_prepay',
            signType: 'MD5',
            paySign: 'DEMO_SIGN'
          }
        }
      }
    }
    
    // 默认成功响应
    return {
      success: true,
      code: 'SUCCESS',
      message: '演示模式响应'
    }
  }

  get(url, params = {}) {
    return this.request({ url, method: 'GET', params })
  }

  post(url, data = {}) {
    return this.request({ url, method: 'POST', data })
  }
}

const request = new DemoRequestManager()

export default request
export const showNetworkError = () => {}
export const requestWithLoading = async (requestFn) => {
  return await requestFn()
}
