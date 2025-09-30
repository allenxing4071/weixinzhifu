# 商户管理API接口文档（实施版）

## 📖 文档信息
- **版本**：V1.0
- **状态**：基于现有功能扩展

---

## 🎯 API设计原则（务实版）

### 核心要求
1. **基于现有字段**：扩展当前商户表，不破坏现有功能
2. **快速上线**：先实现基础CRUD，后续优化
3. **二维码生成**：基于现有`sub_mch_id`实现
4. **简单权限**：基础的管理员认证
5. **基础日志**：记录关键操作

---

## 🔧 API接口设计

### 1. 商户增删改查接口

#### 1.1 创建商户
```http
POST /api/v1/admin/merchants
```

**请求参数**：
```typescript
interface CreateMerchantRequest {
  // === 基础必填信息 ===
  merchantName: string;              // 商户名称（必填）
  contactName: string;               // 联系人姓名（必填）
  mobilePhone: string;               // 联系人手机（必填）
  businessLicenseNumber: string;     // 营业执照号（必填）
  
  // === 可选基础信息 ===
  merchantShortname?: string;        // 商户简称
  merchantType?: 'ENTERPRISE' | 'INDIVIDUAL' | 'GOVERNMENT' | 'OTHERS';
  contactEmail?: string;             // 联系邮箱
  businessAddress?: string;          // 经营地址
  businessScope?: string;            // 经营范围
  
  // === 微信相关（如果已有） ===
  applymentId?: string;              // 微信申请单号
  subMchId?: string;                 // 微信特约商户号
  
  // === 法人和证件信息 ===
  legalPerson?: string;              // 法人姓名
  contactIdNumber?: string;          // 联系人身份证号
  businessLicenseValidDate?: string; // 营业执照有效期 (YYYY-MM-DD)
  
  // === 银行账户信息 ===
  bankAccountType?: 'BANK_ACCOUNT_TYPE_CORPORATE' | 'BANK_ACCOUNT_TYPE_PERSONAL';
  accountName?: string;              // 开户名称
  accountNumber?: string;            // 银行账号
  accountBank?: string;              // 开户银行
  bankAddressCode?: string;          // 开户银行编码
  
  // === 补充信息 ===
  businessAdditionMsg?: string;      // 补充说明
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "merchant_1703123456789_abc123def",
    "merchantNo": "M03123456",
    "merchantName": "成都市中鑫博海国际酒业贸易有限公司",
    "status": "pending",
    "createdAt": "2024-12-21T10:30:45.000Z",
    "message": "商户创建成功，等待审核"
  }
}
```

#### 1.2 获取商户详情
```http
GET /api/v1/admin/merchants/{merchantId}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "merchant_1703123456789_abc123def",
    "merchantNo": "M03123456",
    "merchantName": "成都市中鑫博海国际酒业贸易有限公司",
    "merchantShortname": "中鑫博海",
    "merchantType": "ENTERPRISE",
    "contactName": "邢海龙",
    "mobilePhone": "13800138004",
    "contactEmail": "admin@example.com",
    "businessLicenseNumber": "91512345MA6CXXX004",
    "businessAddress": "成都市高新区",
    "applymentId": "2000002690164951",
    "subMchId": "1727774152",
    "wechatApplymentState": "APPLYMENT_STATE_FINISHED",
    "qrCodeUrl": "https://example.com/qrcode/merchant_xxx.png",
    "qrCodeGeneratedAt": "2024-12-21T10:35:20.000Z",
    "qrCodeExpiredAt": "2024-12-21T12:35:20.000Z",
    "totalAmount": 15680.50,
    "totalOrders": 128,
    "totalPointsAwarded": 15681,
    "status": "active",
    "createdAt": "2024-12-21T10:30:45.000Z",
    "updatedAt": "2024-12-21T10:35:20.000Z",
    "canGenerateQRCode": true,
    "qrCodeEligibility": {
      "eligible": true,
      "message": "商户信息完整，可以生成收款二维码"
    }
  }
}
```

#### 1.3 更新商户信息
```http
PUT /api/v1/admin/merchants/{merchantId}
```

