// 超级简化的JavaScript版本API服务器 - 专门测试订单管理
const express = require('express')
const cors = require('cors')

const app = express()

// 基础中间件 - 配置CORS以支持前端访问
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}))
app.use(express.json())

// 额外的CORS预检处理
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.sendStatus(200)
})

// 简单的认证中间件
const simpleAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token === 'test-token' || req.path.includes('health')) {
    next()
  } else {
    res.status(401).json({ success: false, message: '需要认证' })
  }
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '订单管理API服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// 模拟管理员登录API
app.post('/api/v1/admin/auth/login', (req, res) => {
  const { username, password } = req.body
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        token: 'test-token',
        user: {
          id: 'admin-1',
          username: 'admin',
          realName: '系统管理员'
        }
      }
    })
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    })
  }
})

// 应用认证中间件到管理员API
app.use('/api/v1/admin', simpleAuth)

// 仪表板统计API
app.get('/api/v1/admin/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        totalUsers: 156,
        activeUsers: 89,
        totalMerchants: 23,
        todayOrders: 15
      }
    }
  })
})

// 用户管理API
app.get('/api/v1/admin/users', (req, res) => {
  const mockUsers = [
    {
      id: 'user-001',
      nickname: '测试用户1',
      points_balance: 150,
      status: 'active',
      wechatId: 'wx_test_001',
      phone: '138****1234',
      createdAt: '2024-12-20T10:00:00Z'
    },
    {
      id: 'user-002', 
      nickname: '测试用户2',
      points_balance: 89,
      status: 'active',
      wechatId: 'wx_test_002',
      phone: '139****5678',
      createdAt: '2024-12-21T11:00:00Z'
    },
    {
      id: 'user-003',
      nickname: '测试用户3',
      points_balance: 0,
      status: 'inactive',
      wechatId: 'wx_test_003',
      phone: '136****9012',
      createdAt: '2024-12-22T12:00:00Z'
    }
  ]
  
  res.json({
    success: true,
    data: { users: mockUsers }
  })
})

// 积分管理API
app.get('/api/v1/admin/points', (req, res) => {
  const mockPoints = [
    {
      id: 'points-001',
      user_id: 'user-001',
      points_change: 10,
      balance_after: 150,
      description: '支付奖励',
      created_at: '2024-12-27T10:00:00Z'
    },
    {
      id: 'points-002',
      user_id: 'user-002',
      points_change: 5,
      balance_after: 89,
      description: '签到奖励',
      created_at: '2024-12-27T11:00:00Z'
    }
  ]
  
  res.json({
    success: true,
    data: { records: mockPoints }
  })
})

// 商户管理API - 使用真实数据
const mockMerchants = [
  {
    id: 'merchant-001',
    merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
    merchantNo: '1728001633',
    contactPerson: '刘阳',
    contactPhone: '138****1234',
    businessLicense: '91511421MA68XXX123',
    contactEmail: 'liuyang@yunxin.com',
    merchantType: 'INDIVIDUAL',
    legalPerson: '刘阳',
    businessCategory: '休闲娱乐',
    applymentId: '2000002691156098',
    subMchId: '1728001633',
    status: 'active', // 已完成
    totalAmount: 85000,
    totalOrders: 42,
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-27T10:00:00Z'
  },
  {
    id: 'merchant-002',
    merchantName: '仁寿县怀仁街道储府鱼庄店（个体工商户）',
    merchantNo: '1727952181',
    contactPerson: '刘阳',
    contactPhone: '138****5678',
    businessLicense: '91511421MA68XXX456',
    contactEmail: 'liuyang@chufu.com',
    merchantType: 'INDIVIDUAL',
    legalPerson: '刘阳',
    businessCategory: '餐饮',
    applymentId: '2000002690858917',
    subMchId: '1727952181',
    status: 'active', // 已完成
    totalAmount: 126000,
    totalOrders: 68,
    createdAt: '2024-12-14T11:00:00Z',
    updatedAt: '2024-12-27T11:00:00Z'
  },
  {
    id: 'merchant-003',
    merchantName: '仁寿县怀仁街道颐善滋养园养生馆（个体工商户）',
    merchantNo: '1727857063',
    contactPerson: '刘阳',
    contactPhone: '138****9012',
    businessLicense: '91511421MA68XXX789',
    contactEmail: 'liuyang@yishan.com',
    merchantType: 'INDIVIDUAL',
    legalPerson: '刘阳',
    businessCategory: '生活服务',
    applymentId: '2000002690623402',
    subMchId: '1727857063',
    status: 'active', // 已完成
    totalAmount: 58000,
    totalOrders: 29,
    createdAt: '2024-12-13T12:00:00Z',
    updatedAt: '2024-12-27T12:00:00Z'
  },
  {
    id: 'merchant-004',
    merchantName: '成都市中鑫博海国际酒业贸易有限公司',
    merchantNo: '1727774152',
    contactPerson: '邢海龙',
    contactPhone: '139****3456',
    businessLicense: '91510100MA68XXX012',
    contactEmail: 'xinghl@zhongxin.com',
    merchantType: 'ENTERPRISE',
    legalPerson: '邢海龙',
    businessCategory: '酒类贸易',
    applymentId: '2000002690164951',
    subMchId: '1727774152',
    status: 'active', // 已完成
    totalAmount: 285000,
    totalOrders: 156,
    createdAt: '2024-12-12T13:00:00Z',
    updatedAt: '2024-12-27T13:00:00Z'
  },
  {
    id: 'merchant-005',
    merchantName: '德阳市叁思科技有限公司',
    merchantNo: '1727565030',
    contactPerson: '赵其军',
    contactPhone: '137****7890',
    businessLicense: '91510600MA68XXX345',
    contactEmail: 'zhaoqj@sansi.com',
    merchantType: 'ENTERPRISE',
    legalPerson: '赵其军',
    businessCategory: '数字娱乐',
    applymentId: '2000002689372247',
    subMchId: '1727565030',
    status: 'active', // 已完成
    totalAmount: 198000,
    totalOrders: 89,
    createdAt: '2024-12-11T14:00:00Z',
    updatedAt: '2024-12-27T14:00:00Z'
  }
]

