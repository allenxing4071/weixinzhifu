# 🚀 生产环境部署检查清单

## ✅ 前置条件确认

### 已具备条件：
- ✅ **备案域名**：已备案完成
- ✅ **微信支付**：已审核通过
- 🔧 **阿里云服务器**：准备开通

---

## 📋 部署步骤（预计30分钟完成）

### 🖥️ 第一步：开通阿里云服务（5-10分钟）

#### 1.1 购买ECS服务器
```bash
登录阿里云控制台 → 云服务器ECS → 立即购买

推荐配置：
✅ 地域：华东1（杭州）
✅ 实例：通用型g6.large（2核8GB）
✅ 镜像：CentOS 8.0 64位
✅ 存储：100GB ESSD云盘
✅ 网络：专有网络VPC
✅ 公网IP：分配
✅ 带宽：10Mbps按固定带宽
```

#### 1.2 购买RDS数据库
```bash
云数据库RDS → MySQL → 立即购买

推荐配置：
✅ 版本：MySQL 8.0
✅ 系列：高可用版
✅ 规格：通用型2核4GB
✅ 存储：100GB
✅ 网络：与ECS同VPC
```

#### 1.3 购买Redis缓存
```bash
云数据库Redis → 立即购买

推荐配置：
✅ 版本：Redis 6.0
✅ 架构：标准版
✅ 规格：2GB
✅ 网络：与ECS同VPC
```

### 🌐 第二步：配置域名解析（2分钟）

```bash
阿里云控制台 → 域名 → 解析设置

添加记录：
✅ 主机记录：api
✅ 记录类型：A
✅ 记录值：[ECS服务器IP]
✅ TTL：600
```

### 🚀 第三步：执行部署脚本（15分钟）

```bash
# 在本地执行
./deploy-production.sh

# 脚本会自动：
✅ 收集配置信息
✅ 创建部署包
✅ 生成生产环境配置
✅ 创建nginx和PM2配置
✅ 上传到服务器
✅ 自动安装和启动服务
```

### 📱 第四步：配置微信公众平台（5分钟）

```bash
登录微信公众平台 → 开发 → 开发管理 → 开发设置

配置服务器域名：
✅ request合法域名：https://api.yourdomain.com
✅ 其他域名按需添加

配置支付域名：
✅ 支付回调URL：https://api.yourdomain.com/api/v1/payments/callback
```

### 🧪 第五步：测试验证（5分钟）

```bash
# 测试API健康检查
curl https://api.yourdomain.com/health

# 测试模拟登录
curl -X POST https://api.yourdomain.com/api/v1/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code": "test", "userInfo": {"nickName": "测试"}}'

# 测试支付订单创建
# （需要真实token）
```

---

## 🎯 完成后的验证点

### ✅ 必须验证的功能

1. **🌐 API服务**
   - [ ] https://api.yourdomain.com/health 返回200
   - [ ] 所有接口HTTPS访问正常
   - [ ] 响应时间 < 500ms

2. **📱 微信小程序**
   - [ ] 真实设备扫码登录成功
   - [ ] 支付流程完整可用
   - [ ] 积分发放准确（1元=1积分）
   - [ ] 所有页面正常显示

3. **💳 支付功能**
   - [ ] 微信支付调起成功
   - [ ] 支付回调处理正确
   - [ ] 积分实时到账
   - [ ] 订单状态更新正确

4. **🔒 安全验证**
   - [ ] SSL证书有效
   - [ ] API接口权限控制正确
   - [ ] 敏感数据传输加密
   - [ ] 支付数据安全存储

---

## ⚡ 快速部署命令

```bash
# 一键执行完整部署
./deploy-production.sh

# 验证部署结果
curl https://api.yourdomain.com/health
```

---

## 📞 如果遇到问题

### 常见问题排查

1. **域名解析问题**
   ```bash
   # 检查DNS解析
   nslookup api.yourdomain.com
   
   # 检查端口开放
   telnet api.yourdomain.com 443
   ```

2. **SSL证书问题**
   ```bash
   # 手动申请证书
   ssh user@serverip
   certbot --nginx -d api.yourdomain.com
   ```

3. **服务启动问题**
   ```bash
   # 检查应用日志
   ssh user@serverip
   pm2 logs points-system-api
   
   # 检查nginx日志
   tail -f /var/log/nginx/api.error.log
   ```

---

## 🏆 部署成功标志

当你看到以下结果时，说明部署成功：

✅ **API测试通过**
```json
{
  "success": true,
  "message": "API服务运行正常",
  "timestamp": "2024-12-xx...",
  "version": "1.0.0",
  "environment": "production"
}
```

✅ **小程序可以正常登录和支付**

✅ **积分系统1:1发放正确**

**准备好开始了吗？只需要运行 `./deploy-production.sh` 即可！**
