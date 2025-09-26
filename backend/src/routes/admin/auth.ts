/**
 * 管理员认证路由
 * 按照PRD登录系统要求实现
 */

import { Router } from 'express'
import { AdminAuthController, loginValidationRules, changePasswordValidationRules } from '../../controllers/admin/AdminAuthController'
import { authenticateAdminJWT } from '../../middleware/adminAuth'

const router = Router()

/**
 * 管理员登录
 * POST /api/v1/admin/auth/login
 */
router.post('/login', loginValidationRules, AdminAuthController.login)

/**
 * 刷新Token
 * POST /api/v1/admin/auth/refresh
 */
router.post('/refresh', AdminAuthController.refreshToken)

/**
 * 管理员登出
 * POST /api/v1/admin/auth/logout
 */
router.post('/logout', authenticateAdminJWT, AdminAuthController.logout)

/**
 * 获取当前管理员信息
 * GET /api/v1/admin/auth/me
 */
router.get('/me', authenticateAdminJWT, AdminAuthController.getCurrentAdmin)

/**
 * 修改密码
 * POST /api/v1/admin/auth/change-password
 */
router.post('/change-password', authenticateAdminJWT, changePasswordValidationRules, AdminAuthController.changePassword)

export default router