// 请求验证中间件
const { body, query, param, validationResult } = require('express-validator');

// 统一验证错误处理
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
}

// ==================== 登录验证 ====================
const validateLogin = [
  body('username')
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 }).withMessage('用户名长度应为3-50个字符'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
  handleValidationErrors
];

// ==================== 微信登录验证 ====================
const validateWechatLogin = [
  body('code')
    .notEmpty().withMessage('微信登录code不能为空')
    .isString().withMessage('code必须是字符串'),
  handleValidationErrors
];

// ==================== 分页验证 ====================
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须是大于0的整数')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
    .toInt(),
  handleValidationErrors
];

// ==================== 订单ID验证 ====================
const validateOrderId = [
  param('id')
    .notEmpty().withMessage('订单ID不能为空')
    .isString().withMessage('订单ID必须是字符串'),
  handleValidationErrors
];

// ==================== 创建支付订单验证 ====================
const validateCreatePayment = [
  body('merchantId')
    .notEmpty().withMessage('商户ID不能为空')
    .isString().withMessage('商户ID必须是字符串'),
  body('amount')
    .notEmpty().withMessage('金额不能为空')
    .isInt({ min: 1 }).withMessage('金额必须是大于0的整数')
    .toInt(),
  body('description')
    .optional()
    .isString().withMessage('描述必须是字符串')
    .isLength({ max: 200 }).withMessage('描述长度不能超过200个字符'),
  handleValidationErrors
];

// ==================== 模拟支付成功验证 ====================
const validateMockPayment = [
  body('orderId')
    .notEmpty().withMessage('订单ID不能为空')
    .isString().withMessage('订单ID必须是字符串'),
  handleValidationErrors
];

// ==================== 商户ID验证 ====================
const validateMerchantId = [
  param('id')
    .notEmpty().withMessage('商户ID不能为空')
    .isString().withMessage('商户ID必须是字符串'),
  handleValidationErrors
];

// ==================== 积分记录查询验证 ====================
const validatePointsHistory = [
  query('type')
    .optional()
    .isIn(['all', 'payment_reward', 'mall_consumption', 'admin_adjust'])
    .withMessage('积分类型无效'),
  ...validatePagination
];

// ==================== 支付记录查询验证 ====================
const validatePaymentHistory = [
  query('merchantId')
    .optional()
    .isString().withMessage('商户ID必须是字符串'),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'cancelled', 'refunded'])
    .withMessage('订单状态无效'),
  ...validatePagination
];

// ==================== 用户ID验证 ====================
const validateUserId = [
  param('id')
    .notEmpty().withMessage('用户ID不能为空')
    .isString().withMessage('用户ID必须是字符串'),
  handleValidationErrors
];

// ==================== 创建商户验证 ====================
const validateCreateMerchant = [
  body('merchantName')
    .notEmpty().withMessage('商户名称不能为空')
    .isLength({ min: 2, max: 200 }).withMessage('商户名称长度应为2-200个字符'),
  body('wechatMchId')
    .notEmpty().withMessage('微信商户号不能为空')
    .isString().withMessage('微信商户号必须是字符串'),
  body('businessCategory')
    .notEmpty().withMessage('经营类目不能为空')
    .isString().withMessage('经营类目必须是字符串'),
  body('contactPerson')
    .notEmpty().withMessage('联系人不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('联系人名称长度应为2-50个字符'),
  body('contactPhone')
    .notEmpty().withMessage('联系电话不能为空')
    .matches(/^1[3-9]\d{9}$/).withMessage('联系电话格式不正确'),
  handleValidationErrors
];

// ==================== 更新商户验证 ====================
const validateUpdateMerchant = [
  param('id')
    .notEmpty().withMessage('商户ID不能为空')
    .isString().withMessage('商户ID必须是字符串'),
  body('merchantName')
    .optional()
    .isLength({ min: 2, max: 200 }).withMessage('商户名称长度应为2-200个字符'),
  body('contactPerson')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('联系人名称长度应为2-50个字符'),
  body('contactPhone')
    .optional()
    .matches(/^1[3-9]\d{9}$/).withMessage('联系电话格式不正确'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended']).withMessage('商户状态无效'),
  handleValidationErrors
];

// ==================== 调整积分验证 ====================
const validateAdjustPoints = [
  param('id')
    .notEmpty().withMessage('用户ID不能为空')
    .isString().withMessage('用户ID必须是字符串'),
  body('points')
    .notEmpty().withMessage('积分数不能为空')
    .isInt().withMessage('积分数必须是整数')
    .toInt(),
  body('reason')
    .notEmpty().withMessage('调整原因不能为空')
    .isLength({ min: 2, max: 200 }).withMessage('调整原因长度应为2-200个字符'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateWechatLogin,
  validatePagination,
  validateOrderId,
  validateCreatePayment,
  validateMockPayment,
  validateMerchantId,
  validatePointsHistory,
  validatePaymentHistory,
  validateUserId,
  validateCreateMerchant,
  validateUpdateMerchant,
  validateAdjustPoints
};