app.get('/api/v1/admin/merchants', (req, res) => {
  res.json({
    success: true,
    data: { merchants: mockMerchants },
    dataSource: 'mock'
  })
})

app.get('/api/v1/admin/merchants/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total: mockMerchants.length,
      completed: mockMerchants.filter(m => m.status === 'active').length, // 已完成 = 5
      auditing: mockMerchants.filter(m => m.status === 'pending').length, // 审核中 = 0
      rejected: mockMerchants.filter(m => m.status === 'rejected').length // 已驳回 = 0
    }
  })
})

app.get('/api/v1/admin/merchants/:id', (req, res) => {
  const { id } = req.params
  const merchant = mockMerchants.find(m => m.id === id)
  
  if (!merchant) {
    return res.status(404).json({
      success: false,
      message: '商户不存在'
    })
  }
  
  res.json({
    success: true,
    data: { merchant }
  })
})

app.post('/api/v1/admin/merchants', (req, res) => {
  const newMerchant = {
    id: `merchant-${Date.now()}`,
    merchantNo: `MCH${Date.now()}`,
    ...req.body,
    status: 'pending',
    totalAmount: 0,
    totalOrders: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  mockMerchants.push(newMerchant)
  
  res.json({
    success: true,
    data: { merchant: newMerchant },
    message: '商户创建成功'
  })
})

app.put('/api/v1/admin/merchants/:id', (req, res) => {
  const { id } = req.params
  const merchantIndex = mockMerchants.findIndex(m => m.id === id)
  
  if (merchantIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '商户不存在'
    })
  }
  
  mockMerchants[merchantIndex] = {
    ...mockMerchants[merchantIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  }
  
  res.json({
    success: true,
    data: { merchant: mockMerchants[merchantIndex] },
    message: '商户更新成功'
  })
})

app.delete('/api/v1/admin/merchants/:id', (req, res) => {
  const { id } = req.params
  const merchantIndex = mockMerchants.findIndex(m => m.id === id)
  
  if (merchantIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '商户不存在'
    })
  }
  
  mockMerchants.splice(merchantIndex, 1)
  
  res.json({
    success: true,
    message: '商户删除成功'
  })
})

app.post('/api/v1/admin/merchants/:id/qrcode', (req, res) => {
  const { id } = req.params
  const merchant = mockMerchants.find(m => m.id === id)
  
  if (!merchant) {
    return res.status(404).json({
      success: false,
      message: '商户不存在'
    })
  }
  
  // 模拟二维码生成
  res.json({
    success: true,
    data: {
      qrCodeImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      qrCodeData: `/pages/payment/index?merchantId=${id}`,
      qrType: 'miniprogram',
      merchantId: id,
      merchantName: merchant.merchantName
    }
  })
})

