import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

/**
 * 创建验证中间件
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body)
    
    if (error) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      })
      return
    }
    
    req.body = value
    next()
  }
}

/**
 * 验证Schema定义
 */
export const validationSchemas = {
  // 微信登录验证
  wechatLogin: Joi.object({
    code: Joi.string().required().messages({
      'string.empty': '微信授权码不能为空',
      'any.required': '微信授权码是必需的'
    }),
    userInfo: Joi.object({
      nickName: Joi.string().max(50),
      avatarUrl: Joi.string().uri()
    }).optional()
  }),
  
  // 创建支付订单验证
  createPaymentOrder: Joi.object({
    merchantId: Joi.string().required().messages({
      'string.empty': '商户ID不能为空',
      'any.required': '商户ID是必需的'
    }),
    amount: Joi.number().integer().min(1).max(100000000).required().messages({
      'number.base': '金额必须是数字',
      'number.integer': '金额必须是整数',
      'number.min': '金额不能小于0.01元',
      'number.max': '金额不能超过10万元',
      'any.required': '金额是必需的'
    }),
    description: Joi.string().max(128).optional().default('积分赠送支付')
  }),
  
  // 查询参数验证
  queryParams: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    pageSize: Joi.number().integer().min(1).max(100).optional().default(20),
    source: Joi.string().valid(
      'payment_reward', 
      'mall_consumption', 
      'admin_adjust', 
      'expired_deduct'
    ).optional()
  }),
  
  // 更新用户信息验证
  updateUserInfo: Joi.object({
    nickname: Joi.string().min(1).max(50).optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional().messages({
      'string.pattern.base': '手机号格式不正确'
    })
  }).min(1).messages({
    'object.min': '至少需要提供一个更新字段'
  }),
  
  // 商户创建验证
  createMerchant: Joi.object({
    merchantName: Joi.string().min(2).max(100).required().messages({
      'string.min': '商户名称至少2个字符',
      'string.max': '商户名称不能超过100个字符',
      'any.required': '商户名称是必需的'
    }),
    contactPerson: Joi.string().min(2).max(50).required().messages({
      'string.min': '联系人姓名至少2个字符',
      'string.max': '联系人姓名不能超过50个字符',
      'any.required': '联系人是必需的'
    }),
    contactPhone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({
      'string.pattern.base': '联系电话格式不正确',
      'any.required': '联系电话是必需的'
    }),
    businessLicense: Joi.string().min(15).max(20).required().messages({
      'string.min': '营业执照号码长度不正确',
      'string.max': '营业执照号码长度不正确',
      'any.required': '营业执照号码是必需的'
    })
  })
}

/**
 * 错误处理中间件
 */
export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error('API错误:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    body: req.body,
    user: req.user
  })
  
  // 生产环境不暴露详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(500).json({
    success: false,
    code: 'SERVER_ERROR',
    message: isDevelopment ? error.message : '服务器内部错误',
    ...(isDevelopment && { stack: error.stack })
  })
}

/**
 * 请求日志中间件
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })
  
  next()
}