**请求参数**：
```typescript
interface UpdateMerchantRequest {
  // 基础信息更新
  merchantName?: string;
  merchantShortname?: string;
  contactName?: string;
  mobilePhone?: string;
  contactEmail?: string;
  businessAddress?: string;
  businessScope?: string;
  businessAdditionMsg?: string;
  
  // 法人和证件信息
  legalPerson?: string;
  contactIdNumber?: string;
  businessLicenseValidDate?: string;
  
  // 银行信息
  bankAccountType?: string;
  accountName?: string;
  accountNumber?: string;
  accountBank?: string;
  bankAddressCode?: string;
  
  // 微信相关（谨慎更新）
  applymentId?: string;
  subMchId?: string;
  wechatApplymentState?: string;
  
  // 状态管理（仅管理员）
  status?: 'approved' | 'rejected' | 'active' | 'inactive';
  reviewComment?: string;
}
```

#### 1.4 删除商户（软删除）
```http
DELETE /api/v1/admin/merchants/{merchantId}
```

**请求参数**：
```json
{
  "reason": "商户主动注销",
  "force": false
}
```

#### 1.5 获取商户列表
```http
GET /api/v1/admin/merchants
```

**查询参数**：
```typescript
interface GetMerchantsQuery {
  page?: number;                     // 页码，默认1
  pageSize?: number;                 // 每页数量，默认20
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  keyword?: string;                  // 关键词搜索（商户名、联系人、手机号）
  merchantType?: 'ENTERPRISE' | 'INDIVIDUAL' | 'GOVERNMENT' | 'OTHERS';
  hasSubMchId?: boolean;             // 是否有微信特约商户号
  hasQRCode?: boolean;               // 是否已生成二维码
  sortBy?: 'createdAt' | 'totalAmount' | 'totalOrders' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "merchants": [
      {
        "id": "merchant_1703123456789_abc123def",
        "merchantNo": "M03123456",
        "merchantName": "成都市中鑫博海国际酒业贸易有限公司",
        "contactName": "邢海龙",
        "mobilePhone": "13800138004",
        "subMchId": "1727774152",
        "status": "active",
        "totalAmount": 15680.50,
        "totalOrders": 128,
        "hasQRCode": true,
        "createdAt": "2024-12-21T10:30:45.000Z"
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "pageSize": 20,
      "totalPages": 8
    }
  }
}
```

### 2. 商户二维码管理接口

#### 2.1 检查二维码生成资格
```http
GET /api/v1/admin/merchants/{merchantId}/qrcode/eligibility
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "message": "商户信息完整，可以生成收款二维码",
    "missingFields": [],
    "checks": {
      "hasSubMchId": true,
      "statusActive": true,
      "hasRequiredFields": true,
      "wechatApproved": true
    }
  }
}
```

#### 2.2 生成商户收款二维码
```http
POST /api/v1/admin/merchants/{merchantId}/qrcode
```

**请求参数**：
```json
{
  "amount": 0,                       // 固定金额（0表示不限金额）
  "description": "商户收款",          // 支付描述
  "expireMinutes": 120               // 过期时间（分钟）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "https://example.com/qrcode/merchant_xxx.png",
    "qrCodeContent": "weixin://wxpay/bizpayurl?pr=abc123def",
    "expiredAt": "2024-12-21T12:35:20.000Z",
    "generatedAt": "2024-12-21T10:35:20.000Z"
  },
  "message": "二维码生成成功"
}
```

#### 2.3 获取商户二维码信息
```http
GET /api/v1/admin/merchants/{merchantId}/qrcode
```

### 3. 商户审核管理接口

#### 3.1 提交商户审核
```http
POST /api/v1/admin/merchants/{merchantId}/submit-review
```

#### 3.2 审核商户申请
```http
POST /api/v1/admin/merchants/{merchantId}/review
```

**请求参数**：
```json
{
  "action": "approve",               // approve | reject
  "comment": "资质齐全，审核通过",
  "updateStatus": "active"           // 审核通过后的状态
}
```

#### 3.3 同步微信审核状态
```http
POST /api/v1/admin/merchants/{merchantId}/sync-wechat-status
```

### 4. 商户文件管理接口

#### 4.1 上传商户资质文件
```http
POST /api/v1/admin/merchants/{merchantId}/files
```

**请求参数**（multipart/form-data）：
```
file: [File]                       // 文件
fileType: string                   // business_license | id_card_front | id_card_back | bank_account | other
description: string                // 文件描述
```

#### 4.2 获取商户文件列表
```http
GET /api/v1/admin/merchants/{merchantId}/files
```

