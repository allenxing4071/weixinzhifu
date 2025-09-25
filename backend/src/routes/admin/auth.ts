// 管理员认证路由

import { Router } from 'express'
import { AdminAuthController, loginValidation, changePasswordValidation } from '../../controllers/admin/AdminAuthController'
import { verifyAdminToken, logAdminAction } from '../../middleware/admin/adminAuth'

const router = Router()

// 管理员登录
router.post('/login', 
  loginValidation,
  logAdminAction('admin_login'),
  AdminAuthController.login
)

// 获取当前管理员信息
router.get('/me', 
  verifyAdminToken,
  AdminAuthController.getCurrentAdmin
)

// 管理员登出
router.post('/logout', 
  verifyAdminToken,
  logAdminAction('admin_logout'),
  AdminAuthController.logout
)

// 修改密码
router.post('/change-password', 
  verifyAdminToken,
  changePasswordValidation,
  logAdminAction('admin_change_password'),
  AdminAuthController.changePassword
)

export default router
