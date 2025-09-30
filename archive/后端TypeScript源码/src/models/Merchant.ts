import { getDBConnection } from '../config/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface Merchant {
  id: string
  merchantName: string
  merchantNo: string
  contactPerson: string
  contactPhone: string
  businessLicense: string
  status: 'active' | 'inactive' | 'pending'
  qrCode?: string // 收款二维码
  subMchId?: string // 微信支付特约商户号
  totalAmount: number // 总收款金额
  totalOrders: number // 总订单数
  createdAt: Date
  updatedAt: Date
  
  // 新增微信标准字段
  applymentId?: string // 微信申请单号
  merchantType?: 'INDIVIDUAL' | 'ENTERPRISE' // 商户类型
  contactEmail?: string // 联系邮箱
  legalPerson?: string // 法定代表人
  businessCategory?: string // 经营类目
}

export interface CreateMerchantData {
  merchantName: string
  contactPerson: string
  contactPhone: string
  businessLicense: string
  
  // 可选字段
  contactEmail?: string
  merchantType?: 'INDIVIDUAL' | 'ENTERPRISE'
  legalPerson?: string
  businessCategory?: string
  applymentId?: string // 如果已有微信申请单号
  subMchId?: string // 如果已有特约商户号
}

export interface UpdateMerchantData {
  merchantName?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  businessLicense?: string
  merchantType?: 'INDIVIDUAL' | 'ENTERPRISE'
  legalPerson?: string
  businessCategory?: string
  applymentId?: string
  subMchId?: string
  status?: 'active' | 'inactive' | 'pending'
}

export class MerchantModel {
  /**
   * 创建商户
   */
  static async create(merchantData: CreateMerchantData): Promise<Merchant> {
    const connection = await getDBConnection()
    const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const merchantNo = `M${Date.now().toString().slice(-8)}`
    
    await connection.execute<ResultSetHeader>(
      `INSERT INTO merchants 
       (id, merchant_name, merchant_no, contact_person, contact_phone, business_license, 
        contact_email, merchant_type, legal_person, business_category, applyment_id, sub_mch_id,
        status, total_amount, total_orders, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        merchantId,
        merchantData.merchantName,
        merchantNo,
        merchantData.contactPerson,
        merchantData.contactPhone,
        merchantData.businessLicense,
        merchantData.contactEmail || null,
        merchantData.merchantType || 'INDIVIDUAL',
        merchantData.legalPerson || null,
        merchantData.businessCategory || null,
        merchantData.applymentId || null,
        merchantData.subMchId || null,
        'pending', // 新建商户需要审核
        0, // 初始金额为0
        0  // 初始订单数为0
      ]
    )
    
    return this.findById(merchantId) as Promise<Merchant>
  }
  
  /**
   * 根据ID查找商户
   */
  static async findById(id: string): Promise<Merchant | null> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM merchants WHERE id = ?',
      [id]
    )
    
    return rows.length > 0 ? rows[0] as Merchant : null
  }
  
  /**
   * 更新收款二维码
   */
  static async updateQRCode(merchantId: string, qrCode: string): Promise<boolean> {
    const connection = await getDBConnection()
    
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE merchants SET qr_code = ?, updated_at = NOW() WHERE id = ?',
      [qrCode, merchantId]
    )
    
    return result.affectedRows > 0
  }
  
  /**
   * 更新特约商户号
   */
  static async updateSubMchId(merchantId: string, subMchId: string): Promise<boolean> {
    const connection = await getDBConnection()
    
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE merchants SET sub_mch_id = ?, updated_at = NOW() WHERE id = ?',
      [subMchId, merchantId]
    )
    
    return result.affectedRows > 0
  }
  
  /**
   * 更新商户统计数据
   */
  static async updateStatistics(
    merchantId: string,
    orderAmount: number
  ): Promise<boolean> {
    const connection = await getDBConnection()
    
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE merchants 
       SET total_amount = total_amount + ?, 
           total_orders = total_orders + 1, 
           updated_at = NOW() 
       WHERE id = ?`,
      [orderAmount, merchantId]
    )
    
    return result.affectedRows > 0
  }
  
  /**
   * 更新商户信息
   */
  static async update(id: string, updateData: UpdateMerchantData): Promise<boolean> {
    const connection = await getDBConnection()
    
    // 构建动态更新SQL
    const updateFields: string[] = []
    const updateValues: any[] = []
    
    const fieldMap: Record<string, string> = {
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
    
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE merchants SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )
    
    return result.affectedRows > 0
  }
  
  /**
   * 删除商户（软删除）
   */
  static async delete(id: string): Promise<boolean> {
    const connection = await getDBConnection()
    
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE merchants SET status = ?, updated_at = NOW() WHERE id = ?',
      ['inactive', id]
    )
    
    return result.affectedRows > 0
  }
  
  /**
   * 查询商户列表（支持筛选）
   */
  static async findAll(params: {
    page?: number
    pageSize?: number
    status?: string
    keyword?: string
    merchantType?: string
    hasSubMchId?: boolean
  } = {}): Promise<{merchants: Merchant[], total: number}> {
    const connection = await getDBConnection()
    const {
      page = 1,
      pageSize = 20,
      status,
      keyword,
      merchantType,
      hasSubMchId
    } = params
    
    const offset = (page - 1) * pageSize
    
    // 构建WHERE条件
    const conditions: string[] = []
    const values: any[] = []
    
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
    
    // 查询列表
    const [merchants] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM merchants ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset]
    )
    
    // 查询总数
    const [countResult] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM merchants ${whereClause}`,
      values
    )
    
    return {
      merchants: merchants as Merchant[],
      total: countResult[0].total
    }
  }

  /**
   * 查询活跃商户列表
   */
  static async getActiveMerchants(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{merchants: Merchant[], total: number}> {
    return this.findAll({ page, pageSize, status: 'active' })
  }
  
  /**
   * 根据微信申请单号查找商户
   */
  static async findByApplymentId(applymentId: string): Promise<Merchant | null> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM merchants WHERE applyment_id = ?',
      [applymentId]
    )
    
    return rows.length > 0 ? rows[0] as Merchant : null
  }
  
  /**
   * 检查商户是否可以生成二维码
   */
  static async checkQRCodeEligibility(id: string): Promise<{
    eligible: boolean
    message: string
    missingFields?: string[]
  }> {
    const merchant = await this.findById(id)
    
    if (!merchant) {
      return { eligible: false, message: '商户不存在' }
    }
    
    const missingFields: string[] = []
    
    // 检查必填字段
    if (!merchant.merchantName) missingFields.push('商户名称')
    if (!merchant.contactPerson) missingFields.push('联系人姓名')
    if (!merchant.contactPhone) missingFields.push('联系电话')
    if (!merchant.businessLicense) missingFields.push('营业执照号')
    if (!merchant.subMchId) missingFields.push('微信特约商户号')
    
    // 检查状态
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
