import { getDBConnection } from '@/config/database'
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
  totalAmount: number // 总收款金额
  totalOrders: number // 总订单数
  createdAt: Date
  updatedAt: Date
}

export interface CreateMerchantData {
  merchantName: string
  contactPerson: string
  contactPhone: string
  businessLicense: string
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
       (id, merchant_name, merchant_no, contact_person, contact_phone, business_license, status, total_amount, total_orders, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        merchantId,
        merchantData.merchantName,
        merchantNo,
        merchantData.contactPerson,
        merchantData.contactPhone,
        merchantData.businessLicense,
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
   * 查询活跃商户列表
   */
  static async getActiveMerchants(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{merchants: Merchant[], total: number}> {
    const connection = await getDBConnection()
    const offset = (page - 1) * pageSize
    
    // 查询商户列表
    const [merchants] = await connection.execute<RowDataPacket[]>(
      `SELECT * FROM merchants 
       WHERE status = 'active' 
       ORDER BY total_amount DESC 
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )
    
    // 查询总数
    const [countResult] = await connection.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM merchants WHERE status = ?',
      ['active']
    )
    
    return {
      merchants: merchants as Merchant[],
      total: countResult[0].total
    }
  }
}
