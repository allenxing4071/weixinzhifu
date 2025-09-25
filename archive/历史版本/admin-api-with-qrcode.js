const express = require('express')
const mysql = require('mysql2')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const QRCode = require('qrcode')
const crypto = require('crypto')

const app = express()
app.use(express.json())

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '123456',
  database: 'points_app',
  charset: 'utf8mb4'
}

// JWT密钥
const JWT_SECRET = 'your-secret-key-2024'

// 微信支付配置
const WECHAT_CONFIG = {
  appId: 'wx9bed12ef0904d035',
  mchId: 'YOUR_SERVICE_PROVIDER_MCH_ID', // 服务商商户号
  apiKey: 'YOUR_API_KEY',
  serviceProviderMode: true,
  defaultSubMchId: '1900000001'
}

// 管理员JWT验证中间件
function authenticateAdminJWT(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供访问令牌'
    })
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '访问令牌无效或已过期'
      })
    }
    req.admin = admin
    next()
  })
}

// 数据库连接
function getConnection() {
  return mysql.createConnection(dbConfig)
}

// ================================
// 管理员认证API
// ================================

// 管理员登录
app.post('/api/v1/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { 
          adminId: 'admin_001', 
          username: 'admin',
          roleId: 'super_admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )
      
      res.json({
        success: true,
        data: {
          token,
          admin: {
            id: 'admin_001',
            username: 'admin',
            nickname: '系统管理员',
            role: 'super_admin'
          }
        }
      })
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请重试'
    })
  }
})

// ================================
// 二维码生成服务类
// ================================

class MerchantQRCodeService {
  // 生成商户二维码
  static async generateMerchantQRCode(merchantId, subMchId, fixedAmount) {
    try {
      // 1. 生成二维码数据
      const qrCodeData = this.buildQRCodeData(merchantId, subMchId, fixedAmount)
      
      // 2. 生成二维码图片
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      })
      
      // 3. 构建访问URL
      const qrCodeUrl = this.buildMiniProgramUrl(merchantId, subMchId, fixedAmount)
      
      // 4. 设置有效期（24小时）
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)
      
      return {
        qrCodeBuffer,
        qrCodeUrl,
        qrCodeData,
        expiresAt
      }
      
    } catch (error) {
      console.error('生成商户二维码失败:', error)
      throw new Error('二维码生成失败')
    }
  }
  
  // 构建二维码数据内容
  static buildQRCodeData(merchantId, subMchId, fixedAmount) {
    const basePath = 'pages/payment/index'
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() }),
      timestamp: Date.now().toString(),
      sign: this.generateSign(merchantId, subMchId, fixedAmount)
    })
    
    return `${basePath}?${params.toString()}`
  }
  
  // 构建小程序访问URL
  static buildMiniProgramUrl(merchantId, subMchId, fixedAmount) {
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() })
    })
    
    return `https://8.156.84.226/miniprogram/payment?${params.toString()}`
  }
  
  // 生成安全签名
  static generateSign(merchantId, subMchId, fixedAmount) {
    const data = `${merchantId}${subMchId}${fixedAmount || ''}${WECHAT_CONFIG.apiKey}`
    return crypto.createHash('md5').update(data).digest('hex').toLowerCase()
  }
  
  // 验证二维码签名
  static verifyQRCodeSign(merchantId, subMchId, sign, fixedAmount) {
    const expectedSign = this.generateSign(merchantId, subMchId, fixedAmount)
    return sign === expectedSign
  }
}

// ================================
// 商户二维码管理API
// ================================

// 为商户生成支付二维码
app.post('/api/v1/admin/merchants/:merchantId/qrcode', authenticateAdminJWT, async (req, res) => {
  try {
    const { merchantId } = req.params
    const { fixedAmount, qrType = 'miniprogram' } = req.body
    
    const connection = getConnection()
    
    // 1. 验证商户是否存在
    const [merchants] = await connection.promise().execute(
      'SELECT * FROM merchants WHERE id = ? AND status = ?',
      [merchantId, 'active']
    )
    
    if (merchants.length === 0) {
      connection.end()
      return res.status(404).json({
        success: false,
        message: '商户不存在或已禁用'
      })
    }
    
    const merchant = merchants[0]
    
    // 2. 检查商户是否配置了特约商户号
    if (!merchant.sub_mch_id) {
      connection.end()
      return res.status(400).json({
        success: false,
        message: '商户未配置微信支付特约商户号，请先完成配置'
      })
    }
    
    // 3. 生成二维码
    const qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
      merchantId,
      merchant.sub_mch_id,
      fixedAmount ? Math.round(fixedAmount * 100) : undefined
    )
    
    // 4. 返回二维码（Base64格式）
    const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64')
    
    connection.end()
    
    res.json({
      success: true,
      data: {
        qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
        qrCodeUrl: qrCodeResult.qrCodeUrl,
        qrCodeData: qrCodeResult.qrCodeData,
        qrType,
        merchantInfo: {
          id: merchant.id,
          name: merchant.merchant_name,
          subMchId: merchant.sub_mch_id
        },
        fixedAmount,
        expiresAt: qrCodeResult.expiresAt,
        createdAt: new Date()
      },
      message: '二维码生成成功'
    })
    
  } catch (error) {
    console.error('生成商户二维码失败:', error)
    res.status(500).json({
      success: false,
      message: '二维码生成失败，请重试'
    })
  }
})

