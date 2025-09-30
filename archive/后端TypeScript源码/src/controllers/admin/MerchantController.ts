import { Request, Response } from 'express'
import { MerchantModel, CreateMerchantData, UpdateMerchantData } from '../../models/Merchant'
import { body, validationResult } from 'express-validator'

/**
 * 商户管理控制器 - 完整CRUD功能
 * 符合微信支付标准要求
 */
export class MerchantController {

  /**
   * 获取商户列表（支持筛选分页）
   * GET /api/v1/admin/merchants
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        keyword,
        merchantType,
        hasSubMchId
      } = req.query

      console.log('📋 商户列表查询参数:', {
        page: Number(page),
        pageSize: Number(pageSize),
        status,
        keyword,
        merchantType,
        hasSubMchId: hasSubMchId === 'true' ? true : hasSubMchId === 'false' ? false : undefined
      })

      const result = await MerchantModel.findAll({
        page: Number(page),
        pageSize: Number(pageSize),
        status: status as string,
        keyword: keyword as string,
        merchantType: merchantType as string,
        hasSubMchId: hasSubMchId === 'true' ? true : hasSubMchId === 'false' ? false : undefined
      })

      res.json({
        success: true,
        data: {
          merchants: result.merchants,
          pagination: {
            current: Number(page),
            pageSize: Number(pageSize),
            total: result.total,
            totalPages: Math.ceil(result.total / Number(pageSize))
          }
        },
        message: `成功获取${result.merchants.length}个商户信息`
      })
      
      console.log(`✅ 返回${result.merchants.length}个商户，共${result.total}个`)

    } catch (error: any) {
      console.error('❌ 获取商户列表失败:', error)
      res.status(500).json({
        success: false,
        message: `获取商户列表失败: ${error.message}`,
        error_type: 'server_error'
      })
    }
  }

  /**
   * 获取单个商户详情
   * GET /api/v1/admin/merchants/:id
   */
  async detail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const merchant = await MerchantModel.findById(id)
      
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: '商户不存在',
          error_type: 'not_found'
        })
        return
      }

      // 检查二维码生成资格
      const qrEligibility = await MerchantModel.checkQRCodeEligibility(id)

      res.json({
        success: true,
        data: {
          merchant,
          qrCodeEligibility: qrEligibility
        },
        message: '获取商户详情成功'
      })

      console.log(`✅ 获取商户详情: ${merchant.merchantName}`)

    } catch (error: any) {
      console.error('❌ 获取商户详情失败:', error)
      res.status(500).json({
        success: false,
        message: `获取商户详情失败: ${error.message}`,
        error_type: 'server_error'
      })
    }
  }

  /**
   * 创建新商户
   * POST /api/v1/admin/merchants
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      // 验证请求数据
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '请求参数验证失败',
          errors: errors.array(),
          error_type: 'validation_error'
        })
        return
      }

      const merchantData: CreateMerchantData = req.body

      console.log('🆕 创建新商户:', {
        merchantName: merchantData.merchantName,
        merchantType: merchantData.merchantType,
        contactPerson: merchantData.contactPerson
      })

      // 检查是否存在重复的营业执照号或申请单号
      if (merchantData.applymentId) {
        const existingByApplyment = await MerchantModel.findByApplymentId(merchantData.applymentId)
        if (existingByApplyment) {
          res.status(400).json({
            success: false,
            message: '该微信申请单号已存在',
            error_type: 'duplicate_applyment_id'
          })
          return
        }
      }

      const newMerchant = await MerchantModel.create(merchantData)

      res.status(201).json({
        success: true,
        data: { merchant: newMerchant },
        message: `商户 ${newMerchant.merchantName} 创建成功`
      })

      console.log(`✅ 商户创建成功: ${newMerchant.merchantName} (${newMerchant.id})`)

    } catch (error: any) {
      console.error('❌ 创建商户失败:', error)
      res.status(500).json({
        success: false,
        message: `创建商户失败: ${error.message}`,
        error_type: 'server_error'
      })
    }
  }

  /**
   * 更新商户信息
   * PUT /api/v1/admin/merchants/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const updateData: UpdateMerchantData = req.body

      // 验证请求数据
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '请求参数验证失败',
          errors: errors.array(),
          error_type: 'validation_error'
        })
        return
      }

      // 检查商户是否存在
      const existingMerchant = await MerchantModel.findById(id)
      if (!existingMerchant) {
        res.status(404).json({
          success: false,
          message: '商户不存在',
          error_type: 'not_found'
        })
        return
      }

      console.log('📝 更新商户信息:', {
        merchantId: id,
        merchantName: existingMerchant.merchantName,
        updateFields: Object.keys(updateData)
      })

      // 检查申请单号重复（如果要更新申请单号）
      if (updateData.applymentId && updateData.applymentId !== existingMerchant.applymentId) {
        const duplicateByApplyment = await MerchantModel.findByApplymentId(updateData.applymentId)
        if (duplicateByApplyment && duplicateByApplyment.id !== id) {
          res.status(400).json({
            success: false,
            message: '该微信申请单号已被其他商户使用',
            error_type: 'duplicate_applyment_id'
          })
          return
        }
      }

      const updateSuccess = await MerchantModel.update(id, updateData)

      if (updateSuccess) {
        const updatedMerchant = await MerchantModel.findById(id)
        res.json({
          success: true,
          data: { merchant: updatedMerchant },
          message: '商户信息更新成功'
        })
        console.log(`✅ 商户更新成功: ${existingMerchant.merchantName}`)
      } else {
        res.status(400).json({
          success: false,
          message: '没有可更新的内容或更新失败',
          error_type: 'update_failed'
        })
      }

    } catch (error: any) {
      console.error('❌ 更新商户失败:', error)
      res.status(500).json({
        success: false,
        message: `更新商户失败: ${error.message}`,
        error_type: 'server_error'
      })
    }
  }

  /**
   * 删除商户（软删除）
   * DELETE /api/v1/admin/merchants/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      // 检查商户是否存在
      const existingMerchant = await MerchantModel.findById(id)
      if (!existingMerchant) {
        res.status(404).json({
          success: false,
          message: '商户不存在',
          error_type: 'not_found'
        })
        return
      }

      console.log('🗑️ 删除商户:', {
        merchantId: id,
        merchantName: existingMerchant.merchantName
      })

      const deleteSuccess = await MerchantModel.delete(id)

      if (deleteSuccess) {
        res.json({
          success: true,
          message: `商户 ${existingMerchant.merchantName} 已停用`
        })
        console.log(`✅ 商户已停用: ${existingMerchant.merchantName}`)
      } else {
        res.status(400).json({
          success: false,
          message: '删除失败',
          error_type: 'delete_failed'
        })
      }

    } catch (error: any) {
      console.error('❌ 删除商户失败:', error)
      res.status(500).json({
        success: false,
        message: `删除商户失败: ${error.message}`,
        error_type: 'server_error'
      })
    }
  }

  /**
   * 检查商户二维码生成资格
   * GET /api/v1/admin/merchants/:id/qr-eligibility
   */
  async checkQRCodeEligibility(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const eligibility = await MerchantModel.checkQRCodeEligibility(id)

      res.json({
        success: true,
        data: eligibility,
        message: eligibility.eligible ? '商户符合二维码生成条件' : '商户不符合二维码生成条件'
      })

    } catch (error: any) {
      console.error('❌ 检查二维码资格失败:', error)
      res.status(500).json({
        success: false,
        message: `检查失败: ${error.message}`,
        error_type: 'server_error'
      })
    }
  }

  /**
   * 商户统计信息
   * GET /api/v1/admin/merchants/stats
   */
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      // 获取各种状态的商户数量
      const [active, pending, inactive, hasSubMchId] = await Promise.all([
        MerchantModel.findAll({ status: 'active' }),
        MerchantModel.findAll({ status: 'pending' }),
        MerchantModel.findAll({ status: 'inactive' }),
        MerchantModel.findAll({ hasSubMchId: true })
      ])

      const stats = {
        total: active.total + pending.total + inactive.total,
        active: active.total,
        pending: pending.total,
        inactive: inactive.total,
        hasSubMchId: hasSubMchId.total,
        canGenerateQRCode: hasSubMchId.total // 简化统计，实际应该进一步检查
      }

      res.json({
        success: true,
        data: stats,
        message: '获取商户统计成功'
      })

      console.log('📊 商户统计:', stats)

    } catch (error: any) {
      console.error('❌ 获取商户统计失败:', error)
      res.status(500).json({
        success: false,
        message: `获取统计失败: ${error.message}`,
        error_type: 'server_error'
      })
    }
  }
}

