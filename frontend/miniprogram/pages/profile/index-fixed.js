// profile/index.js - 修复版
import { AuthService } from '../../services/auth.js'
import { PointsService } from '../../services/points.js'
import { PaymentService } from '../../services/payment.js'

const app = getApp()

Page({
  data: {
    userInfo: null,
    pointsInfo: {
      balance: 0,
      totalEarned: 0
    },
    paymentInfo: {
      totalOrders: 0,
      totalAmount: '0.00'
    },
    formattedJoinTime: '',
    version: '1.0.0',
    showPaymentHistory: false,
    paymentHistory: [],
    loadingHistory: false
  },

  onLoad() {
    console.log('👤 我的页面加载');
    this.setData({
      version: app.globalData.version
    });
  },

  onShow() {
    console.log('👤 我的页面显示');
    this.initPage();
  },

  /**
   * 页面初始化 - 强制显示用户信息
   */
  async initPage() {
    try {
      console.log('🔄 强制初始化我的页面');
      
      // 强制设置演示用户信息
      const demoUserInfo = {
        nickname: '积分测试用户',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxCqRzuYWQmpwiaqQEjNxbC7HaJial/132',
        phone: '138****8888',
        joinTime: '2025-01-01',
        level: 'VIP会员'
      };
      
      this.setData({ 
        userInfo: demoUserInfo,
        pointsInfo: {
          balance: 1288,
          totalEarned: 2000
        },
        paymentInfo: {
          totalOrders: 15,
          totalAmount: '2580.00'
        }
      });
      
      this.formatJoinTime();
      
      // 同时尝试加载真实数据
      await this.loadUserStats();
      
    } catch (error) {
      console.error('❌ 个人中心初始化失败:', error);
      // 确保至少显示演示数据
      this.showDemoData();
    }
  },

  /**
   * 显示演示数据
   */
  showDemoData() {
    this.setData({
      userInfo: {
        nickname: '积分测试用户',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKxCqRzuYWQmpwiaqQEjNxbC7HaJial/132',
        phone: '138****8888',
        joinTime: '2025-01-01',
        level: 'VIP会员'
      },
      pointsInfo: {
        balance: 1288,
        totalEarned: 2000
      },
      paymentInfo: {
        totalOrders: 15,
        totalAmount: '2580.00'
      }
    });
    console.log('👤 显示演示用户数据');
  },

  /**
   * 加载用户统计信息
   */
  async loadUserStats() {
    try {
      console.log('📊 加载用户统计信息');
      
      const [userInfoRes, pointsRes] = await Promise.all([
        AuthService.getUserInfo(),
        PointsService.getPointsBalance()
      ]);
      
      if (userInfoRes.success) {
        this.setData({
          userInfo: userInfoRes.data
        });
        console.log('✅ 用户信息加载成功:', userInfoRes.data);
      }
      
      if (pointsRes.success) {
        this.setData({
          pointsInfo: {
            balance: pointsRes.data.balance,
            totalEarned: pointsRes.data.totalEarned
          }
        });
        console.log('✅ 积分信息加载成功:', pointsRes.data);
      }
      
    } catch (error) {
      console.error('❌ 加载用户统计失败:', error);
    }
  },

  /**
   * 格式化加入时间
   */
  formatJoinTime() {
    const userInfo = this.data.userInfo;
    if (userInfo && userInfo.joinTime) {
      this.setData({
        formattedJoinTime: userInfo.joinTime
      });
    } else {
      this.setData({
        formattedJoinTime: '2025-01-01'
      });
    }
  },

  /**
   * 退出登录
   */
  async logout() {
    try {
      const res = await wx.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        confirmText: '退出',
        cancelText: '取消'
      });

      if (res.confirm) {
        AuthService.logout();
        wx.showToast({
          title: '已退出登录',
          icon: 'success'
        });
        
        // 重新显示演示数据
        this.showDemoData();
      }
    } catch (error) {
      console.error('❌ 退出登录失败:', error);
    }
  },

  /**
   * 查看支付历史
   */
  async viewPaymentHistory() {
    try {
      this.setData({ 
        loadingHistory: true,
        showPaymentHistory: true 
      });
      
      // 模拟支付历史数据
      const mockHistory = [
        {
          id: 1,
          orderId: 'ORDER_123',
          amount: 50.00,
          points: 50,
          createTime: '2025-09-25 14:30:00',
          status: 'completed'
        },
        {
          id: 2,
          orderId: 'ORDER_456',
          amount: 120.00,
          points: 120,
          createTime: '2025-09-24 16:20:00',
          status: 'completed'
        }
      ];
      
      this.setData({
        paymentHistory: mockHistory
      });
      
    } catch (error) {
      console.error('❌ 加载支付历史失败:', error);
    } finally {
      this.setData({ loadingHistory: false });
    }
  },

  /**
   * 关闭支付历史
   */
  closePaymentHistory() {
    this.setData({ showPaymentHistory: false });
  }
});