// 模拟订单数据
const mockOrders = [
  {
    id: 'order-001',
    orderNo: 'PAY202412270001',
    amount: 5000, // 50元
    pointsAwarded: 5,
    status: 'paid',
    paymentMethod: 'wechat',
    transactionId: 'wx001234567890',
    description: '测试支付订单',
    createdAt: '2024-12-27T10:00:00Z',
    paidAt: '2024-12-27T10:01:00Z',
    user: {
      id: 'user-001',
      nickname: '测试用户1',
      wechatId: 'wx_test_001'
    },
    merchant: {
      id: 'merchant-001',
      merchantName: '测试商户A',
      contactPerson: '张三'
    }
  },
  {
    id: 'order-002',
    orderNo: 'PAY202412270002',
    amount: 10000, // 100元
    pointsAwarded: 10,
    status: 'paid',
    paymentMethod: 'wechat',
    transactionId: 'wx001234567891',
    description: '测试支付订单2',
    createdAt: '2024-12-27T11:00:00Z',
    paidAt: '2024-12-27T11:01:00Z',
    user: {
      id: 'user-002',
      nickname: '测试用户2',
      wechatId: 'wx_test_002'
    },
    merchant: {
      id: 'merchant-002',
      merchantName: '测试商户B',
      contactPerson: '李四'
    }
  },
  {
    id: 'order-003',
    orderNo: 'PAY202412270003',
    amount: 2000, // 20元
    pointsAwarded: 2,
    status: 'pending',
    paymentMethod: 'wechat',
    description: '待支付订单',
    createdAt: '2024-12-27T12:00:00Z',
    user: {
      id: 'user-003',
      nickname: '测试用户3',
      wechatId: 'wx_test_003'
    },
    merchant: {
      id: 'merchant-003',
      merchantName: '测试商户C',
      contactPerson: '王五'
    }
  }
]

// 订单管理API
app.get('/api/v1/admin/orders', (req, res) => {
  const { page = 1, pageSize = 20, status, search } = req.query
  
  let filteredOrders = mockOrders
  
  // 状态筛选
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status)
  }
  
  // 搜索筛选
  if (search) {
    filteredOrders = filteredOrders.filter(order => 
      order.orderNo.includes(search) ||
      order.merchant.merchantName.includes(search) ||
      order.user.nickname.includes(search)
    )
  }
  
  const total = filteredOrders.length
  const start = (page - 1) * pageSize
  const orders = filteredOrders.slice(start, start + parseInt(pageSize))
  
  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })
})

// 订单统计API
app.get('/api/v1/admin/orders/stats', (req, res) => {
  const totalOrders = mockOrders.length
  const paidOrders = mockOrders.filter(o => o.status === 'paid').length
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length
  const totalAmount = mockOrders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + o.amount, 0)
  
  res.json({
    success: true,
    data: {
      overview: {
        totalOrders,
        paidOrders,
        pendingOrders,
        cancelledOrders: 0,
        totalAmount,
        successRate: totalOrders > 0 ? (paidOrders / totalOrders * 100) : 0
      },
      today: {
        orders: totalOrders,
        paidOrders,
        amount: totalAmount,
        successRate: totalOrders > 0 ? (paidOrders / totalOrders * 100) : 0
      },
      month: {
        orders: totalOrders,
        amount: totalAmount
      }
    }
  })
})

// 订单详情API
app.get('/api/v1/admin/orders/:id', (req, res) => {
  const { id } = req.params
  const order = mockOrders.find(o => o.id === id)
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    })
  }
  
  // 添加积分记录
  const orderDetail = {
    ...order,
    pointsRecords: [{
      id: 'points-001',
      pointsChange: order.pointsAwarded,
      pointsBalance: order.pointsAwarded,
      source: 'payment_reward',
      description: '支付奖励积分',
      createdAt: order.paidAt || order.createdAt,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }]
  }
  
  res.json({
    success: true,
    data: { order: orderDetail }
  })
})

// 更新订单状态API
app.put('/api/v1/admin/orders/:id', (req, res) => {
  const { id } = req.params
  const { status, reason } = req.body
  
  const orderIndex = mockOrders.findIndex(o => o.id === id)
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '订单不存在'
    })
  }
  
  mockOrders[orderIndex].status = status
  if (reason) {
    mockOrders[orderIndex].description += ` [${reason}]`
  }
  
  res.json({
    success: true,
    message: '订单状态更新成功',
    data: { order: mockOrders[orderIndex] }
  })
})

// 导出订单API
app.post('/api/v1/admin/orders/export', (req, res) => {
  const exportData = mockOrders.map(order => ({
    订单号: order.orderNo,
    商户名称: order.merchant.merchantName,
    用户昵称: order.user.nickname,
    支付金额: (order.amount / 100).toFixed(2),
    奖励积分: order.pointsAwarded,
    订单状态: order.status,
    支付方式: order.paymentMethod,
    微信交易号: order.transactionId || '',
    创建时间: new Date(order.createdAt).toLocaleString('zh-CN'),
    支付时间: order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '',
    订单描述: order.description || ''
  }))
  
  res.json({
    success: true,
    data: {
      orders: exportData,
      exportTime: new Date().toISOString(),
      total: exportData.length
    }
  })
})

// 启动服务器
const PORT = 3003
app.listen(PORT, () => {
  console.log('🚀 订单管理API服务启动成功')
  console.log(`📍 端口: ${PORT}`)
  console.log(`❤️ 健康检查: http://localhost:${PORT}/health`)
  console.log(`📚 订单API: http://localhost:${PORT}/api/v1/admin/orders`)
  console.log(`🔑 测试认证: 用户名=admin, 密码=admin123`)
  console.log(`🎯 测试token: test-token`)
})