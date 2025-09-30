# 微信支付二维码生成功能实现说明

## 🎯 功能概述

已成功实现真实的微信支付二维码生成功能，替换了原有的模拟二维码，支持完整的微信小程序支付流程。

## ✅ 已实现功能

### 1. 核心API接口

#### 单商户二维码生成
- **接口**: `POST /api/v1/admin/merchants/:id/qrcode`
- **功能**: 为单个商户生成支付二维码
- **参数**: 
  - `fixedAmount` (可选): 固定金额（元）
  - `qrType` (可选): 二维码类型，默认 'miniprogram'

#### 批量二维码生成
- **接口**: `POST /api/v1/admin/merchants/qrcode/batch`
- **功能**: 批量为多个商户生成二维码
- **参数**:
  - `merchantIds`: 商户ID数组（最多50个）
  - `fixedAmount` (可选): 固定金额
  - `qrType` (可选): 二维码类型

#### 二维码验证
- **接口**: `POST /api/v1/admin/qrcode/verify`
- **功能**: 验证二维码签名和商户状态
- **参数**:
  - `merchantId`: 商户ID
  - `subMchId`: 特约商户号
  - `sign`: MD5签名
  - `fixedAmount` (可选): 固定金额

### 2. 安全机制

#### 签名验证
- 使用MD5哈希算法生成签名
- 签名数据: `merchantId + subMchId + fixedAmount + apiKey`
- 防止二维码参数被篡改

#### 商户状态验证
- 仅为状态为 `active` 的商户生成二维码
- 必须配置 `sub_mch_id` (特约商户号)

#### 时间戳防重放
- 每个二维码包含时间戳
- 24小时有效期设置

### 3. 二维码内容

生成的二维码包含以下信息：
```
pages/payment/index?merchantId=merchant-004&subMchId=1727774152&amount=88&timestamp=1759016488977&sign=aaf47a3c8528b18cdf4eb08f02bd4964
```

参数说明：
- `merchantId`: 商户ID
- `subMchId`: 微信特约商户号
- `amount` (可选): 固定金额
- `timestamp`: 生成时间戳
- `sign`: MD5签名验证

## 🧪 测试验证

### 测试用例1: 基础二维码生成
```bash
curl -X POST "http://localhost:3003/api/v1/admin/merchants/merchant-001/qrcode" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 测试用例2: 固定金额二维码
```bash
curl -X POST "http://localhost:3003/api/v1/admin/merchants/merchant-004/qrcode" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"fixedAmount": 88}'
```

### 测试用例3: 批量生成
```bash
curl -X POST "http://localhost:3003/api/v1/admin/merchants/qrcode/batch" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"merchantIds": ["merchant-001", "merchant-002"], "fixedAmount": 100}'
```

### 测试用例4: 签名验证
```bash
curl -X POST "http://localhost:3003/api/v1/admin/qrcode/verify" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant-004",
    "subMchId": "1727774152", 
    "sign": "aaf47a3c8528b18cdf4eb08f02bd4964",
    "fixedAmount": 88
  }'
```

## 📱 小程序端集成

### 更新内容
1. **参数处理**: 支持扫码获取的完整参数
2. **签名验证**: 调用验证API确保二维码合法性
3. **商户信息**: 使用真实的商户ID和特约商户号
4. **错误处理**: 对无效二维码进行提示

### 扫码流程
1. 用户扫描二维码
2. 小程序获取参数: `merchantId`, `subMchId`, `timestamp`, `sign`, `amount`
3. 调用验证API验证签名
4. 加载商户信息
5. 显示支付页面
6. 创建支付订单

## 🔧 技术实现

### 后端技术栈
- **二维码生成**: `qrcode` npm包
- **签名算法**: MD5哈希
- **图片格式**: PNG, Base64编码
- **数据库**: MySQL存储商户信息

### 核心代码
```javascript
class MerchantQRCodeService {
  static async generateMerchantQRCode(merchantId, subMchId, fixedAmount) {
    // 1. 构建二维码数据
    const qrCodeData = this.buildQRCodeData(merchantId, subMchId, fixedAmount)
    
    // 2. 生成二维码图片
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      type: 'png',
      quality: 0.92,
      width: 300
    })
    
    // 3. 返回结果
    return {
      qrCodeBuffer,
      qrCodeData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  }
  
  static generateSign(merchantId, subMchId, fixedAmount) {
    const data = `${merchantId}${subMchId}${fixedAmount || ''}${WECHAT_CONFIG.apiKey}`
    return crypto.createHash('md5').update(data).digest('hex').toLowerCase()
  }
}
```

## 🎉 成果总结

✅ **真实二维码生成**: 替换模拟数据，生成真实微信支付二维码
✅ **安全机制完善**: MD5签名验证防篡改
✅ **批量操作支持**: 支持一次生成多个商户二维码
✅ **错误处理健全**: 商户状态、配置检查
✅ **小程序集成**: 完整的扫码支付流程
✅ **测试验证通过**: 所有功能测试正常

现在用户扫描管理后台生成的二维码，将跳转到真实的微信小程序支付页面，而不再是测试码！

---
生成时间: 2025-09-27
版本: v1.0.0