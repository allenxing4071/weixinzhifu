import { Router } from 'express'
import { PaymentController } from '../controllers/PaymentController'
import { validate, validationSchemas } from '../middleware/validation'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * 创建支付订单
 * POST /api/v1/payments
 */
router.post('/', 
  authMiddleware,
  validate(validationSchemas.createPaymentOrder),
  PaymentController.createOrder
)

/**
 * 微信支付回调
 * POST /api/v1/payments/callback
 */
router.post('/callback', 
  PaymentController.handlePaymentCallback
)

/**
 * 查询支付历史
 * GET /api/v1/payments/history
 */
router.get('/history', 
  authMiddleware,
  PaymentController.getPaymentHistory
)

/**
 * 查询订单状态
 * GET /api/v1/payments/:orderId
 */
router.get('/:orderId', 
  authMiddleware,
  PaymentController.getOrderStatus
)

export default router
