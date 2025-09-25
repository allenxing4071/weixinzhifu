/**
 * 商户CRUD功能测试脚本
 * 测试新开发的商户管理接口
 */

const axios = require('axios')

// 测试配置
const BASE_URL = 'http://localhost:3000/api/v1/admin/merchants'
const AUTH_TOKEN = 'your_admin_token_here' // 需要替换为真实的管理员token

// 配置axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

/**
 * 测试商户统计
 */
async function testGetStats() {
  console.log('\n🔢 测试商户统计...')
  try {
    const response = await api.get('/stats')
    console.log('✅ 统计数据:', response.data)
  } catch (error) {
    console.log('❌ 统计失败:', error.response?.data || error.message)
  }
}

/**
 * 测试获取商户列表
 */
async function testGetMerchantList() {
  console.log('\n📋 测试商户列表...')
  try {
    const response = await api.get('/', {
      params: {
        page: 1,
        pageSize: 10,
        status: 'active'
      }
    })
    console.log('✅ 商户列表:', {
      total: response.data.data.pagination.total,
      count: response.data.data.merchants.length,
      merchants: response.data.data.merchants.map(m => ({
        id: m.id,
        name: m.merchantName,
        status: m.status,
        subMchId: m.subMchId
      }))
    })
    return response.data.data.merchants[0]?.id // 返回第一个商户ID用于后续测试
  } catch (error) {
    console.log('❌ 获取列表失败:', error.response?.data || error.message)
  }
}

/**
 * 测试创建商户
 */
async function testCreateMerchant() {
  console.log('\n🆕 测试创建商户...')
  
  const newMerchant = {
    merchantName: '测试科技有限公司',
    contactPerson: '张测试',
    contactPhone: '13800138888',
    businessLicense: 'TEST91512345MA6CXXX999',
    contactEmail: 'test@example.com',
    merchantType: 'ENTERPRISE',
    legalPerson: '张测试',
    businessCategory: '软件开发'
  }
  
  try {
    const response = await api.post('/', newMerchant)
    console.log('✅ 创建成功:', {
      id: response.data.data.merchant.id,
      name: response.data.data.merchant.merchantName,
      status: response.data.data.merchant.status
    })
    return response.data.data.merchant.id
  } catch (error) {
    console.log('❌ 创建失败:', error.response?.data || error.message)
  }
}

/**
 * 测试获取商户详情
 */
async function testGetMerchantDetail(merchantId) {
  if (!merchantId) return
  
  console.log('\n🔍 测试商户详情...')
  try {
    const response = await api.get(`/${merchantId}`)
    console.log('✅ 商户详情:', {
      id: response.data.data.merchant.id,
      name: response.data.data.merchant.merchantName,
      qrEligibility: response.data.data.qrCodeEligibility
    })
  } catch (error) {
    console.log('❌ 获取详情失败:', error.response?.data || error.message)
  }
}

/**
 * 测试更新商户
 */
async function testUpdateMerchant(merchantId) {
  if (!merchantId) return
  
  console.log('\n📝 测试更新商户...')
  try {
    const updateData = {
      contactEmail: 'updated@example.com',
      businessCategory: '软件开发与技术服务'
    }
    
    const response = await api.put(`/${merchantId}`, updateData)
    console.log('✅ 更新成功:', {
      id: response.data.data.merchant.id,
      name: response.data.data.merchant.merchantName,
      email: response.data.data.merchant.contactEmail
    })
  } catch (error) {
    console.log('❌ 更新失败:', error.response?.data || error.message)
  }
}

/**
 * 测试二维码资格检查
 */
async function testQRCodeEligibility(merchantId) {
  if (!merchantId) return
  
  console.log('\n🔍 测试二维码资格检查...')
  try {
    const response = await api.get(`/${merchantId}/qr-eligibility`)
    console.log('✅ 二维码资格:', response.data.data)
  } catch (error) {
    console.log('❌ 检查失败:', error.response?.data || error.message)
  }
}

/**
 * 测试搜索功能
 */
async function testSearchMerchants() {
  console.log('\n🔎 测试搜索功能...')
  try {
    const response = await api.get('/', {
      params: {
        keyword: '测试',
        merchantType: 'ENTERPRISE'
      }
    })
    console.log('✅ 搜索结果:', {
      total: response.data.data.pagination.total,
      results: response.data.data.merchants.map(m => m.merchantName)
    })
  } catch (error) {
    console.log('❌ 搜索失败:', error.response?.data || error.message)
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🧪 开始商户CRUD功能测试...')
  console.log('📡 API基础地址:', BASE_URL)
  
  // 基础功能测试
  await testGetStats()
  const firstMerchantId = await testGetMerchantList()
  
  // 创建新商户测试
  const newMerchantId = await testCreateMerchant()
  
  // 详情和更新测试
  await testGetMerchantDetail(newMerchantId || firstMerchantId)
  await testUpdateMerchant(newMerchantId || firstMerchantId)
  
  // 高级功能测试
  await testQRCodeEligibility(firstMerchantId)
  await testSearchMerchants()
  
  console.log('\n✅ 所有测试完成!')
  console.log('\n📝 注意事项:')
  console.log('1. 如果遇到401认证错误，请更新AUTH_TOKEN')
  console.log('2. 如果遇到连接错误，请确保后端服务已启动')
  console.log('3. 数据库需要先执行 add_merchant_fields.sql')
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  testGetStats,
  testGetMerchantList,
  testCreateMerchant,
  testGetMerchantDetail,
  testUpdateMerchant,
  testQRCodeEligibility,
  testSearchMerchants
}
