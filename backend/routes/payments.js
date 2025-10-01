// 支付路由模块
const express = require('express');
const router = express.Router();
const { validateCreatePayment, validateMockPayment } = require('../middlewares/validation');
const { paymentLimiter } = require('../middlewares/rateLimiter');
const { logOperation } = require('../utils/logger');

// 积分计算：1元=1分，小数舍去
function calculatePoints(amountInCents) {
  return Math.floor(amountInCents / 100);
}

// ==================== 创建支付订单 ====================
router.post('/create', paymentLimiter, validateCreatePayment, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }

    const { merchantId, amount, description = '商户收款' } = req.body;

    // 获取商户信息
    const [merchantData] = await pool.execute(
      'SELECT id, merchant_name, business_category, status FROM merchants WHERE id = ?',
      [merchantId]
    );

    if (merchantData.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      });
    }

    const merchant = merchantData[0];

    if (merchant.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '商户已停用，无法支付'
      });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const pointsAwarded = calculatePoints(amount);

    await pool.execute(`
      INSERT INTO payment_orders
      (id, user_id, merchant_id, merchant_name, merchant_category, amount, points_awarded, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      orderId,
      req.user.id,
      merchantId,
      merchant.merchant_name,
      merchant.business_category,
      amount,
      pointsAwarded
    ]);

    // 模拟微信支付参数
    const paymentData = {
      orderId,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: Math.random().toString(36).substring(2, 15),
      packageStr: `prepay_id=wx${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
      signType: 'RSA',
      paySign: 'mock_pay_sign_' + Math.random().toString(36).substring(2, 15),
      expectedPoints: pointsAwarded,
      merchantName: merchant.merchant_name
    };

    logOperation('Create Payment Order', req.user.id, {
      orderId,
      merchantId,
      amount,
      pointsAwarded
    });

    res.json({
      success: true,
      message: '支付订单创建成功',
      data: paymentData
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 模拟支付成功（仅供测试） ====================
router.post('/mock-success', validateMockPayment, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }

    const { orderId } = req.body;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 更新订单状态
      const [updateResult] = await connection.execute(
        'UPDATE payment_orders SET status = "paid", paid_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ? AND status = "pending"',
        [orderId, req.user.id]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error('订单不存在、权限不足或已支付');
      }

      // 获取订单信息
      const [orderData] = await connection.execute(
        'SELECT * FROM payment_orders WHERE id = ?',
        [orderId]
      );

      const order = orderData[0];

      // 创建积分记录
      const pointsRecordId = `points_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await connection.execute(`
        INSERT INTO points_records
        (id, user_id, points_change, record_type, related_order_id, merchant_id, merchant_name, description)
        VALUES (?, ?, ?, 'payment_reward', ?, ?, ?, ?)
      `, [
        pointsRecordId,
        order.user_id,
        order.points_awarded,
        order.id,
        order.merchant_id,
        order.merchant_name,
        `在${order.merchant_name}消费获得积分`
      ]);

      // 更新用户积分
      await connection.execute(`
        INSERT INTO user_points (user_id, available_points, total_earned, total_spent)
        VALUES (?, ?, ?, 0)
        ON DUPLICATE KEY UPDATE
        available_points = available_points + ?,
        total_earned = total_earned + ?
      `, [
        order.user_id,
        order.points_awarded,
        order.points_awarded,
        order.points_awarded,
        order.points_awarded
      ]);

      await connection.commit();

      logOperation('Payment Success', req.user.id, {
        orderId: order.id,
        merchantId: order.merchant_id,
        amount: order.amount,
        pointsAwarded: order.points_awarded
      });

      res.json({
        success: true,
        message: '支付成功，积分已发放',
        data: {
          orderId: order.id,
          pointsAwarded: order.points_awarded,
          merchantName: order.merchant_name,
          amount: order.amount / 100
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
});

// ==================== 支付结果查询 ====================
router.get('/query/:orderId', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: '未认证' });
    }

    const { orderId } = req.params;

    const [orders] = await pool.execute(
      'SELECT id, merchant_name, amount, points_awarded, status, paid_at, created_at FROM payment_orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在或无权限'
      });
    }

    const order = orders[0];

    res.json({
      success: true,
      data: {
        orderId: order.id,
        merchantName: order.merchant_name,
        amount: order.amount / 100,
        pointsAwarded: order.points_awarded,
        status: order.status,
        paidAt: order.paid_at,
        createdAt: order.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
