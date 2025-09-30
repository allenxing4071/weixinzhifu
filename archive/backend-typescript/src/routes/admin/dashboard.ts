// 仪表板路由

import { Router } from 'express'
import { DashboardController } from '../../controllers/admin/DashboardController'
import { verifyAdminToken } from '../../middleware/admin/adminAuth'

const router = Router()

// 所有仪表板路由都需要管理员认证
router.use(verifyAdminToken)

// 获取仪表板统计数据
router.get('/stats', DashboardController.getStats)

// 获取系统监控数据
router.get('/monitor', DashboardController.getMonitor)

// 获取待处理事项
router.get('/todos', DashboardController.getTodos)

export default router