// 批量为多个商户生成二维码
app.post('/api/v1/admin/merchants/qrcode/batch', authenticateAdminJWT, async (req, res) => {
  try {
    const { merchantIds, qrType = 'miniprogram', fixedAmount } = req.body
    
    if (!Array.isArray(merchantIds) || merchantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的商户ID列表'
      })
    }
    
    if (merchantIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: '单次最多支持50个商户'
      })
    }
    
    const connection = getConnection()
    
    // 获取商户信息
    const placeholders = merchantIds.map(() => '?').join(',')
    const [merchants] = await connection.promise().execute(
      `SELECT * FROM merchants WHERE id IN (${placeholders}) AND status = 'active'`,
      merchantIds
    )
    
    const results = []
    const errors = []
    
    // 为每个商户生成二维码
    for (const merchant of merchants) {
      try {
        if (!merchant.sub_mch_id) {
          errors.push({
            merchantId: merchant.id,
            merchantName: merchant.merchant_name,
            error: '未配置特约商户号'
          })
          continue
        }
        
        const qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
          merchant.id,
          merchant.sub_mch_id,
          fixedAmount ? Math.round(fixedAmount * 100) : undefined
        )
        
        const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64')
        
        results.push({
          merchantId: merchant.id,
          merchantName: merchant.merchant_name,
          qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
          qrCodeUrl: qrCodeResult.qrCodeUrl,
          expiresAt: qrCodeResult.expiresAt
        })
        
      } catch (error) {
        errors.push({
          merchantId: merchant.id,
          merchantName: merchant.merchant_name,
          error: error.message || '生成失败'
        })
      }
    }
    
    connection.end()
    
    res.json({
      success: true,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: merchantIds.length,
          successful: results.length,
          failed: errors.length
        }
      },
      message: `批量生成完成：成功${results.length}个，失败${errors.length}个`
    })
    
  } catch (error) {
    console.error('批量生成二维码失败:', error)
    res.status(500).json({
      success: false,
      message: '批量生成失败，请重试'
    })
  }
})

// 验证二维码有效性
app.post('/api/v1/admin/qrcode/verify', authenticateAdminJWT, async (req, res) => {
  try {
    const { merchantId, subMchId, sign, fixedAmount } = req.body
    
    // 验证签名
    const isValid = MerchantQRCodeService.verifyQRCodeSign(
      merchantId,
      subMchId,
      sign,
      fixedAmount ? Math.round(fixedAmount * 100) : undefined
    )
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '二维码签名验证失败'
      })
    }
    
    const connection = getConnection()
    
    // 验证商户状态
    const [merchants] = await connection.promise().execute(
      'SELECT * FROM merchants WHERE id = ? AND status = ?',
      [merchantId, 'active']
    )
    
    connection.end()
    
    if (merchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在或已禁用'
      })
    }
    
    const merchant = merchants[0]
    
    res.json({
      success: true,
      data: {
        valid: true,
        merchant: {
          id: merchant.id,
          name: merchant.merchant_name,
          subMchId: merchant.sub_mch_id
        }
      },
      message: '二维码验证通过'
    })
    
  } catch (error) {
    console.error('验证二维码失败:', error)
    res.status(500).json({
      success: false,
      message: '验证失败，请重试'
    })
  }
})

// ================================
// 原有的管理后台API（保持不变）
// ================================

// 仪表板统计数据
app.get('/api/v1/admin/dashboard/stats', authenticateAdminJWT, async (req, res) => {
  try {
    const connection = getConnection()
    
    // 获取统计数据
    const [userCount] = await connection.promise().execute('SELECT COUNT(*) as count FROM users')
    const [merchantCount] = await connection.promise().execute('SELECT COUNT(*) as count FROM merchants WHERE status = "active"')
    const [orderCount] = await connection.promise().execute('SELECT COUNT(*) as count FROM payment_orders')
    const [totalAmount] = await connection.promise().execute('SELECT COALESCE(SUM(amount), 0) as total FROM payment_orders WHERE status = "completed"')
    
    connection.end()
    
    res.json({
      success: true,
      data: {
        totalUsers: userCount[0].count,
        totalMerchants: merchantCount[0].count,
        totalOrders: orderCount[0].count,
        totalAmount: Number(totalAmount[0].total),
        totalPoints: userCount[0].count * 100 // 示例数据
      }
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    })
  }
})

