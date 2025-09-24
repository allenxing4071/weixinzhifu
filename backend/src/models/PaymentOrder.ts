import { getDBConnection } from '@/config/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface PaymentOrder {
  id: string
  orderNo: string
  userId: string
  merchantId: string
  amount: number // 金额（分）
  pointsAwarded: number // 已发放积分
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded'
  paymentMethod: 'wechat'
  transactionId?: string // 微信交易号
  description: string
  paidAt?: Date
  expiredAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrderData {
  userId: string
  merchantId: string
  amount: number
  description: string
}

export class PaymentOrderModel {
  /**
   * 创建支付订单
   */
  static async create(orderData: CreateOrderData): Promise<PaymentOrder> {
    const connection = await getDBConnection()
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const orderNo = `NO${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    
    // 订单1小时后过期
    const expiredAt = new Date(Date.now() + 60 * 60 * 1000)
    
    await connection.execute<ResultSetHeader>(
      `INSERT INTO payment_orders 
       (id, order_no, user_id, merchant_id, amount, points_awarded, status, payment_method, description, expired_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderId,
        orderNo,
        orderData.userId,
        orderData.merchantId,
        orderData.amount,
        0, // 初始积分为0
        'pending',
        'wechat',
        orderData.description,
        expiredAt
      ]
    )
    
    return this.findById(orderId) as Promise<PaymentOrder>
  }
  
  /**
   * 根据ID查找订单
   */
  static async findById(id: string): Promise<PaymentOrder | null> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM payment_orders WHERE id = ?',
      [id]
    )
    
    return rows.length > 0 ? rows[0] as PaymentOrder : null
  }
  
  /**
   * 根据订单号查找
   */
  static async findByOrderNo(orderNo: string): Promise<PaymentOrder | null> {
    const connection = await getDBConnection()
    
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM payment_orders WHERE order_no = ?',
      [orderNo]
    )
    
    return rows.length > 0 ? rows[0] as PaymentOrder : null
  }
  
  /**
   * 更新订单状态为已支付
   */
  static async markAsPaid(
    orderId: string, 
    transactionId: string, 
    pointsAwarded: number
  ): Promise<boolean> {
    const connection = await getDBConnection()
    
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE payment_orders 
       SET status = 'paid', transaction_id = ?, points_awarded = ?, paid_at = NOW(), updated_at = NOW() 
       WHERE id = ? AND status = 'pending'`,
      [transactionId, pointsAwarded, orderId]
    )
    
    return result.affectedRows > 0
  }
  
  /**
   * 查询用户支付历史
   */
  static async getUserPaymentHistory(
    userId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<{orders: PaymentOrder[], total: number}> {
    const connection = await getDBConnection()
    const offset = (page - 1) * pageSize
    
    // 查询订单列表
    const [orders] = await connection.execute<RowDataPacket[]>(
      `SELECT o.*, m.merchant_name 
       FROM payment_orders o 
       LEFT JOIN merchants m ON o.merchant_id = m.id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    )
    
    // 查询总数
    const [countResult] = await connection.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM payment_orders WHERE user_id = ?',
      [userId]
    )
    
    return {
      orders: orders as PaymentOrder[],
      total: countResult[0].total
    }
  }
  
  /**
   * 查询商户收款记录
   */
  static async getMerchantPayments(
    merchantId: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{orders: PaymentOrder[], total: number, totalAmount: number}> {
    const connection = await getDBConnection()
    const offset = (page - 1) * pageSize
    
    let whereClause = 'WHERE merchant_id = ? AND status = "paid"'
    const params: any[] = [merchantId]
    
    if (startDate) {
      whereClause += ' AND paid_at >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND paid_at <= ?'
      params.push(endDate)
    }
    
    // 查询订单列表
    const [orders] = await connection.execute<RowDataPacket[]>(
      `SELECT o.*, u.nickname, u.avatar 
       FROM payment_orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       ${whereClause} 
       ORDER BY o.paid_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )
    
    // 查询总数和总金额
    const [summary] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as totalAmount 
       FROM payment_orders 
       ${whereClause}`,
      params
    )
    
    return {
      orders: orders as PaymentOrder[],
      total: summary[0].total,
      totalAmount: summary[0].totalAmount
    }
  }
}
