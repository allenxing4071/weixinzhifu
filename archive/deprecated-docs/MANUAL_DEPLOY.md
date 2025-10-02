# 手动部署指南 - 2025年10月1日优化版

## 🔐 前置条件
1. 确保可以SSH到服务器: `ssh root@8.156.84.226`
2. 确保服务器已安装: Git, Node.js v16+, MySQL, PM2

---

## 📦 部署步骤

### 步骤1: 连接服务器并拉取代码
```bash
ssh root@8.156.84.226
cd /www/wwwroot/payment-points-system
git pull origin main
```

### 步骤2: 更新后端依赖
```bash
cd backend
npm install dotenv jsonwebtoken bcryptjs express-validator express-rate-limit winston mysql2
```

### 步骤3: 配置环境变量
```bash
# 创建 .env 文件
cat > .env << 'EOF'
# 数据库配置
DB_HOST=localhost
DB_USER=payment_points_db
DB_PASSWORD=Chl940407
DB_NAME=payment_points_db
DB_PORT=3306

# JWT配置
JWT_SECRET=weixinzhifu_secure_jwt_secret_key_2025_payment_system_v2

# 安全配置
ALLOWED_ORIGINS=https://www.guandongfang.cn,https://guandongfang.cn
NODE_ENV=production
PORT=3001
EOF
```

### 步骤4: 执行数据库修复（⚠️ 重要）
```bash
# 备份数据库
mysqldump -u payment_points_db -pChl940407 payment_points_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 执行修复脚本
mysql -u payment_points_db -pChl940407 payment_points_db < sql/fix_data_consistency.sql

# 验证修复结果
mysql -u payment_points_db -pChl940407 payment_points_db -e "
SELECT
  m.id,
  m.merchant_name,
  m.total_amount as merchant_total_cents,
  COUNT(o.id) as order_count,
  SUM(o.amount) as orders_total_cents
FROM merchants m
LEFT JOIN payment_orders o ON m.id = o.merchant_id AND o.status = 'paid'
GROUP BY m.id
LIMIT 5;
"
```

### 步骤5: 重启后端服务

#### 选项A: 使用新版模块化架构（推荐）
```bash
cd /www/wwwroot/payment-points-system/backend

# 停止旧服务
pm2 stop payment-api 2>/dev/null || true

# 启动新版本
pm2 start server.js --name payment-api-v2 \
  --node-args="--max-old-space-size=512" \
  --log /www/wwwlogs/payment-api-v2.log

# 设置开机自启
pm2 save
pm2 startup
```

#### 选项B: 使用优化后的单文件版本
```bash
cd /www/wwwroot/payment-points-system/backend

# 停止旧服务
pm2 stop payment-api 2>/dev/null || true

# 启动优化版
pm2 start payment-points-api-enhanced.js --name payment-api \
  --node-args="--max-old-space-size=512" \
  --log /www/wwwlogs/payment-api.log

pm2 save
pm2 startup
```

### 步骤6: 编译并部署前端
```bash
cd /www/wwwroot/payment-points-system/admin-frontend

# 安装依赖（如有更新）
npm install

# 编译生产版本
npm run build

# 部署到Nginx目录（根据实际路径调整）
rm -rf /www/wwwroot/www.guandongfang.cn/admin/*
cp -r dist/* /www/wwwroot/www.guandongfang.cn/admin/

# 重启Nginx
nginx -t && nginx -s reload
```

---

## ✅ 验证部署

### 1. 检查后端服务
```bash
# 查看PM2状态
pm2 status

# 查看日志
pm2 logs payment-api --lines 50

# 测试API
curl http://localhost:3001/api/merchants | jq
```

### 2. 检查前端访问
```bash
# 浏览器访问
https://www.guandongfang.cn/admin

# 测试登录
用户名: admin
密码: admin123
```

### 3. 验证商户详情修复
1. 登录管理后台
2. 进入「商户管理」
3. 点击任一商户的「详情」按钮
4. 确认所有字段正常显示（不再是"未设置"）
5. 确认金额显示正确（yuan单位，小数点后2位）

---

## 🔍 问题排查

### 后端启动失败
```bash
# 检查端口占用
lsof -i:3001

# 检查环境变量
cat backend/.env

# 检查数据库连接
mysql -u payment_points_db -pChl940407 -e "SELECT 1"
```

### 前端404错误
```bash
# 检查Nginx配置
cat /www/server/nginx/conf/vhost/www.guandongfang.cn.conf

# 检查文件权限
ls -la /www/wwwroot/www.guandongfang.cn/admin/

# 重新编译
cd admin-frontend && npm run build
```

### 商户详情仍显示"未设置"
```bash
# 检查API响应
curl http://localhost:3001/api/merchants/[merchant_id] | jq

# 验证数据库字段
mysql -u payment_points_db -pChl940407 payment_points_db \
  -e "SELECT * FROM merchants LIMIT 1\G"
```

---

## 📊 本次部署的关键修复

1. **🔒 安全升级**
   - SQL注入防护（参数化查询）
   - JWT认证替代弱token
   - 环境变量隔离敏感信息
   - 请求限流（API 100次/分钟，登录 5次/分钟）

2. **⚡ 性能优化**
   - 数据库连接池（10个连接）
   - N+1查询优化（2.5s → 50ms）
   - 日志系统（Winston）

3. **🐛 Bug修复**
   - 商户详情字段映射（snake_case → camelCase）
   - 金额单位统一（数据库cents，API yuan）
   - 数据关联完整性修复
   - 前端空状态优化

4. **📁 架构升级**
   - 模块化路由（14个文件）
   - 中间件分层（验证、限流、认证）
   - 错误统一处理

---

## 📞 部署后联系清单

✅ 后端服务运行正常
✅ 前端页面可访问
✅ 商户详情字段显示正确
✅ 数据库统计准确
✅ 日志记录正常

**部署完成时间**: _____________
**部署人员**: _____________
**验证结果**: _____________