#### 4.3 删除商户文件
```http
DELETE /api/v1/admin/merchants/{merchantId}/files/{fileId}
```

### 5. 商户统计分析接口

#### 5.1 获取商户统计概览
```http
GET /api/v1/admin/merchants/statistics/overview
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalMerchants": 156,
    "activeMerchants": 89,
    "pendingMerchants": 12,
    "withQRCodeMerchants": 76,
    "totalAmount": 2567890.50,
    "totalOrders": 15680,
    "totalPointsAwarded": 2567891,
    "trends": {
      "merchantGrowth": "+12.5%",
      "amountGrowth": "+8.7%",
      "ordersGrowth": "+15.2%"
    }
  }
}
```

#### 5.2 获取商户详细统计
```http
GET /api/v1/admin/merchants/{merchantId}/statistics
```

#### 5.3 商户排行榜
```http
GET /api/v1/admin/merchants/rankings
```

**查询参数**：
```typescript
interface RankingsQuery {
  rankBy: 'amount' | 'orders' | 'points';
  timeRange: 'today' | 'week' | 'month' | 'quarter' | 'year';
  limit?: number;                    // 默认10
}
```

---

## 🔒 权限控制

### 角色权限矩阵

| 操作 | 超级管理员 | 运营管理员 | 商户管理员 | 财务管理员 |
|------|-----------|-----------|-----------|-----------|
| 创建商户 | ✅ | ✅ | ❌ | ❌ |
| 查看商户列表 | ✅ | ✅ | 自己 | ✅ |
| 查看商户详情 | ✅ | ✅ | 自己 | ✅ |
| 更新商户信息 | ✅ | ✅ | 自己（部分） | ❌ |
| 删除商户 | ✅ | ❌ | ❌ | ❌ |
| 审核商户 | ✅ | ✅ | ❌ | ❌ |
| 生成二维码 | ✅ | ✅ | 自己 | ❌ |
| 查看统计 | ✅ | ✅ | 自己 | ✅ |
| 文件管理 | ✅ | ✅ | 自己 | ❌ |

### 权限验证中间件

```typescript
// 商户权限验证
export const merchantPermissionMiddleware = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const merchantId = req.params.merchantId;
    const userId = req.user.id;
    
    switch (action) {
      case 'create':
        if (!['super_admin', 'operation_admin'].includes(userRole)) {
          return res.status(403).json({
            success: false,
            message: '无权限创建商户'
          });
        }
        break;
        
      case 'view':
        if (userRole === 'merchant_admin') {
          // 商户管理员只能查看自己的商户
          const merchant = await MerchantModel.findById(merchantId);
          if (merchant?.ownerId !== userId) {
            return res.status(403).json({
              success: false,
              message: '无权限查看该商户信息'
            });
          }
        }
        break;
        
      case 'update':
        if (userRole === 'merchant_admin') {
          // 商户管理员只能更新部分字段
          const allowedFields = ['contactEmail', 'businessAddress', 'businessScope'];
          const updateFields = Object.keys(req.body);
          const hasRestrictedFields = updateFields.some(field => !allowedFields.includes(field));
          
          if (hasRestrictedFields) {
            return res.status(403).json({
              success: false,
              message: '无权限更新该字段'
            });
          }
        }
        break;
        
      case 'delete':
        if (userRole !== 'super_admin') {
          return res.status(403).json({
            success: false,
            message: '无权限删除商户'
          });
        }
        break;
    }
    
    next();
  };
};
```

---

## 🔍 数据验证

### 输入验证规则

