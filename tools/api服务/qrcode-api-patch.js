// 二维码功能补丁文件 - 添加到现有API服务器
// 需要在原有API文件末尾添加以下代码

const QRCode = require('qrcode');
const crypto = require('crypto');

// 微信支付配置（在现有配置基础上扩展）
const WECHAT_CONFIG = {
  appId: 'wx9bed12ef0904d035',
  mchId: 'YOUR_SERVICE_PROVIDER_MCH_ID', // 服务商商户号
  apiKey: 'YOUR_API_KEY',
  serviceProviderMode: true,
  defaultSubMchId: '1900000001'
};

// ================================
// 二维码生成服务类
// ================================

class MerchantQRCodeService {
  // 生成商户二维码
  static async generateMerchantQRCode(merchantId, subMchId, fixedAmount) {
    try {
      // 1. 生成二维码数据
      const qrCodeData = this.buildQRCodeData(merchantId, subMchId, fixedAmount);
      
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
      });
      
      // 3. 构建访问URL
      const qrCodeUrl = this.buildMiniProgramUrl(merchantId, subMchId, fixedAmount);
      
      // 4. 设置有效期（24小时）
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      return {
        qrCodeBuffer,
        qrCodeUrl,
        qrCodeData,
        expiresAt
      };
      
    } catch (error) {
      console.error('生成商户二维码失败:', error);
      throw new Error('二维码生成失败');
    }
  }
  
  // 构建二维码数据内容
  static buildQRCodeData(merchantId, subMchId, fixedAmount) {
    const basePath = 'pages/payment/index';
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() }),
      timestamp: Date.now().toString(),
      sign: this.generateSign(merchantId, subMchId, fixedAmount)
    });
    
    return `${basePath}?${params.toString()}`;
  }
  
  // 构建小程序访问URL
  static buildMiniProgramUrl(merchantId, subMchId, fixedAmount) {
    const params = new URLSearchParams({
      merchantId,
      subMchId,
      ...(fixedAmount && { amount: (fixedAmount / 100).toString() })
    });
    
    return `https://8.156.84.226/miniprogram/payment?${params.toString()}`;
  }
  
  // 生成安全签名
  static generateSign(merchantId, subMchId, fixedAmount) {
    const data = `${merchantId}${subMchId}${fixedAmount || ''}${WECHAT_CONFIG.apiKey}`;
    return crypto.createHash('md5').update(data).digest('hex').toLowerCase();
  }
  
  // 验证二维码签名
  static verifyQRCodeSign(merchantId, subMchId, sign, fixedAmount) {
    const expectedSign = this.generateSign(merchantId, subMchId, fixedAmount);
    return sign === expectedSign;
  }
}

// ================================
// 商户二维码管理API路由
// ================================

// 为商户生成支付二维码
app.post('/api/v1/admin/merchants/:merchantId/qrcode', authenticateAdminJWT, async (req, res) => {
  let connection;
  try {
    const { merchantId } = req.params;
    const { fixedAmount, qrType = 'miniprogram' } = req.body;
    
    connection = await connectionPool.getConnection();
    
    // 1. 验证商户是否存在
    const [merchants] = await connection.execute(
      'SELECT * FROM merchants WHERE id = ? AND status = ?',
      [merchantId, 'active']
    );
    
    if (merchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在或已禁用'
      });
    }
    
    const merchant = merchants[0];
    
    // 2. 检查商户是否配置了特约商户号
    if (!merchant.sub_mch_id) {
      return res.status(400).json({
        success: false,
        message: '商户未配置微信支付特约商户号，请先完成配置'
      });
    }
    
    // 3. 生成二维码
    const qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
      merchantId,
      merchant.sub_mch_id,
      fixedAmount ? Math.round(fixedAmount * 100) : undefined
    );
    
    // 4. 返回二维码（Base64格式）
    const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64');
    
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
    });
    
  } catch (error) {
    console.error('生成商户二维码失败:', error);
    res.status(500).json({
      success: false,
      message: '二维码生成失败，请重试'
    });
  } finally {
    if (connection) connection.release();
  }
});

// 批量为多个商户生成二维码
app.post('/api/v1/admin/merchants/qrcode/batch', authenticateAdminJWT, async (req, res) => {
  let connection;
  try {
    const { merchantIds, qrType = 'miniprogram', fixedAmount } = req.body;
    
    if (!Array.isArray(merchantIds) || merchantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的商户ID列表'
      });
    }
    
    if (merchantIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: '单次最多支持50个商户'
      });
    }
    
    connection = await connectionPool.getConnection();
    
    // 获取商户信息
    const placeholders = merchantIds.map(() => '?').join(',');
    const [merchants] = await connection.execute(
      `SELECT * FROM merchants WHERE id IN (${placeholders}) AND status = 'active'`,
      merchantIds
    );
    
    const results = [];
    const errors = [];
    
    // 为每个商户生成二维码
    for (const merchant of merchants) {
      try {
        if (!merchant.sub_mch_id) {
          errors.push({
            merchantId: merchant.id,
            merchantName: merchant.merchant_name,
            error: '未配置特约商户号'
          });
          continue;
        }
        
        const qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
          merchant.id,
          merchant.sub_mch_id,
          fixedAmount ? Math.round(fixedAmount * 100) : undefined
        );
        
        const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64');
        
        results.push({
          merchantId: merchant.id,
          merchantName: merchant.merchant_name,
          qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
          qrCodeUrl: qrCodeResult.qrCodeUrl,
          expiresAt: qrCodeResult.expiresAt
        });
        
      } catch (error) {
        errors.push({
          merchantId: merchant.id,
          merchantName: merchant.merchant_name,
          error: error.message || '生成失败'
        });
      }
    }
    
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
    });
    
  } catch (error) {
    console.error('批量生成二维码失败:', error);
    res.status(500).json({
      success: false,
      message: '批量生成失败，请重试'
    });
  } finally {
    if (connection) connection.release();
  }
});

// 验证二维码有效性
app.post('/api/v1/admin/qrcode/verify', authenticateAdminJWT, async (req, res) => {
  let connection;
  try {
    const { merchantId, subMchId, sign, fixedAmount } = req.body;
    
    // 验证签名
    const isValid = MerchantQRCodeService.verifyQRCodeSign(
      merchantId,
      subMchId,
      sign,
      fixedAmount ? Math.round(fixedAmount * 100) : undefined
    );
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '二维码签名验证失败'
      });
    }
    
    connection = await connectionPool.getConnection();
    
    // 验证商户状态
    const [merchants] = await connection.execute(
      'SELECT * FROM merchants WHERE id = ? AND status = ?',
      [merchantId, 'active']
    );
    
    if (merchants.length === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在或已禁用'
      });
    }
    
    const merchant = merchants[0];
    
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
    });
    
  } catch (error) {
    console.error('验证二维码失败:', error);
    res.status(500).json({
      success: false,
      message: '验证失败，请重试'
    });
  } finally {
    if (connection) connection.release();
  }
});

// 更新商户特约商户号
app.put('/api/v1/admin/merchants/:id/sub-mch-id', authenticateAdminJWT, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { subMchId } = req.body;
    
    if (!subMchId) {
      return res.status(400).json({
        success: false,
        message: '特约商户号不能为空'
      });
    }
    
    connection = await connectionPool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE merchants SET sub_mch_id = ?, updated_at = NOW() WHERE id = ?',
      [subMchId, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '特约商户号更新成功'
    });
    
  } catch (error) {
    console.error('更新特约商户号失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请重试'
    });
  } finally {
    if (connection) connection.release();
  }
});

console.log('🔧 二维码生成功能已集成到API服务');
