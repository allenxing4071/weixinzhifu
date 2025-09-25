/**
 * 商户CRUD API演示 - 不依赖数据库
 * 使用模拟数据验证API接口设计
 */

const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3002

// 中间件
app.use(cors())
app.use(express.json())

// 模拟商户数据
let merchants = [
  {
    id: 'merchant_1735113600_abc123',
    merchantName: '仁寿县怀仁街道云锦汇会所（个体工商户）',
    merchantNo: 'M35113600',
    contactPerson: '刘阳',
    contactPhone: '13800138001',
    businessLicense: '91512345MA6CXXX001',
    status: 'active',
    qrCode: null,
    subMchId: '1728001633',
    totalAmount: 0,
    totalOrders: 0,
    applymentId: '2000002691156098',
    merchantType: 'INDIVIDUAL',
    contactEmail: 'liuyang@example.com',
    legalPerson: null,
    businessCategory: '休闲娱乐',
    createdAt: new Date('2024-10-01T08:00:00.000Z'),
    updatedAt: new Date('2024-10-05T10:00:00.000Z')
  },
  {
    id: 'merchant_1735113700_def456',
    merchantName: '成都市中鑫博海国际酒业贸易有限公司',
    merchantNo: 'M35113700',
    contactPerson: '邢海龙',
    contactPhone: '13800138004',
    businessLicense: '91512345MA6CXXX004',
    status: 'active',
    qrCode: null,
    subMchId: '1727774152',
    totalAmount: 15800.50,
    totalOrders: 12,
    applymentId: '2000002690164951',
    merchantType: 'ENTERPRISE',
    contactEmail: 'xinghailong@zhongxinbohai.com',
    legalPerson: '邢海龙',
    businessCategory: '酒类贸易',
    createdAt: new Date('2024-10-04T08:00:00.000Z'),
    updatedAt: new Date('2024-10-08T10:00:00.000Z')
  },
  {
    id: 'merchant_1735113800_ghi789',
    merchantName: '德阳市叁思科技有限公司',
    merchantNo: 'M35113800',
    contactPerson: '赵其军',
    contactPhone: '13800138005',
    businessLicense: '91512345MA6CXXX005',
    status: 'pending',
    qrCode: null,
    subMchId: '1727565030',
    totalAmount: 0,
    totalOrders: 0,
    applymentId: '2000002689372247',
    merchantType: 'ENTERPRISE',
    contactEmail: 'zhaoqijun@sansitech.com',
    legalPerson: '赵其军',
    businessCategory: '软件开发',
    createdAt: new Date('2024-10-05T08:00:00.000Z'),
    updatedAt: new Date('2024-10-09T10:00:00.000Z')
  }
]

