import express, { Request, Response } from 'express'
import { merchantController, merchantValidationRules } from '../../controllers/admin/MerchantController'

const router = express.Router()

/**
 * 商户管理路由 - 完整CRUD
 * 基础路径: /api/v1/admin/merchants
 * 所有路由都需要管理员认证
 */

// 应用管理员认证中间件
// TODO: 添加管理员认证中间件 (临时禁用用于测试)

/**
 * 获取商户统计信息
 * GET /api/v1/admin/merchants/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  await merchantController.getStats(req, res)
})

/**
 * 获取商户列表（支持筛选分页）
 * GET /api/v1/admin/merchants
 * 
 * 查询参数:
 * - page: 页码 (默认: 1)
 * - pageSize: 每页数量 (默认: 20)
 * - status: 状态筛选 (active/pending/inactive)
 * - keyword: 关键词搜索 (商户名/联系人/电话)
 * - merchantType: 商户类型 (INDIVIDUAL/ENTERPRISE)
 * - hasSubMchId: 是否有特约商户号 (true/false)
 */
router.get('/', async (req: Request, res: Response) => {
  await merchantController.list(req, res)
})

/**
 * 获取单个商户详情
 * GET /api/v1/admin/merchants/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  await merchantController.detail(req, res)
})

/**
 * 检查商户二维码生成资格
 * GET /api/v1/admin/merchants/:id/qr-eligibility
 */
router.get('/:id/qr-eligibility', async (req: Request, res: Response) => {
  await merchantController.checkQRCodeEligibility(req, res)
})

/**
 * 创建新商户
 * POST /api/v1/admin/merchants
 * 
 * 请求体字段:
 * - merchantName: 商户名称 (必填)
 * - contactPerson: 联系人姓名 (必填) 
 * - contactPhone: 联系电话 (必填)
 * - businessLicense: 营业执照号 (必填)
 * - contactEmail: 联系邮箱 (可选)
 * - merchantType: 商户类型 (可选, 默认: INDIVIDUAL)
 * - legalPerson: 法定代表人 (可选)
 * - businessCategory: 经营类目 (可选)
 * - applymentId: 微信申请单号 (可选)
 * - subMchId: 特约商户号 (可选)
 */
router.post('/', 
  merchantValidationRules.create,
  async (req: Request, res: Response) => {
    await merchantController.create(req, res)
  }
)

/**
 * 更新商户信息
 * PUT /api/v1/admin/merchants/:id
 * 
 * 请求体字段: (所有字段都是可选的)
 * - merchantName: 商户名称
 * - contactPerson: 联系人姓名
 * - contactPhone: 联系电话
 * - contactEmail: 联系邮箱
 * - businessLicense: 营业执照号
 * - merchantType: 商户类型
 * - legalPerson: 法定代表人
 * - businessCategory: 经营类目
 * - applymentId: 微信申请单号
 * - subMchId: 特约商户号
 * - status: 商户状态
 */
router.put('/:id',
  merchantValidationRules.update,
  async (req: Request, res: Response) => {
    await merchantController.update(req, res)
  }
)

/**
 * 删除商户（软删除，设置为inactive状态）
 * DELETE /api/v1/admin/merchants/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  await merchantController.delete(req, res)
})

export default router
