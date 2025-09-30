/**
 * 用户管理路由 - 后台管理
 * 提供完整的用户信息、消费记录、积分追踪功能
 */

import { Router } from 'express'
import { UserController } from '../../controllers/admin/UserController'

const router = Router()

/**
 * 用户管理相关路由
 */

// 获取用户列表（支持分页、筛选）
router.get('/', UserController.getUserList)

// 获取用户详细信息
router.get('/:userId', UserController.getUserDetail)

// 获取用户消费记录
router.get('/:userId/orders', UserController.getUserOrders)

// 获取用户积分记录
router.get('/:userId/points', UserController.getUserPoints)

// 获取用户统计信息
router.get('/:userId/statistics', UserController.getUserStatistics)

// 用户消费分析（按商户分组）
router.get('/:userId/merchant-analysis', UserController.getUserMerchantAnalysis)

// 获取所有用户统计概览
router.get('/overview/statistics', UserController.getUsersOverview)

export default router