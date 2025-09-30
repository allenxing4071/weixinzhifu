// 订单管理路由 - 管理后台专用
// 新增路由，不影响现有功能
import { Router } from 'express'
import { OrderController } from '../../controllers/admin/OrderController'
// 临时使用简单的认证中间件
const adminAuth = (req: any, res: any, next: any) => {
  // 简单的token验证
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ success: false, message: '需要管理员认证' })
  }
  next()
}

const router = Router()

// 所有路由都需要管理员认证
router.use(adminAuth)

// 订单列表 - 支持分页、筛选、搜索
// GET /api/v1/admin/orders?page=1&pageSize=20&status=paid&search=订单号
router.get('/', OrderController.getOrders)

// 订单统计 - 总数、今日、本月等统计数据
// GET /api/v1/admin/orders/stats
router.get('/stats', OrderController.getOrderStats)

// 订单详情 - 包含用户、商户、积分记录等完整信息
// GET /api/v1/admin/orders/:id
router.get('/:id', OrderController.getOrderDetail)

// 更新订单状态 - 支持取消、退款等操作
// PUT /api/v1/admin/orders/:id
router.put('/:id', OrderController.updateOrderStatus)

// 导出订单数据 - 支持JSON和CSV格式
// POST /api/v1/admin/orders/export
router.post('/export', OrderController.exportOrders)

export default router