/**
 * 专注于商户功能的简化后端服务
 * 基于我们开发的CRUD功能，使用MySQL数据库
 */

const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')

const app = express()
const PORT = 3003

// 中间件
app.use(cors())
app.use(express.json())

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'points_app_dev',
  connectionLimit: 10,
  charset: 'utf8mb4'
}

let pool = null

// 初始化数据库连接池
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig)
    console.log('✅ 数据库连接池创建成功')
    
    // 测试连接
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ 数据库连接测试成功')
    
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    console.log('💡 将使用模拟数据模式')
    return false
  }
}

// 模拟数据
let mockMerchants = [
  {
    id: 'merchant_1735113600_abc123',
    merchant_name: '仁寿县怀仁街道云锦汇会所（个体工商户）',
    merchant_no: 'M35113600',
    contact_person: '刘阳',
    contact_phone: '13800138001',
    business_license: '91512345MA6CXXX001',
    status: 'active',
    qr_code: null,
    sub_mch_id: '1728001633',
    total_amount: 0,
    total_orders: 0,
    applyment_id: '2000002691156098',
    merchant_type: 'INDIVIDUAL',
    contact_email: 'liuyang@example.com',
    legal_person: null,
    business_category: '休闲娱乐',
    created_at: new Date('2024-10-01T08:00:00.000Z'),
    updated_at: new Date('2024-10-05T10:00:00.000Z')
  },
  {
    id: 'merchant_1735113700_def456',
    merchant_name: '成都市中鑫博海国际酒业贸易有限公司',
    merchant_no: 'M35113700',
    contact_person: '邢海龙',
    contact_phone: '13800138004',
    business_license: '91512345MA6CXXX004',
    status: 'active',
    qr_code: null,
    sub_mch_id: '1727774152',
    total_amount: 15800.50,
    total_orders: 12,
    applyment_id: '2000002690164951',
    merchant_type: 'ENTERPRISE',
    contact_email: 'xinghailong@zhongxinbohai.com',
    legal_person: '邢海龙',
    business_category: '酒类贸易',
    created_at: new Date('2024-10-04T08:00:00.000Z'),
    updated_at: new Date('2024-10-08T10:00:00.000Z')
  }
]

let isUsingDatabase = false

// 数据库操作函数
async function executeSql(sql, params = []) {
  if (!isUsingDatabase) {
    throw new Error('数据库未连接，使用模拟数据')
  }
  
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(sql, params)
    return rows
  } finally {
    connection.release()
  }
}

