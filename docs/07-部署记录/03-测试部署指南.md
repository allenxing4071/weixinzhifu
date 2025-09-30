# 积分系统完整测试部署指南

## 📋 测试流程概述

本指南将帮助您完成从商户二维码生成到积分系统完整闭环的真实测试。

---

## 🔧 步骤1：微信支付环境配置

### 1.1 微信支付商户号配置

**前置条件：**
- ✅ 已有微信支付服务商/合作伙伴资质
- ✅ 已有小程序AppID和AppSecret
- ✅ 已添加特约商户（如数谷异联科技）

**配置清单：**
```bash
# 复制环境配置文件
cp backend/env.example backend/.env

# 编辑配置文件，填入真实参数
vim backend/.env
```

**必需的配置参数：**
```env
# 微信小程序配置（必填）
WECHAT_APP_ID=wx9bed12ef0904d035           # 您的小程序AppID
WECHAT_APP_SECRET=your_app_secret          # 小程序密钥
WECHAT_MCH_ID=your_mch_id                  # 服务商商户号
WECHAT_API_KEY=your_api_key                # API密钥
WECHAT_NOTIFY_URL=https://your-domain.com/api/v1/payments/callback

# 特约商户配置
SUB_MCH_ID_SHUGU=1234567890               # 数谷异联的特约商户号
SUB_MCH_ID_XIAOMI=1234567891              # 小米便利店的特约商户号
SUB_MCH_ID_STARBUCKS=1234567892           # 星巴克的特约商户号
```

### 1.2 生成商户收款二维码

**API调用示例：**
```typescript
// 1. 调用微信支付Native下单API
const nativePayResult = await wechatPay.transactions.native({
  appid: process.env.WECHAT_APP_ID,
  mchid: process.env.WECHAT_MCH_ID,
  description: '数谷异联科技收款',
  out_trade_no: generateOrderNo(),
  amount: {
    total: 1, // 1分钱，实际金额由用户输入
  },
  notify_url: process.env.WECHAT_NOTIFY_URL,
  // 服务商模式专用参数
  sub_mchid: process.env.SUB_MCH_ID_SHUGU
})

// 2. 获取二维码链接
const qrCodeUrl = nativePayResult.code_url

// 3. 生成二维码图片
const qrCode = await QRCode.toDataURL(qrCodeUrl)
```

---

## 🚀 步骤2：后端服务部署

### 2.1 本地开发环境启动

```bash
# 1. 安装依赖
cd backend
npm install

# 2. 初始化数据库
mysql -u root -p < sql/init.sql

# 3. 启动开发服务
npm run dev

# 验证服务启动
curl http://localhost:3000/health
```

### 2.2 阿里云部署（可选）

**如果选择阿里云部署：**

```bash
# 1. 购买阿里云ECS服务器
# 2. 配置域名和SSL证书
# 3. 安装Node.js环境

# 4. 上传代码
scp -r backend/ root@your-server-ip:/opt/points-system/

# 5. 启动生产服务
cd /opt/points-system/backend
npm run build
npm start

# 6. 配置Nginx反向代理
# 7. 设置PM2进程守护
pm2 start dist/app.js --name points-system
```

---

## 📱 步骤3：小程序配置和上传

### 3.1 小程序环境配置

**更新小程序配置：**
```javascript
// frontend/miniprogram/app.js
App({
  globalData: {
    baseUrl: 'https://your-domain.com/api/v1', // 您的后端地址
    // 或本地测试：'http://localhost:3000/api/v1'
    demoMode: false, // 关闭演示模式，使用真实API
  }
})
```

### 3.2 小程序服务器域名配置

**在微信小程序管理后台配置：**
- **request合法域名**：`https://your-domain.com`
- **socket合法域名**：`wss://your-domain.com`
- **uploadFile合法域名**：`https://your-domain.com`
- **downloadFile合法域名**：`https://your-domain.com`

### 3.3 上传测试版本

**在微信开发者工具中：**
1. **代码检查**：确保无编译错误
2. **上传代码**：点击"上传"→ 填写版本号和备注
3. **设为体验版**：在小程序管理后台设置为体验版
4. **添加体验员**：添加测试人员微信号

---

## 🧪 步骤4：完整流程测试

### 4.1 商户二维码生成测试

**生成测试二维码：**
```bash
# 调用后端API生成商户二维码
curl -X POST http://localhost:3000/api/v1/merchants/qrcode \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merchant_demo_001",
    "amount": null,
    "description": "数谷异联科技收款"
  }'
```

**预期返回：**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "weixin://wxpay/bizpayurl?pr=abc123",
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "merchantInfo": {
      "name": "数谷异联科技",
      "mchId": "1234567890"
    }
  }
}
```

### 4.2 完整支付流程测试

**测试步骤：**
1. **生成二维码** → 打印或显示在电脑上
2. **手机微信扫码** → 自动跳转到小程序支付页面
3. **确认商户信息** → 验证显示"数谷异联科技"
4. **输入金额** → 使用数字键盘输入（如100元）
5. **查看积分规则** → 确认显示"本次将获得100积分"
6. **点击付款** → 调起微信支付
7. **完成支付** → 微信支付成功
8. **积分到账动画** → 显示"+100积分已到账"
9. **自动跳转** → 跳转到积分页面
10. **确认积分** → 验证积分余额增加100

---

## 📊 步骤5：数据验证

### 5.1 后端数据检查

**检查数据库记录：**
```sql
-- 检查支付订单
SELECT * FROM payment_orders WHERE user_id = 'test_user' ORDER BY created_at DESC LIMIT 5;

-- 检查积分记录
SELECT * FROM points_records WHERE user_id = 'test_user' ORDER BY created_at DESC LIMIT 5;

-- 检查用户积分余额
SELECT * FROM user_points WHERE user_id = 'test_user';
```

### 5.2 小程序数据检查

**在小程序中验证：**
- [ ] 积分页面显示正确的积分余额
- [ ] 支付记录显示在"我的"页面
- [ ] 积分历史显示获得记录
- [ ] 1积分=1元的价值计算正确

---

## ⚠️ 测试注意事项

### 安全提醒
- **使用测试商户号**：避免影响生产环境
- **小额测试**：建议使用1元以下金额测试
- **数据备份**：测试前备份重要数据

### 常见问题
- **域名配置**：确保小程序域名白名单正确
- **证书问题**：HTTPS证书必须有效
- **回调通知**：确保回调地址可访问
- **网络环境**：测试环境网络稳定

---

## 🎯 预期测试结果

**成功标准：**
- ✅ 商户二维码能够正常生成
- ✅ 扫码后正确跳转到支付页面
- ✅ 商户信息正确显示
- ✅ 支付能够成功完成
- ✅ 积分能够正确发放
- ✅ 页面跳转流畅无异常
- ✅ 数据记录完整准确

---

**您希望我现在开始哪个步骤？**
1. **先配置后端微信支付接口**？
2. **先部署阿里云服务器**？  
3. **先生成测试用的商户二维码**？
4. **还是先完善小程序配置**？

**请告诉我您希望从哪里开始，我会按照您的指示逐步实施！**