// 用户管理API
app.get('/api/v1/admin/users', authenticateAdminJWT, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search = '' } = req.query
    const offset = (page - 1) * pageSize
    
    const connection = getConnection()
    
    let whereClause = ''
    let params = []
    
    if (search) {
      whereClause = 'WHERE nickname LIKE ? OR phone LIKE ?'
      params = [`%${search}%`, `%${search}%`]
    }
    
    const [users] = await connection.promise().execute(
      `SELECT id, nickname, avatar, phone, points_balance as pointsBalance, 
              created_at as createdAt, updated_at as updatedAt 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [total] = await connection.promise().execute(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    )
    
    connection.end()
    
    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          pointsBalance: Number(user.pointsBalance)
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total[0].count
        }
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    })
  }
})

// 商户管理API
app.get('/api/v1/admin/merchants', authenticateAdminJWT, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status = '' } = req.query
    const offset = (page - 1) * pageSize
    
    const connection = getConnection()
    
    let whereClause = ''
    let params = []
    
    if (status) {
      whereClause = 'WHERE status = ?'
      params = [status]
    }
    
    const [merchants] = await connection.promise().execute(
      `SELECT id, merchant_name as merchantName, merchant_no as merchantNo, 
              contact_person as contactPerson, contact_phone as contactPhone,
              business_license as businessLicense, status, sub_mch_id as subMchId,
              total_amount as totalAmount, total_orders as totalOrders,
              created_at as createdAt, updated_at as updatedAt 
       FROM merchants ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )
    
    const [total] = await connection.promise().execute(
      `SELECT COUNT(*) as count FROM merchants ${whereClause}`,
      params
    )
    
    connection.end()
    
    res.json({
      success: true,
      data: {
        merchants: merchants.map(merchant => ({
          ...merchant,
          totalAmount: Number(merchant.totalAmount)
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total[0].count
        }
      }
    })
  } catch (error) {
    console.error('获取商户列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取商户列表失败'
    })
  }
})

// 更新商户特约商户号
app.put('/api/v1/admin/merchants/:id/sub-mch-id', authenticateAdminJWT, async (req, res) => {
  try {
    const { id } = req.params
    const { subMchId } = req.body
    
    if (!subMchId) {
      return res.status(400).json({
        success: false,
        message: '特约商户号不能为空'
      })
    }
    
    const connection = getConnection()
    
    const [result] = await connection.promise().execute(
      'UPDATE merchants SET sub_mch_id = ?, updated_at = NOW() WHERE id = ?',
      [subMchId, id]
    )
    
    connection.end()
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      })
    }
    
    res.json({
      success: true,
      message: '特约商户号更新成功'
    })
    
  } catch (error) {
    console.error('更新特约商户号失败:', error)
    res.status(500).json({
      success: false,
      message: '更新失败，请重试'
    })
  }
})

// 积分记录API
app.get('/api/v1/admin/points', authenticateAdminJWT, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize
    
    const connection = getConnection()
    
    const [records] = await connection.promise().execute(
      `SELECT pr.id, pr.user_id as userId, u.nickname as userNickname,
              pr.type, pr.amount, pr.description, pr.related_order_id as relatedOrderId,
              pr.created_at as createdAt
       FROM points_records pr
       LEFT JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    )
    
    const [total] = await connection.promise().execute('SELECT COUNT(*) as count FROM points_records')
    
    connection.end()
    
    res.json({
      success: true,
      data: {
        records: records.map(record => ({
          ...record,
          amount: Number(record.amount)
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total[0].count
        }
      }
    })
  } catch (error) {
    console.error('获取积分记录失败:', error)
    res.status(500).json({
      success: false,
      message: '获取积分记录失败'
    })
  }
})

// 订单管理API
app.get('/api/v1/admin/orders', authenticateAdminJWT, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize
    
    const connection = getConnection()
    
    const [orders] = await connection.promise().execute(
      `SELECT po.id, po.order_no as orderNo, po.user_id as userId, u.nickname as userNickname,
              po.merchant_id as merchantId, m.merchant_name as merchantName,
              po.amount, po.status, po.created_at as createdAt
       FROM payment_orders po
       LEFT JOIN users u ON po.user_id = u.id
       LEFT JOIN merchants m ON po.merchant_id = m.id
       ORDER BY po.created_at DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    )
    
    const [total] = await connection.promise().execute('SELECT COUNT(*) as count FROM payment_orders')
    
    connection.end()
    
    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          ...order,
          amount: Number(order.amount)
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total[0].count
        }
      }
    })
  } catch (error) {
    console.error('获取订单列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    })
  }
})

// 启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 积分管理系统API服务启动成功`)
  console.log(`📡 服务地址: http://localhost:${PORT}`)
  console.log(`📋 管理后台: http://localhost/admin`)
  console.log(`🔧 二维码生成功能已集成`)
})