// 工具函数
function generateId() {
  return `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateMerchantNo() {
  return `M${Date.now().toString().slice(-8)}`
}

function filterMerchants(merchants, filters) {
  return merchants.filter(merchant => {
    if (filters.status && merchant.status !== filters.status) return false
    if (filters.merchantType && merchant.merchantType !== filters.merchantType) return false
    if (filters.hasSubMchId !== undefined) {
      const hasSubMchId = !!(merchant.subMchId && merchant.subMchId.trim())
      if (filters.hasSubMchId !== hasSubMchId) return false
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const searchFields = [
        merchant.merchantName,
        merchant.contactPerson,
        merchant.contactPhone
      ].filter(Boolean).join(' ').toLowerCase()
      if (!searchFields.includes(keyword)) return false
    }
    return true
  })
}

function checkQRCodeEligibility(merchant) {
  const missingFields = []
  
  if (!merchant.merchantName) missingFields.push('商户名称')
  if (!merchant.contactPerson) missingFields.push('联系人姓名')
  if (!merchant.contactPhone) missingFields.push('联系电话')
  if (!merchant.businessLicense) missingFields.push('营业执照号')
  if (!merchant.subMchId) missingFields.push('微信特约商户号')
  
  if (merchant.status !== 'active') {
    return {
      eligible: false,
      message: `商户状态为${merchant.status}，无法生成二维码`,
      missingFields
    }
  }
  
  if (missingFields.length > 0) {
    return {
      eligible: false,
      message: `缺少必要信息：${missingFields.join('、')}`,
      missingFields
    }
  }
  
  return {
    eligible: true,
    message: '商户信息完整，可以生成收款二维码'
  }
}

// API路由

/**
 * 获取商户统计
 * GET /api/v1/admin/merchants/stats
 */
app.get('/api/v1/admin/merchants/stats', (req, res) => {
  const stats = {
    total: merchants.length,
    active: merchants.filter(m => m.status === 'active').length,
    pending: merchants.filter(m => m.status === 'pending').length,
    inactive: merchants.filter(m => m.status === 'inactive').length,
    hasSubMchId: merchants.filter(m => m.subMchId && m.subMchId.trim()).length,
    canGenerateQRCode: merchants.filter(m => checkQRCodeEligibility(m).eligible).length
  }

  res.json({
    success: true,
    data: stats,
    message: '获取商户统计成功'
  })
})

/**
 * 获取商户列表
 * GET /api/v1/admin/merchants
 */
app.get('/api/v1/admin/merchants', (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    status,
    keyword,
    merchantType,
    hasSubMchId
  } = req.query

  console.log('📋 商户列表查询参数:', {
    page: Number(page),
    pageSize: Number(pageSize),
    status,
    keyword,
    merchantType,
    hasSubMchId: hasSubMchId === 'true' ? true : hasSubMchId === 'false' ? false : undefined
  })

  const filters = {
    status,
    keyword,
    merchantType,
    hasSubMchId: hasSubMchId === 'true' ? true : hasSubMchId === 'false' ? false : undefined
  }

  const filteredMerchants = filterMerchants(merchants, filters)
  const total = filteredMerchants.length
  const startIndex = (Number(page) - 1) * Number(pageSize)
  const endIndex = startIndex + Number(pageSize)
  const paginatedMerchants = filteredMerchants.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      merchants: paginatedMerchants,
      pagination: {
        current: Number(page),
        pageSize: Number(pageSize),
        total: total,
        totalPages: Math.ceil(total / Number(pageSize))
      }
    },
    message: `成功获取${paginatedMerchants.length}个商户信息`
  })

  console.log(`✅ 返回${paginatedMerchants.length}个商户，共${total}个`)
})

/**
 * 获取商户详情
 * GET /api/v1/admin/merchants/:id
 */
app.get('/api/v1/admin/merchants/:id', (req, res) => {
  const { id } = req.params
  const merchant = merchants.find(m => m.id === id)

  if (!merchant) {
    return res.status(404).json({
      success: false,
      message: '商户不存在',
      error_type: 'not_found'
    })
  }

  const qrCodeEligibility = checkQRCodeEligibility(merchant)

  res.json({
    success: true,
    data: {
      merchant,
      qrCodeEligibility
    },
    message: '获取商户详情成功'
  })

  console.log(`✅ 获取商户详情: ${merchant.merchantName}`)
})

/**
 * 创建商户
 * POST /api/v1/admin/merchants
 */
app.post('/api/v1/admin/merchants', (req, res) => {
  const merchantData = req.body

  console.log('🆕 创建新商户:', {
    merchantName: merchantData.merchantName,
    merchantType: merchantData.merchantType,
    contactPerson: merchantData.contactPerson
  })

  // 检查重复申请单号
  if (merchantData.applymentId) {
    const existing = merchants.find(m => m.applymentId === merchantData.applymentId)
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '该微信申请单号已存在',
        error_type: 'duplicate_applyment_id'
      })
    }
  }

  const newMerchant = {
    id: generateId(),
    merchantNo: generateMerchantNo(),
    merchantName: merchantData.merchantName,
    contactPerson: merchantData.contactPerson,
    contactPhone: merchantData.contactPhone,
    businessLicense: merchantData.businessLicense,
    contactEmail: merchantData.contactEmail || null,
    merchantType: merchantData.merchantType || 'INDIVIDUAL',
    legalPerson: merchantData.legalPerson || null,
    businessCategory: merchantData.businessCategory || null,
    applymentId: merchantData.applymentId || null,
    subMchId: merchantData.subMchId || null,
    status: 'pending',
    qrCode: null,
    totalAmount: 0,
    totalOrders: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  merchants.push(newMerchant)

  res.status(201).json({
    success: true,
    data: { merchant: newMerchant },
    message: `商户 ${newMerchant.merchantName} 创建成功`
  })

  console.log(`✅ 商户创建成功: ${newMerchant.merchantName} (${newMerchant.id})`)
})

/**
 * 更新商户
 * PUT /api/v1/admin/merchants/:id
 */
app.put('/api/v1/admin/merchants/:id', (req, res) => {
  const { id } = req.params
  const updateData = req.body

  const merchantIndex = merchants.findIndex(m => m.id === id)
  if (merchantIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '商户不存在',
      error_type: 'not_found'
    })
  }

  const merchant = merchants[merchantIndex]

  console.log('📝 更新商户信息:', {
    merchantId: id,
    merchantName: merchant.merchantName,
    updateFields: Object.keys(updateData)
  })

  // 检查申请单号重复
  if (updateData.applymentId && updateData.applymentId !== merchant.applymentId) {
    const duplicate = merchants.find(m => m.applymentId === updateData.applymentId && m.id !== id)
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: '该微信申请单号已被其他商户使用',
        error_type: 'duplicate_applyment_id'
      })
    }
  }

  // 更新字段
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      merchant[key] = updateData[key]
    }
  })
  merchant.updatedAt = new Date()

  merchants[merchantIndex] = merchant

  res.json({
    success: true,
    data: { merchant },
    message: '商户信息更新成功'
  })

  console.log(`✅ 商户更新成功: ${merchant.merchantName}`)
})

/**
 * 删除商户
 * DELETE /api/v1/admin/merchants/:id
 */
app.delete('/api/v1/admin/merchants/:id', (req, res) => {
  const { id } = req.params

  const merchantIndex = merchants.findIndex(m => m.id === id)
  if (merchantIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '商户不存在',
      error_type: 'not_found'
    })
  }

  const merchant = merchants[merchantIndex]
  console.log('🗑️ 删除商户:', {
    merchantId: id,
    merchantName: merchant.merchantName
  })

  // 软删除
  merchant.status = 'inactive'
  merchant.updatedAt = new Date()

  merchants[merchantIndex] = merchant

  res.json({
    success: true,
    message: `商户 ${merchant.merchantName} 已停用`
  })

  console.log(`✅ 商户已停用: ${merchant.merchantName}`)
})

/**
 * 检查二维码资格
 * GET /api/v1/admin/merchants/:id/qr-eligibility
 */
app.get('/api/v1/admin/merchants/:id/qr-eligibility', (req, res) => {
  const { id } = req.params
  const merchant = merchants.find(m => m.id === id)

  if (!merchant) {
    return res.status(404).json({
      success: false,
      message: '商户不存在',
      error_type: 'not_found'
    })
  }

  const eligibility = checkQRCodeEligibility(merchant)

  res.json({
    success: true,
    data: eligibility,
    message: eligibility.eligible ? '商户符合二维码生成条件' : '商户不符合二维码生成条件'
  })
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API演示服务运行正常',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/v1/admin/merchants/stats',
      'GET /api/v1/admin/merchants',
      'GET /api/v1/admin/merchants/:id',
      'POST /api/v1/admin/merchants',
      'PUT /api/v1/admin/merchants/:id',
      'DELETE /api/v1/admin/merchants/:id',
      'GET /api/v1/admin/merchants/:id/qr-eligibility'
    ]
  })
})

// 启动服务
app.listen(PORT, () => {
  console.log('🚀 商户CRUD API演示服务启动成功!')
  console.log(`📡 服务地址: http://localhost:${PORT}`)
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`)
  console.log(`📊 商户统计: http://localhost:${PORT}/api/v1/admin/merchants/stats`)
  console.log(`📋 商户列表: http://localhost:${PORT}/api/v1/admin/merchants`)
  console.log('')
  console.log('✅ 可以开始测试商户CRUD功能了!')
  console.log('💡 使用 test-merchant-crud.js 进行完整功能测试')
})