// 商户模型函数
const MerchantModel = {
  // 创建商户
  async create(merchantData) {
    const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const merchantNo = `M${Date.now().toString().slice(-8)}`
    
    const newMerchant = {
      id: merchantId,
      merchant_no: merchantNo,
      merchant_name: merchantData.merchantName,
      contact_person: merchantData.contactPerson,
      contact_phone: merchantData.contactPhone,
      business_license: merchantData.businessLicense,
      contact_email: merchantData.contactEmail || null,
      merchant_type: merchantData.merchantType || 'INDIVIDUAL',
      legal_person: merchantData.legalPerson || null,
      business_category: merchantData.businessCategory || null,
      applyment_id: merchantData.applymentId || null,
      sub_mch_id: merchantData.subMchId || null,
      status: 'pending',
      qr_code: null,
      total_amount: 0,
      total_orders: 0,
      created_at: new Date(),
      updated_at: new Date()
    }

    if (isUsingDatabase) {
      try {
        await executeSql(`
          INSERT INTO merchants 
          (id, merchant_name, merchant_no, contact_person, contact_phone, business_license,
           contact_email, merchant_type, legal_person, business_category, applyment_id, sub_mch_id,
           status, total_amount, total_orders, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          newMerchant.id,
          newMerchant.merchant_name,
          newMerchant.merchant_no,
          newMerchant.contact_person,
          newMerchant.contact_phone,
          newMerchant.business_license,
          newMerchant.contact_email,
          newMerchant.merchant_type,
          newMerchant.legal_person,
          newMerchant.business_category,
          newMerchant.applyment_id,
          newMerchant.sub_mch_id,
          newMerchant.status,
          newMerchant.total_amount,
          newMerchant.total_orders
        ])
        return await this.findById(merchantId)
      } catch (error) {
        console.error('数据库创建商户失败，使用模拟数据:', error.message)
        isUsingDatabase = false
      }
    }
    
    // 模拟数据模式
    mockMerchants.push(newMerchant)
    return newMerchant
  },

  // 根据ID查找商户
  async findById(id) {
    if (isUsingDatabase) {
      try {
        const rows = await executeSql('SELECT * FROM merchants WHERE id = ?', [id])
        return rows.length > 0 ? this.formatMerchant(rows[0]) : null
      } catch (error) {
        console.error('数据库查询失败，使用模拟数据:', error.message)
        isUsingDatabase = false
      }
    }
    
    // 模拟数据模式
    const merchant = mockMerchants.find(m => m.id === id)
    return merchant ? this.formatMerchant(merchant) : null
  },

  // 查询商户列表
  async findAll(params = {}) {
    const {
      page = 1,
      pageSize = 20,
      status,
      keyword,
      merchantType,
      hasSubMchId
    } = params

    if (isUsingDatabase) {
      try {
        // 构建WHERE条件
        const conditions = []
        const values = []
        
        if (status) {
          conditions.push('status = ?')
          values.push(status)
        }
        
        if (keyword) {
          conditions.push('(merchant_name LIKE ? OR contact_person LIKE ? OR contact_phone LIKE ?)')
          const likeKeyword = `%${keyword}%`
          values.push(likeKeyword, likeKeyword, likeKeyword)
        }
        
        if (merchantType) {
          conditions.push('merchant_type = ?')
          values.push(merchantType)
        }
        
        if (hasSubMchId !== undefined) {
          if (hasSubMchId) {
            conditions.push('sub_mch_id IS NOT NULL AND sub_mch_id != ""')
          } else {
            conditions.push('(sub_mch_id IS NULL OR sub_mch_id = "")')
          }
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
        const offset = (page - 1) * pageSize
        
        // 查询列表
        const merchants = await executeSql(
          `SELECT * FROM merchants ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...values, pageSize, offset]
        )
        
        // 查询总数
        const countResult = await executeSql(
          `SELECT COUNT(*) as total FROM merchants ${whereClause}`,
          values
        )
        
        return {
          merchants: merchants.map(m => this.formatMerchant(m)),
          total: countResult[0].total
        }
      } catch (error) {
        console.error('数据库查询失败，使用模拟数据:', error.message)
        isUsingDatabase = false
      }
    }
    
    // 模拟数据模式
    let filteredMerchants = [...mockMerchants]
    
    // 应用筛选
    if (status) {
      filteredMerchants = filteredMerchants.filter(m => m.status === status)
    }
    if (keyword) {
      const kw = keyword.toLowerCase()
      filteredMerchants = filteredMerchants.filter(m => 
        m.merchant_name.toLowerCase().includes(kw) ||
        m.contact_person.toLowerCase().includes(kw) ||
        m.contact_phone.includes(kw)
      )
    }
    if (merchantType) {
      filteredMerchants = filteredMerchants.filter(m => m.merchant_type === merchantType)
    }
    if (hasSubMchId !== undefined) {
      filteredMerchants = filteredMerchants.filter(m => {
        const hasId = !!(m.sub_mch_id && m.sub_mch_id.trim())
        return hasSubMchId === hasId
      })
    }
    
    const total = filteredMerchants.length
    const startIndex = (page - 1) * pageSize
    const paginatedMerchants = filteredMerchants.slice(startIndex, startIndex + pageSize)
    
    return {
      merchants: paginatedMerchants.map(m => this.formatMerchant(m)),
      total
    }
  },

  // 更新商户
  async update(id, updateData) {
    if (isUsingDatabase) {
      try {
        const updateFields = []
        const updateValues = []
        
        const fieldMap = {
          merchantName: 'merchant_name',
          contactPerson: 'contact_person',
          contactPhone: 'contact_phone',
          contactEmail: 'contact_email',
          businessLicense: 'business_license',
          merchantType: 'merchant_type',
          legalPerson: 'legal_person',
          businessCategory: 'business_category',
          applymentId: 'applyment_id',
          subMchId: 'sub_mch_id',
          status: 'status'
        }
        
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && fieldMap[key]) {
            updateFields.push(`${fieldMap[key]} = ?`)
            updateValues.push(value)
          }
        })
        
        if (updateFields.length === 0) return false
        
        updateFields.push('updated_at = NOW()')
        updateValues.push(id)
        
        const result = await executeSql(
          `UPDATE merchants SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        )
        
        return result.affectedRows > 0
      } catch (error) {
        console.error('数据库更新失败，使用模拟数据:', error.message)
        isUsingDatabase = false
      }
    }
    
    // 模拟数据模式
    const merchantIndex = mockMerchants.findIndex(m => m.id === id)
    if (merchantIndex === -1) return false
    
    const merchant = mockMerchants[merchantIndex]
    const fieldMap = {
      merchantName: 'merchant_name',
      contactPerson: 'contact_person',
      contactPhone: 'contact_phone',
      contactEmail: 'contact_email',
      businessLicense: 'business_license',
      merchantType: 'merchant_type',
      legalPerson: 'legal_person',
      businessCategory: 'business_category',
      applymentId: 'applyment_id',
      subMchId: 'sub_mch_id',
      status: 'status'
    }
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && fieldMap[key]) {
        merchant[fieldMap[key]] = value
      }
    })
    merchant.updated_at = new Date()
    
    mockMerchants[merchantIndex] = merchant
    return true
  },

  // 软删除商户
  async delete(id) {
    return await this.update(id, { status: 'inactive' })
  },

  // 根据申请单号查找
  async findByApplymentId(applymentId) {
    if (isUsingDatabase) {
      try {
        const rows = await executeSql('SELECT * FROM merchants WHERE applyment_id = ?', [applymentId])
        return rows.length > 0 ? this.formatMerchant(rows[0]) : null
      } catch (error) {
        console.error('数据库查询失败，使用模拟数据:', error.message)
        isUsingDatabase = false
      }
    }
    
    const merchant = mockMerchants.find(m => m.applyment_id === applymentId)
    return merchant ? this.formatMerchant(merchant) : null
  },

  // 格式化商户数据
  formatMerchant(dbMerchant) {
    return {
      id: dbMerchant.id,
      merchantName: dbMerchant.merchant_name,
      merchantNo: dbMerchant.merchant_no,
      contactPerson: dbMerchant.contact_person,
      contactPhone: dbMerchant.contact_phone,
      businessLicense: dbMerchant.business_license,
      status: dbMerchant.status,
      qrCode: dbMerchant.qr_code,
      subMchId: dbMerchant.sub_mch_id,
      totalAmount: parseFloat(dbMerchant.total_amount) || 0,
      totalOrders: parseInt(dbMerchant.total_orders) || 0,
      applymentId: dbMerchant.applyment_id,
      merchantType: dbMerchant.merchant_type,
      contactEmail: dbMerchant.contact_email,
      legalPerson: dbMerchant.legal_person,
      businessCategory: dbMerchant.business_category,
      createdAt: dbMerchant.created_at,
      updatedAt: dbMerchant.updated_at
    }
  },

  // 检查二维码生成资格
  checkQRCodeEligibility(merchant) {
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
}

// API路由实现 - 与我们之前开发的TypeScript版本完全一致

/**
 * 获取商户统计
 */
app.get('/api/v1/admin/merchants/stats', async (req, res) => {
  try {
    const [active, pending, inactive, hasSubMchId] = await Promise.all([
      MerchantModel.findAll({ status: 'active' }),
      MerchantModel.findAll({ status: 'pending' }),
      MerchantModel.findAll({ status: 'inactive' }),
      MerchantModel.findAll({ hasSubMchId: true })
    ])

    const stats = {
      total: active.total + pending.total + inactive.total,
      active: active.total,
      pending: pending.total,
      inactive: inactive.total,
      hasSubMchId: hasSubMchId.total,
      canGenerateQRCode: hasSubMchId.total
    }

    res.json({
      success: true,
      data: stats,
      message: '获取商户统计成功',
      dataSource: isUsingDatabase ? 'database' : 'mock'
    })

    console.log('📊 商户统计:', stats)

  } catch (error) {
    console.error('❌ 获取商户统计失败:', error)
    res.status(500).json({
      success: false,
      message: `获取统计失败: ${error.message}`,
      error_type: 'server_error'
    })
  }
})

/**
 * 获取商户列表
 */
app.get('/api/v1/admin/merchants', async (req, res) => {
  try {
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

    const result = await MerchantModel.findAll({
      page: Number(page),
      pageSize: Number(pageSize),
      status: status,
      keyword: keyword,
      merchantType: merchantType,
      hasSubMchId: hasSubMchId === 'true' ? true : hasSubMchId === 'false' ? false : undefined
    })

    res.json({
      success: true,
      data: {
        merchants: result.merchants,
        pagination: {
          current: Number(page),
          pageSize: Number(pageSize),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(pageSize))
        }
      },
      message: `成功获取${result.merchants.length}个商户信息`,
      dataSource: isUsingDatabase ? 'database' : 'mock'
    })
    
    console.log(`✅ 返回${result.merchants.length}个商户，共${result.total}个`)

  } catch (error) {
    console.error('❌ 获取商户列表失败:', error)
    res.status(500).json({
      success: false,
      message: `获取商户列表失败: ${error.message}`,
      error_type: 'server_error'
    })
  }
})

/**
 * 获取商户详情
 */
app.get('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    const { id } = req.params

    const merchant = await MerchantModel.findById(id)
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商户不存在',
        error_type: 'not_found'
      })
    }

    const qrEligibility = MerchantModel.checkQRCodeEligibility(merchant)

    res.json({
      success: true,
      data: {
        merchant,
        qrCodeEligibility: qrEligibility
      },
      message: '获取商户详情成功',
      dataSource: isUsingDatabase ? 'database' : 'mock'
    })

    console.log(`✅ 获取商户详情: ${merchant.merchantName}`)

  } catch (error) {
    console.error('❌ 获取商户详情失败:', error)
    res.status(500).json({
      success: false,
      message: `获取商户详情失败: ${error.message}`,
      error_type: 'server_error'
    })
  }
})

/**
 * 创建商户
 */
app.post('/api/v1/admin/merchants', async (req, res) => {
  try {
    const merchantData = req.body

    console.log('🆕 创建新商户:', {
      merchantName: merchantData.merchantName,
      merchantType: merchantData.merchantType,
      contactPerson: merchantData.contactPerson
    })

    // 检查重复申请单号
    if (merchantData.applymentId) {
      const existingByApplyment = await MerchantModel.findByApplymentId(merchantData.applymentId)
      if (existingByApplyment) {
        return res.status(400).json({
          success: false,
          message: '该微信申请单号已存在',
          error_type: 'duplicate_applyment_id'
        })
      }
    }

    const newMerchant = await MerchantModel.create(merchantData)

    res.status(201).json({
      success: true,
      data: { merchant: newMerchant },
      message: `商户 ${newMerchant.merchantName} 创建成功`,
      dataSource: isUsingDatabase ? 'database' : 'mock'
    })

    console.log(`✅ 商户创建成功: ${newMerchant.merchantName} (${newMerchant.id})`)

  } catch (error) {
    console.error('❌ 创建商户失败:', error)
    res.status(500).json({
      success: false,
      message: `创建商户失败: ${error.message}`,
      error_type: 'server_error'
    })
  }
})

/**
 * 更新商户
 */
app.put('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const existingMerchant = await MerchantModel.findById(id)
    if (!existingMerchant) {
      return res.status(404).json({
        success: false,
        message: '商户不存在',
        error_type: 'not_found'
      })
    }

    console.log('📝 更新商户信息:', {
      merchantId: id,
      merchantName: existingMerchant.merchantName,
      updateFields: Object.keys(updateData)
    })

    // 检查申请单号重复
    if (updateData.applymentId && updateData.applymentId !== existingMerchant.applymentId) {
      const duplicateByApplyment = await MerchantModel.findByApplymentId(updateData.applymentId)
      if (duplicateByApplyment && duplicateByApplyment.id !== id) {
        return res.status(400).json({
          success: false,
          message: '该微信申请单号已被其他商户使用',
          error_type: 'duplicate_applyment_id'
        })
      }
    }

    const updateSuccess = await MerchantModel.update(id, updateData)

    if (updateSuccess) {
      const updatedMerchant = await MerchantModel.findById(id)
      res.json({
        success: true,
        data: { merchant: updatedMerchant },
        message: '商户信息更新成功',
        dataSource: isUsingDatabase ? 'database' : 'mock'
      })
      console.log(`✅ 商户更新成功: ${existingMerchant.merchantName}`)
    } else {
      res.status(400).json({
        success: false,
        message: '没有可更新的内容或更新失败',
        error_type: 'update_failed'
      })
    }

  } catch (error) {
    console.error('❌ 更新商户失败:', error)
    res.status(500).json({
      success: false,
      message: `更新商户失败: ${error.message}`,
      error_type: 'server_error'
    })
  }
})

/**
 * 删除商户
 */
app.delete('/api/v1/admin/merchants/:id', async (req, res) => {
  try {
    const { id } = req.params

    const existingMerchant = await MerchantModel.findById(id)
    if (!existingMerchant) {
      return res.status(404).json({
        success: false,
        message: '商户不存在',
        error_type: 'not_found'
      })
    }

    console.log('🗑️ 删除商户:', {
      merchantId: id,
      merchantName: existingMerchant.merchantName
    })

    const deleteSuccess = await MerchantModel.delete(id)

    if (deleteSuccess) {
      res.json({
        success: true,
        message: `商户 ${existingMerchant.merchantName} 已停用`,
        dataSource: isUsingDatabase ? 'database' : 'mock'
      })
      console.log(`✅ 商户已停用: ${existingMerchant.merchantName}`)
    } else {
      res.status(400).json({
        success: false,
        message: '删除失败',
        error_type: 'delete_failed'
      })
    }

  } catch (error) {
    console.error('❌ 删除商户失败:', error)
    res.status(500).json({
      success: false,
      message: `删除商户失败: ${error.message}`,
      error_type: 'server_error'
    })
  }
})

/**
 * 检查二维码资格
 */
app.get('/api/v1/admin/merchants/:id/qr-eligibility', async (req, res) => {
  try {
    const { id } = req.params

    const merchant = await MerchantModel.findById(id)
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商户不存在',
        error_type: 'not_found'
      })
    }

    const eligibility = MerchantModel.checkQRCodeEligibility(merchant)

    res.json({
      success: true,
      data: eligibility,
      message: eligibility.eligible ? '商户符合二维码生成条件' : '商户不符合二维码生成条件',
      dataSource: isUsingDatabase ? 'database' : 'mock'
    })

  } catch (error) {
    console.error('❌ 检查二维码资格失败:', error)
    res.status(500).json({
      success: false,
      message: `检查失败: ${error.message}`,
      error_type: 'server_error'
    })
  }
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '商户管理后端服务运行正常',
    timestamp: new Date().toISOString(),
    dataSource: isUsingDatabase ? 'database' : 'mock',
    version: '1.0.0',
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
async function startServer() {
  console.log('🚀 初始化商户管理后端服务...')
  
  // 尝试连接数据库
  isUsingDatabase = await initDatabase()
  
  app.listen(PORT, () => {
    console.log('')
    console.log('✅ 商户管理后端服务启动成功!')
    console.log(`📡 服务地址: http://localhost:${PORT}`)
    console.log(`🔍 健康检查: http://localhost:${PORT}/health`)
    console.log(`📊 商户统计: http://localhost:${PORT}/api/v1/admin/merchants/stats`)
    console.log(`🗄️ 数据模式: ${isUsingDatabase ? 'MySQL数据库' : '模拟数据'}`)
    console.log('')
    console.log('🎯 商户CRUD功能已就绪，可以开始测试！')
    
    if (!isUsingDatabase) {
      console.log('')
      console.log('💡 提示: 当前使用模拟数据，如需连接数据库请配置环境变量:')
      console.log('   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME')
    }
  })
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务...')
  if (pool) {
    await pool.end()
    console.log('✅ 数据库连接池已关闭')
  }
  process.exit(0)
})

// 启动服务
startServer().catch(console.error)
