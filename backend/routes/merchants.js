// 商户管理路由模块
const express = require('express');
const router = express.Router();
const {
  validatePagination,
  validateMerchantId,
  validateCreateMerchant,
  validateUpdateMerchant
} = require('../middlewares/validation');
const { requireAdmin } = require('../utils/jwt');
const { logOperation } = require('../utils/logger');

// ==================== 获取商户统计数据 ====================
router.get('/stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled
      FROM merchants
    `);

    res.json({
      success: true,
      data: stats[0] || { total: 0, active: 0, pending: 0, disabled: 0 }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取商户列表（管理后台） ====================
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const status = req.query.status;
    const search = req.query.search;
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE m.status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += (whereClause ? ' AND' : 'WHERE');
      whereClause += ' (m.merchant_name LIKE ? OR m.contact_person LIKE ? OR m.contact_phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // 优化：一次JOIN查询获取商户和统计数据
    const [merchants] = await pool.query(`
      SELECT
        m.id,
        m.merchant_name as name,
        m.merchant_no as wechatMchId,
        m.business_category as category,
        m.contact_person as contactPerson,
        m.contact_phone as contactPhone,
        m.qr_code as qrCode,
        m.status,
        m.created_at as createdAt,
        m.updated_at as updatedAt,
        COUNT(DISTINCT o.user_id) as userCount,
        COUNT(CASE WHEN o.status='paid' THEN 1 END) as orderCount,
        COALESCE(SUM(CASE WHEN o.status='paid' THEN o.amount ELSE 0 END), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN o.status='paid' THEN o.points_awarded ELSE 0 END), 0) as totalPoints
      FROM merchants m
      LEFT JOIN payment_orders o ON m.id = o.merchant_id
      ${whereClause}
      GROUP BY m.id, m.merchant_name, m.merchant_no, m.business_category,
               m.contact_person, m.contact_phone, m.qr_code, m.status, m.created_at, m.updated_at
      ORDER BY totalAmount DESC, m.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM merchants m ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        list: merchants,
        pagination: {
          page,
          pageSize,
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取商户详情 ====================
router.get('/:id', validateMerchantId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;

    const [merchants] = await pool.execute(`
      SELECT
        id,
        merchant_name as name,
        merchant_no as wechatMchId,
        sub_mch_id as subMchId,
        business_category as businessCategory,
        contact_person as contactPerson,
        contact_phone as contactPhone,
        qr_code as qrCode,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM merchants
      WHERE id = ?
    `, [id]);

    if (merchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      });
    }

    res.json({
      success: true,
      data: merchants[0]
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 创建商户 ====================
router.post('/', requireAdmin, validateCreateMerchant, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const {
      merchantName,
      wechatMchId,
      businessCategory,
      contactPerson,
      contactPhone
    } = req.body;

    // 检查商户号是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM merchants WHERE merchant_no = ?',
      [wechatMchId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该微信商户号已存在'
      });
    }

    const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await pool.execute(`
      INSERT INTO merchants
      (id, merchant_name, merchant_no, business_category, contact_person, contact_phone, business_license, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `, [merchantId, merchantName, wechatMchId, businessCategory, contactPerson, contactPhone, wechatMchId]);

    logOperation('Create Merchant', req.user.id, {
      merchantId,
      merchantName,
      wechatMchId
    });

    res.status(201).json({
      success: true,
      message: '商户创建成功',
      data: {
        id: merchantId,
        name: merchantName,
        wechatMchId,
        businessCategory,
        contactPerson,
        contactPhone,
        status: 'active'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 更新商户 ====================
router.put('/:id', requireAdmin, validateUpdateMerchant, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;
    const updates = {};
    const fields = [];
    const values = [];

    // 构建动态更新SQL
    const allowedFields = {
      merchantName: 'merchant_name',
      contactPerson: 'contact_person',
      contactPhone: 'contact_phone',
      status: 'status'
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (req.body[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(req.body[key]);
        updates[key] = req.body[key];
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    values.push(id);

    const [result] = await pool.execute(
      `UPDATE merchants SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      });
    }

    logOperation('Update Merchant', req.user.id, {
      merchantId: id,
      updates
    });

    res.json({
      success: true,
      message: '商户更新成功',
      data: { id, ...updates }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 删除/禁用商户 ====================
router.delete('/:id', requireAdmin, validateMerchantId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;

    // 软删除：只更改状态为inactive
    const [result] = await pool.execute(
      'UPDATE merchants SET status = "inactive", updated_at = NOW() WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      });
    }

    logOperation('Delete Merchant', req.user.id, { merchantId: id });

    res.json({
      success: true,
      message: '商户已禁用'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 生成商户二维码 ====================
router.post('/:id/qrcode', requireAdmin, validateMerchantId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;

    // 检查商户是否存在
    const [merchants] = await pool.execute(
      'SELECT id, merchant_name, merchant_no, sub_mch_id FROM merchants WHERE id = ?',
      [id]
    );

    if (merchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      });
    }

    const merchant = merchants[0];

    // 检查必要字段
    if (!merchant.merchant_no) {
      return res.status(400).json({
        success: false,
        message: '商户缺少微信商户号，无法生成二维码'
      });
    }

    // 生成二维码数据（这里简化处理，实际应该调用微信支付API）
    // 二维码内容格式：weixin://wxpay/bizpayurl?pr=xxxxx
    const qrCodeData = `weixin://wxpay/bizpayurl?pr=${merchant.merchant_no}_${Date.now()}`;
    
    // 更新商户的二维码字段
    await pool.execute(
      'UPDATE merchants SET qr_code = ?, updated_at = NOW() WHERE id = ?',
      [qrCodeData, id]
    );

    logOperation('Generate QR Code', req.user.id, {
      merchantId: id,
      merchantName: merchant.merchant_name
    });

    res.json({
      success: true,
      message: '二维码生成成功',
      data: {
        qrCode: qrCodeData,
        merchantName: merchant.merchant_name
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取商户详细统计数据 ====================
router.get('/:id/stats', validateMerchantId, async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;

    // 总体统计
    const [stats] = await pool.execute(`
      SELECT
        COUNT(DISTINCT user_id) as totalUsers,
        COUNT(*) as totalOrders,
        COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN status='paid' THEN points_awarded ELSE 0 END), 0) as totalPoints
      FROM payment_orders
      WHERE merchant_id = ?
    `, [id]);

    // 近7天趋势
    const [trends] = await pool.execute(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END), 0) as revenue
      FROM payment_orders
      WHERE merchant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        overview: {
          ...stats[0],
          totalRevenue: stats[0].totalRevenue / 100
        },
        trends: trends.map(item => ({
          ...item,
          revenue: item.revenue / 100
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
