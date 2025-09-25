// 微信商户管理API - 添加到现有服务
const crypto = require('crypto');

// 模拟微信商户数据（基于用户截图）
const mockWechatMerchants = [
  {
    applymentId: '20000026911156098',
    merchantName: '仁寿县怀仁省道云创汇会所（个体工商户）',
    merchantId: '1728001633',
    status: '已完成',
    contactPerson: '刘阳',
    contactPhone: '13800138001',
    businessLicense: '91510000000000001A',
    createdAt: '2024-10-01T08:00:00.000Z',
    updatedAt: '2024-10-05T10:00:00.000Z'
  },
  {
    applymentId: '20000026908589917',
    merchantName: '仁寿县怀仁镇府商店（个体工商户）',
    merchantId: '1727952181',
    status: '已完成',
    contactPerson: '刘海龙',
    contactPhone: '13800138002',
    businessLicense: '91510000000000002B',
    createdAt: '2024-10-02T08:00:00.000Z',
    updatedAt: '2024-10-06T10:00:00.000Z'
  },
  {
    applymentId: '20000026906234402',
    merchantName: '仁寿县怀仁省道商旅游所生（个体工商户）',
    merchantId: '1727857063',
    status: '已完成',
    contactPerson: '邢海龙',
    contactPhone: '13800138003',
    businessLicense: '91510000000000003C',
    createdAt: '2024-10-03T08:00:00.000Z',
    updatedAt: '2024-10-07T10:00:00.000Z'
  },
  {
    applymentId: '20000026901164951',
    merchantName: '成都市青羊区商旅业贸易有限公司',
    merchantId: '1727774152',
    status: '已完成',
    contactPerson: '邢海龙',
    contactPhone: '13800138004',
    businessLicense: '91510000000000004D',
    createdAt: '2024-10-04T08:00:00.000Z',
    updatedAt: '2024-10-08T10:00:00.000Z'
  },
  {
    applymentId: '20000026893722474',
    merchantName: '德阳市金堂科技有限公司',
    merchantId: '1727656030',
    status: '已完成',
    contactPerson: '赵其年',
    contactPhone: '13800138005',
    businessLicense: '91510000000000005E',
    createdAt: '2024-10-05T08:00:00.000Z',
    updatedAt: '2024-10-09T10:00:00.000Z'
  }
];

// 微信商户管理API路由
const wechatMerchantRoutes = {
  // 获取微信商户列表
  'GET /api/v1/admin/wechat-merchants': (req, res) => {
    try {
      const { limit = 20, offset = 0, status } = req.query;
      
      let merchants = [...mockWechatMerchants];
      
      // 状态过滤
      if (status === 'completed') {
        merchants = merchants.filter(m => m.status === '已完成');
      }
      
      const stats = {
        total: merchants.length,
        completed: merchants.filter(m => m.status === '已完成').length,
        auditing: merchants.filter(m => m.status === '审核中').length,
        rejected: merchants.filter(m => m.status === '已驳回').length
      };

      res.json({
        success: true,
        data: {
          merchants: merchants.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
          total: merchants.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        message: '获取微信商户列表成功'
      });
    } catch (error) {
      console.error('获取微信商户列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误: ' + error.message
      });
    }
  },

  // 获取商户统计
  'GET /api/v1/admin/wechat-merchants/stats': (req, res) => {
    try {
      const stats = {
        total: mockWechatMerchants.length,
        completed: mockWechatMerchants.filter(m => m.status === '已完成').length,
        auditing: mockWechatMerchants.filter(m => m.status === '审核中').length,
        rejected: mockWechatMerchants.filter(m => m.status === '已驳回').length,
        others: mockWechatMerchants.filter(m => !['已完成', '审核中', '已驳回'].includes(m.status)).length,
        recentlyCreated: mockWechatMerchants.filter(m => {
          const createdDate = new Date(m.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdDate > sevenDaysAgo;
        }).length
      };

      res.json({
        success: true,
        data: stats,
        message: '获取商户统计成功'
      });
    } catch (error) {
      console.error('获取商户统计错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误: ' + error.message
      });
    }
  },

  // 同步微信商户
  'POST /api/v1/admin/wechat-merchants/sync': (req, res) => {
    try {
      // 模拟同步过程
      setTimeout(() => {
        res.json({
          success: true,
          data: {
            syncedCount: mockWechatMerchants.length
          },
          message: `成功同步 ${mockWechatMerchants.length} 个商户`
        });
      }, 1000);
    } catch (error) {
      console.error('同步商户错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误: ' + error.message
      });
    }
  },

  // 获取单个商户详情
  'GET /api/v1/admin/wechat-merchants/:merchantId': (req, res) => {
    try {
      const { merchantId } = req.params;
      const merchant = mockWechatMerchants.find(m => m.merchantId === merchantId);
      
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: '商户不存在'
        });
      }

      res.json({
        success: true,
        data: merchant,
        message: '获取商户详情成功'
      });
    } catch (error) {
      console.error('获取商户详情错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误: ' + error.message
      });
    }
  }
};

module.exports = { wechatMerchantRoutes, mockWechatMerchants };
