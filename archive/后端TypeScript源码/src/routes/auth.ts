import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { validate, validationSchemas } from '../middleware/validation'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * 微信小程序登录
 * POST /api/v1/auth/wechat-login
 */
router.post('/wechat-login', 
  validate(validationSchemas.wechatLogin),
  AuthController.wechatLogin
)

/**
 * 获取用户信息
 * GET /api/v1/auth/user-info
 */
router.get('/user-info', 
  authMiddleware,
  AuthController.getUserInfo
)

/**
 * 更新用户信息
 * PUT /api/v1/auth/user-info
 */
router.put('/user-info', 
  authMiddleware,
  validate(validationSchemas.updateUserInfo),
  AuthController.updateUserInfo
)

export default router
