// 积分页面 - 对接真实API
const { PointsService } = require('../../services/PointsService');

Page({
  data: {
    pointsBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    monthlyEarned: 0,
    spendingPowerValue: '0.00',
    pointsHistory: [],
    paymentHistory: [],
    merchantStats: [],
    loading: false,
    activeTab: 'overview', // overview, history, rewards, analytics
    pagination: {
      page: 1,
      pageSize: 20,
      hasMore: true
    }
  },

  onLoad() {
    console.log('💰 积分页面加载');
    console.log('🔍 全局数据检查:', getApp().globalData);
    
    // 检查是否为演示模式
    if (getApp().globalData.demoMode) {
      console.log('🎮 演示模式：使用模拟积分数据');
      this.loadDemoData();
    } else {
      console.log('🔗 真实模式：调用API加载数据');
      this.loadPointsData();
    }
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    
    // 页面显示时刷新数据
    if (getApp().globalData.demoMode) {
      this.loadDemoData();
    } else {
      this.loadPointsData();
    }
  },

  // 加载演示数据
  loadDemoData() {
    console.log('🎮 加载演示积分数据...');
    
    const demoPointsHistory = [
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
    ];

    const demoPaymentHistory = [
      {
        orderId: 'pay_demo_001',
        orderNo: 'PAY20241227001',
        amount: '88.00', // 显示金额（元）
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
    ];

    const demoMerchantStats = [
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
    ];

    // 设置演示数据
    this.setData({
      pointsBalance: 1580,
      totalEarned: 1630,
      totalSpent: 50,
      monthlyEarned: 388,
      spendingPowerValue: (1580 / 100).toFixed(2),
      pointsHistory: demoPointsHistory,
      paymentHistory: demoPaymentHistory,
      merchantStats: demoMerchantStats,
      loading: false,
      activeTab: 'overview' // 更新为新的默认标签页
    });

    console.log('✅ 演示积分数据加载完成');
    console.log('📊 数据详情:', {
      pointsBalance: 1580,
      totalEarned: 1630,
      totalSpent: 50,
      monthlyEarned: 388,
      historyCount: demoPointsHistory.length,
      paymentCount: demoPaymentHistory.length,
      merchantCount: demoMerchantStats.length,
      activeTab: 'overview'
    });
    
    // 显示演示模式提示
    wx.showToast({
      title: '演示数据已加载',
      icon: 'success',
      duration: 1500
    });
  },

  // 加载积分数据
  async loadPointsData() {
    this.setData({ loading: true });
    
    try {
      await Promise.all([
        this.loadPointsBalance(),
        this.loadPointsHistory(),
        this.loadPaymentHistory(),
        this.loadMerchantStats()
      ]);
    } catch (error) {
      console.error('❌ 加载积分数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载积分余额
  async loadPointsBalance() {
    try {
      const balanceData = await PointsService.getBalance();
      this.setData({
        pointsBalance: balanceData.balance,
        totalEarned: balanceData.totalEarned,
        totalSpent: balanceData.totalSpent,
        monthlyEarned: balanceData.monthlyEarned,
        spendingPowerValue: (balanceData.balance / 100).toFixed(2)
      });
      console.log('✅ 积分余额加载成功:', balanceData.balance);
    } catch (error) {
      console.error('❌ 加载积分余额失败:', error);
    }
  },

  // 加载积分历史
  async loadPointsHistory() {
    try {
      const historyData = await PointsService.getHistory();
      this.setData({
        pointsHistory: historyData.records || []
      });
      console.log('✅ 积分历史加载成功:', historyData.records?.length || 0, '条');
    } catch (error) {
      console.error('❌ 加载积分历史失败:', error);
    }
  },

  // 加载支付记录
  async loadPaymentHistory() {
    try {
      const paymentData = await PointsService.getPaymentHistory();
      this.setData({
        paymentHistory: paymentData.records || []
      });
      console.log('✅ 支付记录加载成功:', paymentData.records?.length || 0, '条');
    } catch (error) {
      console.error('❌ 加载支付记录失败:', error);
    }
  },

  // 加载商户统计
  async loadMerchantStats() {
    try {
      const merchantData = await PointsService.getMerchantStats();
      this.setData({
        merchantStats: merchantData.merchantGroups || []
      });
      console.log('✅ 商户统计加载成功:', merchantData.merchantGroups?.length || 0, '个商户');
    } catch (error) {
      console.error('❌ 加载商户统计失败:', error);
    }
  },

  // 切换标签页
  onTabChange(e) {
    const activeTab = e.currentTarget.dataset.tab;
    this.setData({ activeTab });
  },

  // 格式化时间
  formatTime(timeStr) {
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 格式化金额
  formatAmount(amount) {
    return `¥${amount.toFixed(2)}`;
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadPointsData();
    wx.stopPullDownRefresh();
  },

  // 商城点击事件
  onMallTap() {
    wx.showModal({
      title: '积分商城',
      content: '积分商城即将上线！我们正在为您准备丰富的兑换选项和精美礼品。敬请期待更多精彩内容！',
      confirmText: '好的',
      showCancel: false,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '即将上线！',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  // 上拉加载更多
  async onReachBottom() {
    if (!this.data.pagination.hasMore) return;
    
    // 加载更多数据的逻辑
    console.log('📄 加载更多数据...');
  }
});