```typescript
export const merchantValidationSchemas = {
  // 创建商户验证
  createMerchant: Joi.object({
    merchantName: Joi.string().min(2).max(128).required(),
    contactName: Joi.string().min(1).max(64).required(),
    mobilePhone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
    businessLicenseNumber: Joi.string().min(8).max(64).required(),
    merchantShortname: Joi.string().max(64).optional(),
    merchantType: Joi.string().valid('ENTERPRISE', 'INDIVIDUAL', 'GOVERNMENT', 'OTHERS').optional(),
    contactEmail: Joi.string().email().optional(),
    businessAddress: Joi.string().max(256).optional(),
    applymentId: Joi.string().max(64).optional(),
    subMchId: Joi.string().max(32).optional()
  }),
  
  // 更新商户验证
  updateMerchant: Joi.object({
    merchantName: Joi.string().min(2).max(128).optional(),
    contactName: Joi.string().min(1).max(64).optional(),
    mobilePhone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    contactEmail: Joi.string().email().allow('').optional(),
    businessAddress: Joi.string().max(256).allow('').optional(),
    status: Joi.string().valid('approved', 'rejected', 'active', 'inactive').optional(),
    reviewComment: Joi.string().max(500).optional()
  }).min(1),
  
  // 查询参数验证
  getMerchants: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    pageSize: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected', 'active', 'inactive').optional(),
    keyword: Joi.string().max(100).optional(),
    merchantType: Joi.string().valid('ENTERPRISE', 'INDIVIDUAL', 'GOVERNMENT', 'OTHERS').optional(),
    hasSubMchId: Joi.boolean().optional(),
    hasQRCode: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'totalAmount', 'totalOrders', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }),
  
  // 二维码生成验证
  generateQRCode: Joi.object({
    amount: Joi.number().integer().min(0).max(100000000).optional(),
    description: Joi.string().max(128).optional(),
    expireMinutes: Joi.number().integer().min(5).max(1440).optional()
  })
};
```

---

## 🚨 错误处理

### 标准错误响应

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;                    // 错误代码
    message: string;                 // 错误消息
    details?: any;                   // 详细信息
  };
  requestId: string;                 // 请求ID
}
```

### 错误代码定义

```typescript
export const MerchantErrorCodes = {
  // 通用错误
  MERCHANT_NOT_FOUND: 'MERCHANT_NOT_FOUND',
  MERCHANT_ALREADY_EXISTS: 'MERCHANT_ALREADY_EXISTS',
  INVALID_MERCHANT_DATA: 'INVALID_MERCHANT_DATA',
  
  // 权限错误
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_PRIVILEGES: 'INSUFFICIENT_PRIVILEGES',
  
  // 状态错误
  INVALID_MERCHANT_STATUS: 'INVALID_MERCHANT_STATUS',
  MERCHANT_NOT_ACTIVE: 'MERCHANT_NOT_ACTIVE',
  MERCHANT_ALREADY_REVIEWED: 'MERCHANT_ALREADY_REVIEWED',
  
  // 微信相关错误
  MISSING_SUB_MCH_ID: 'MISSING_SUB_MCH_ID',
  INVALID_WECHAT_CONFIG: 'INVALID_WECHAT_CONFIG',
  WECHAT_API_ERROR: 'WECHAT_API_ERROR',
  
  // 二维码相关错误
  QRCODE_GENERATION_FAILED: 'QRCODE_GENERATION_FAILED',
  QRCODE_NOT_ELIGIBLE: 'QRCODE_NOT_ELIGIBLE',
  QRCODE_EXPIRED: 'QRCODE_EXPIRED',
  
  // 文件相关错误
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED'
};
```

---

## 📝 操作日志

### 操作日志记录

```typescript
interface MerchantOperationLog {
  id: string;
  merchantId: string;
  operatorId: string;
  operatorType: 'admin' | 'system' | 'merchant';
  operation: string;                 // create | update | delete | review | generate_qrcode
  oldData?: any;                     // 操作前数据
  newData?: any;                     // 操作后数据
  clientIP: string;
  userAgent: string;
  result: 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
}

// 记录操作日志的中间件
export const logMerchantOperation = (operation: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // 记录操作日志
      MerchantOperationLogModel.create({
        merchantId: req.params.merchantId,
        operatorId: req.user.id,
        operatorType: req.user.type,
        operation,
        newData: req.body,
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        result: res.statusCode < 400 ? 'success' : 'failed',
        errorMessage: res.statusCode >= 400 ? data : undefined
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
```

---

## 📊 性能要求

### 响应时间要求
- 获取商户列表：≤ 500ms
- 获取商户详情：≤ 300ms
- 创建/更新商户：≤ 1s
- 生成二维码：≤ 3s
- 文件上传：≤ 10s

### 并发要求
- 支持100个管理员同时操作
- 支持1000个商户同时生成二维码
- 数据库连接池：50个连接

### 缓存策略
- 商户详情缓存：5分钟
- 商户列表缓存：1分钟
- 二维码缓存：直到过期

---

**文档状态**：待技术评审  
**下一步行动**：实现API接口和数据库操作  
**责任人**：后端开发团队  
**预计完成时间**：2周内
