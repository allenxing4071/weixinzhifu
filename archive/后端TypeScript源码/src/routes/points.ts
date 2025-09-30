import { Router } from 'express'
import { PointsController } from '../controllers/PointsController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * 获取用户积分余额
 * GET /api/v1/points/balance
 */
router.get('/balance', 
  authMiddleware,
  PointsController.getPointsBalance
)

/**
 * 获取积分记录
 * GET /api/v1/points/history
 */
router.get('/history', 
  authMiddleware,
  PointsController.getPointsHistory
)

/**
 * 获取积分统计（管理端使用）
 * GET /api/v1/points/statistics
 */
router.get('/statistics', 
  // 这里可以加上管理员权限验证
  PointsController.getPointsStatistics
)

export default router