/**
 * 数据验证规则
 */
export const merchantValidationRules = {
  create: [
    body('merchantName')
      .notEmpty()
      .withMessage('商户名称不能为空')
      .isLength({ max: 128 })
      .withMessage('商户名称不能超过128个字符'),
    
    body('contactPerson')
      .notEmpty()
      .withMessage('联系人姓名不能为空')
      .isLength({ max: 64 })
      .withMessage('联系人姓名不能超过64个字符'),
    
    body('contactPhone')
      .notEmpty()
      .withMessage('联系电话不能为空')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    
    body('businessLicense')
      .notEmpty()
      .withMessage('营业执照号不能为空')
      .isLength({ max: 64 })
      .withMessage('营业执照号不能超过64个字符'),
    
    body('contactEmail')
      .optional()
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    
    body('merchantType')
      .optional()
      .isIn(['INDIVIDUAL', 'ENTERPRISE'])
      .withMessage('商户类型必须是 INDIVIDUAL 或 ENTERPRISE'),
    
    body('applymentId')
      .optional()
      .isLength({ max: 64 })
      .withMessage('申请单号不能超过64个字符'),
    
    body('subMchId')
      .optional()
      .isLength({ max: 32 })
      .withMessage('特约商户号不能超过32个字符')
  ],

  update: [
    body('merchantName')
      .optional()
      .notEmpty()
      .withMessage('商户名称不能为空')
      .isLength({ max: 128 })
      .withMessage('商户名称不能超过128个字符'),
    
    body('contactPerson')
      .optional()
      .notEmpty()
      .withMessage('联系人姓名不能为空')
      .isLength({ max: 64 })
      .withMessage('联系人姓名不能超过64个字符'),
    
    body('contactPhone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    
    body('contactEmail')
      .optional()
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'pending'])
      .withMessage('状态值无效'),
    
    body('merchantType')
      .optional()
      .isIn(['INDIVIDUAL', 'ENTERPRISE'])
      .withMessage('商户类型必须是 INDIVIDUAL 或 ENTERPRISE')
  ]
}

// 导出控制器实例
export const merchantController = new MerchantController()
