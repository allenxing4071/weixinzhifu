// 积分服务 - 与后台API交互

class PointsService {
  /**
   * 获取用户积分余额
   */
  static async getBalance() {
    try {
      const response = await getApp().requestAPI('/points/balance', 'GET');
      
      if (response.success) {
        return {
          balance: response.data.balance || 0,
          totalEarned: response.data.totalEarned || 0,
          totalSpent: response.data.totalSpent || 0,
          monthlyEarned: response.data.monthlyEarned || 0
        };
      } else {
        throw new Error(response.message || '获取积分余额失败');
      }
    } catch (error) {
      console.error('❌ PointsService.getBalance 失败:', error);
      
      // 如果是演示模式，返回演示数据
      if (getApp().globalData.demoMode) {
        return {
          balance: 1580,
          totalEarned: 1630,
          totalSpent: 50,
          monthlyEarned: 388
        };
      }
      
      throw error;
    }
  }

  /**
   * 获取积分历史记录
   */
  static async getHistory(page = 1, pageSize = 20) {
    try {
      const response = await getApp().requestAPI('/points/history', 'GET', {
        page,
        pageSize
      });
      
      if (response.success) {
        const records = (response.data.records || []).map(record => ({
          id: record.id,
          type: record.type, // 'earned' | 'spent'
          pointsChange: record.pointsChange,
          description: record.description,
          merchantName: record.merchantName,
          orderId: record.orderId,
          createdAt: record.createdAt,
          formattedTime: this.formatTime(record.createdAt)
        }));
        
        return {
          records,
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        };
      } else {
        throw new Error(response.message || '获取积分历史失败');
      }
    } catch (error) {
      console.error('❌ PointsService.getHistory 失败:', error);
      
      // 如果是演示模式，返回演示数据
      if (getApp().globalData.demoMode) {
        return {
          records: [
            {
              id: 'demo_001',
              type: 'earned',
              pointsChange: 88,
              description: '支付获得积分',
              merchantName: '成都市中鑫博海国际酒业贸易有限公司',
              orderId: 'PAY20241227001',
              createdAt: '2024-12-27 14:30:00',
              formattedTime: '12/27 14:30'
            },
            {
              id: 'demo_002',
              type: 'earned',
              pointsChange: 150,
              description: '支付获得积分',
              merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
              orderId: 'PAY20241226002',
              createdAt: '2024-12-26 19:45:00',
              formattedTime: '12/26 19:45'
            },
            {
              id: 'demo_003',
              type: 'spent',
              pointsChange: -50,
              description: '积分兑换商品',
              merchantName: '积分商城',
              orderId: 'REDEEM001',
              createdAt: '2024-12-25 16:20:00',
              formattedTime: '12/25 16:20'
            },
            {
              id: 'demo_004',
              type: 'earned',
              pointsChange: 200,
              description: '支付获得积分',
              merchantName: '仁寿县怀仁街道储府鱼庄店（个体工商户）',
              orderId: 'PAY20241224003',
              createdAt: '2024-12-24 12:15:00',
              formattedTime: '12/24 12:15'
            }
          ],
          total: 4,
          hasMore: false
        };
      }
      
      throw error;
    }
  }

  /**
   * 获取支付记录
   */
  static async getPaymentHistory(page = 1, pageSize = 20) {
    try {
      const response = await getApp().requestAPI('/payments/history', 'GET', {
        page,
        pageSize
      });
      
      if (response.success) {
        const records = (response.data.records || []).map(record => ({
          orderId: record.orderId,
          orderNo: record.orderNo,
          amount: (record.amount / 100).toFixed(2), // 分转元
          merchantName: record.merchantName,
          merchantCategory: record.merchantCategory,
          pointsEarned: record.pointsEarned,
          status: record.status,
          createdAt: record.createdAt,
          formattedTime: this.formatTime(record.createdAt)
        }));
        
        return {
          records,
          total: response.data.total || 0,
          hasMore: response.data.hasMore || false
        };
      } else {
        throw new Error(response.message || '获取支付记录失败');
      }
    } catch (error) {
      console.error('❌ PointsService.getPaymentHistory 失败:', error);
      
      // 如果是演示模式，返回演示数据
      if (getApp().globalData.demoMode) {
        return {
          records: [
            {
              orderId: 'pay_demo_001',
              orderNo: 'PAY20241227001',
              amount: '88.00',
              merchantName: '成都市中鑫博海国际酒业贸易有限公司',
              merchantCategory: '酒类贸易',
              pointsEarned: 88,
              status: 'completed',
              createdAt: '2024-12-27 14:30:00',
              formattedTime: '12/27 14:30'
            },
            {
              orderId: 'pay_demo_002',
              orderNo: 'PAY20241226002',
              amount: '150.00',
              merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
              merchantCategory: '休闲娱乐',
              pointsEarned: 150,
              status: 'completed',
              createdAt: '2024-12-26 19:45:00',
              formattedTime: '12/26 19:45'
            }
          ],
          total: 2,
          hasMore: false
        };
      }
      
      throw error;
    }
  }

  /**
   * 获取商户统计
   */
  static async getMerchantStats() {
    try {
      const response = await getApp().requestAPI('/payments/merchant-stats', 'GET');
      
      if (response.success) {
        const stats = (response.data.merchantGroups || []).map(group => ({
          merchantId: group.merchantId,
          merchantName: group.merchantName,
          merchantCategory: group.merchantCategory,
          orderCount: group.orderCount,
          totalAmount: (group.totalAmount / 100).toFixed(2), // 分转元
          totalPoints: group.totalPoints
        }));
        
        return {
          merchantGroups: stats
        };
      } else {
        throw new Error(response.message || '获取商户统计失败');
      }
    } catch (error) {
      console.error('❌ PointsService.getMerchantStats 失败:', error);
      
      // 如果是演示模式，返回演示数据
      if (getApp().globalData.demoMode) {
        return {
          merchantGroups: [
            {
              merchantId: 'merchant-004',
              merchantName: '成都市中鑫博海国际酒业贸易有限公司',
              merchantCategory: '酒类贸易',
              orderCount: 1,
              totalAmount: '88.00',
              totalPoints: 88
            },
            {
              merchantId: 'merchant-001',
              merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
              merchantCategory: '休闲娱乐',
              orderCount: 1,
              totalAmount: '150.00',
              totalPoints: 150
            },
            {
              merchantId: 'merchant-002',
              merchantName: '仁寿县怀仁街道储府鱼庄店（个体工商户）',
              merchantCategory: '餐饮',
              orderCount: 1,
              totalAmount: '200.00',
              totalPoints: 200
            }
          ]
        };
      }
      
      throw error;
    }
  }

  /**
   * 格式化时间
   */
  static formatTime(timeStr) {
    const date = new Date(timeStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  }

  /**
   * 添加积分
   */
  static async addPoints(amount, description, orderId) {
    try {
      const response = await getApp().requestAPI('/points/add', 'POST', {
        amount,
        description,
        orderId
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '添加积分失败');
      }
    } catch (error) {
      console.error('❌ PointsService.addPoints 失败:', error);
      throw error;
    }
  }

  /**
   * 消费积分
   */
  static async spendPoints(amount, description) {
    try {
      const response = await getApp().requestAPI('/points/spend', 'POST', {
        amount,
        description
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || '消费积分失败');
      }
    } catch (error) {
      console.error('❌ PointsService.spendPoints 失败:', error);
      throw error;
    }
  }
}

module.exports = {
  PointsService
};