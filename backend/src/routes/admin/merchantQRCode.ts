import express from 'express'
import { MerchantQRCodeController } from '../../controllers/admin/MerchantQRCodeController'
import { authenticateAdminJWT } from '../../middleware/admin/adminAuth'
import { body, param, query } from 'express-validator'
import { validationResult } from '../../middleware/validation'

const router = express.Router()

/**
 * 所有商户二维码管理路由都需要管理员认证
 */
router.use(authenticateAdminJWT)

/**
 * 为商户生成支付二维码
 * POST /api/v1/admin/merchants/:merchantId/qrcode
 */
router.post(
  '/:merchantId/qrcode',
  [
    param('merchantId')
      .isString()
      .notEmpty()
      .withMessage('商户ID不能为空'),
    
    body('qrType')
      .optional()
      .isIn(['miniprogram', 'wechat_native'])
      .withMessage('二维码类型只能是 miniprogram 或 wechat_native'),
    
    body('fixedAmount')
      .optional()
      .isFloat({ min: 0.01, max: 10000 })
      .withMessage('固定金额必须在0.01-10000元之间'),
    
    validationResult
  ],
  MerchantQRCodeController.generateQRCode
)

/**
 * 获取商户二维码历史记录
 * GET /api/v1/admin/merchants/:merchantId/qrcode/history
 */
router.get(
  '/:merchantId/qrcode/history',
  [
    param('merchantId')
      .isString()
      .notEmpty()
      .withMessage('商户ID不能为空'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    
    validationResult
  ],
  MerchantQRCodeController.getQRCodeHistory
)

/**
 * 批量为多个商户生成二维码
 * POST /api/v1/admin/merchants/qrcode/batch
 */
router.post(
  '/qrcode/batch',
  [
    body('merchantIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('商户ID列表必须是数组，且包含1-50个元素'),
    
    body('merchantIds.*')
      .isString()
      .notEmpty()
      .withMessage('商户ID不能为空'),
    
    body('qrType')
      .optional()
      .isIn(['miniprogram', 'wechat_native'])
      .withMessage('二维码类型只能是 miniprogram 或 wechat_native'),
    
    body('fixedAmount')
      .optional()
      .isFloat({ min: 0.01, max: 10000 })
      .withMessage('固定金额必须在0.01-10000元之间'),
    
    validationResult
  ],
  MerchantQRCodeController.batchGenerateQRCode
)

/**
 * 验证二维码有效性
 * POST /api/v1/admin/qrcode/verify
 */
router.post(
  '/qrcode/verify',
  [
    body('merchantId')
      .isString()
      .notEmpty()
      .withMessage('商户ID不能为空'),
    
    body('subMchId')
      .isString()
      .notEmpty()
      .withMessage('特约商户号不能为空'),
    
    body('sign')
      .isString()
      .notEmpty()
      .withMessage('签名不能为空'),
    
    body('fixedAmount')
      .optional()
      .isFloat({ min: 0.01, max: 10000 })
      .withMessage('固定金额必须在0.01-10000元之间'),
    
    validationResult
  ],
  MerchantQRCodeController.verifyQRCode
)

export default router
