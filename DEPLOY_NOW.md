# 🚀 立即部署到阿里云服务器

## 📋 部署内容
- ✅ 后端v2.0.0优化代码
- ✅ 前端积分搜索修复
- ✅ 新增优化文档

---

## 🔐 连接服务器

```bash
ssh root@8.156.84.226
# 输入密码
```

---

## 📦 步骤1：更新后端代码

```bash
# 进入后端目录
cd /root/payment-points-backend

# 拉取最新代码
git pull origin main

# 应该看到：
# Updating 633f8e4..76dbf6f
# Fast-forward
#  BACKEND_OPTIMIZATION_V2.md          | xxx
#  backend/server-optimized.js         | xxx
#  docs/OPTIMIZATION_REPORT.md         | xxx
#  ...
```

---

## 📚 步骤2：安装新依赖

```bash
# 安装优化所需的新包
npm install

# 或者明确安装：
npm install dotenv jsonwebtoken bcryptjs express-validator express-rate-limit winston

# 验证安装
npm list | grep -E "(dotenv|winston|express-rate-limit)"
```

---

## ⚙️ 步骤3：配置环境变量（重要！）

```bash
# 检查.env文件是否存在
ls -la .env

# 如果不存在，创建：
cp .env.example .env

# 编辑.env文件
nano .env
# 或
vim .env
```

### .env 必填配置：

```env
# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=points_app_dev
DB_CONNECTION_LIMIT=10

# JWT安全密钥（必须配置！）
# 生成随机密钥：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=请粘贴生成的64位随机字符串
JWT_EXPIRES_IN=7d

# CORS允许的域名
ALLOWED_ORIGINS=https://www.guandongfang.cn,https://guandongfang.cn

# 服务器端口
PORT=3000

# 日志级别
LOG_LEVEL=info

# 限流配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_LOGIN_MAX=5
```

### 生成JWT密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 复制输出的字符串到.env的JWT_SECRET
```

### 保存并设置权限：

```bash
# 保存后（按Ctrl+O，然后Ctrl+X退出nano）
chmod 600 .env
```

---

## 🔄 步骤4：重启后端服务

### 选项A：继续使用旧版本（推荐，字段已优化）

```bash
# 查看当前服务
pm2 list

# 重启服务
pm2 restart payment-points-api

# 查看日志
pm2 logs payment-points-api --lines 50

# 验证服务
curl http://localhost:3000/health
```

### 选项B：切换到新版本（模块化）

```bash
# 停止旧服务
pm2 stop payment-points-api

# 启动新服务
pm2 start server-optimized.js --name "payment-api-v2"

# 保存PM2配置
pm2 save

# 查看日志
pm2 logs payment-api-v2 --lines 50

# 验证服务
curl http://localhost:3000/health
```

---

## 🎨 步骤5：更新前端

```bash
# 进入前端目录
cd /root/admin-frontend

# 拉取最新代码
git pull origin main

# 安装依赖（如果有更新）
npm install

# 编译前端
npm run build

# 编译完成后，静态文件在 dist/ 目录

# 验证Nginx配置
nginx -t

# 重载Nginx
systemctl reload nginx
```

---

## ✅ 步骤6：验证部署

### 1. 检查服务状态

```bash
# PM2服务列表
pm2 list

# 应该看到服务状态为 online
```

### 2. 检查后端健康

```bash
# 本地测试
curl http://localhost:3000/health

# 应该返回：
# {
#   "success": true,
#   "message": "支付记录和积分API服务运行正常",
#   "database": "connected",
#   ...
# }
```

### 3. 测试登录接口

```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 应该返回token
```

### 4. 测试前端

在浏览器打开：
- https://www.guandongfang.cn/admin/

测试：
- 登录功能
- 仪表盘数据显示
- 积分管理搜索功能

---

## 📊 步骤7：查看日志

### 查看PM2日志

```bash
# 实时查看
pm2 logs

# 查看最近100行
pm2 logs --lines 100

# 查看错误日志
pm2 logs --err
```

### 查看应用日志（如果启用了winston）

```bash
cd /root/payment-points-backend

# 查看综合日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log
```

### 查看Nginx日志

```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

---

## ⚠️ 常见问题排查

### 问题1：数据库连接失败

```bash
# 检查MySQL服务
systemctl status mysql

# 测试连接
mysql -u root -p points_app_dev

# 检查.env配置
cat .env | grep DB_
```

### 问题2：PM2服务无法启动

```bash
# 查看详细错误
pm2 logs payment-points-api --err --lines 50

# 手动运行测试
cd /root/payment-points-backend
node payment-points-api-enhanced.js
# 按Ctrl+C停止，查看报错信息
```

### 问题3：前端404错误

```bash
# 检查dist目录
ls -la /root/admin-frontend/dist/

# 检查Nginx配置
cat /etc/nginx/sites-enabled/guandongfang.conf

# 重新编译
cd /root/admin-frontend
rm -rf dist/
npm run build
```

### 问题4：JWT Token错误

```bash
# 检查JWT_SECRET是否配置
cd /root/payment-points-backend
cat .env | grep JWT_SECRET

# 如果为空，生成并配置
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔄 回滚方案

如果部署出现问题：

```bash
# 1. 停止新服务
pm2 stop payment-api-v2

# 2. 回滚到上一个commit
cd /root/payment-points-backend
git log --oneline -5
git reset --hard 633f8e4  # 上一个版本

# 3. 重启旧服务
pm2 restart payment-points-api

# 4. 验证
curl http://localhost:3000/health
```

---

## 📝 部署检查清单

- [ ] 连接到服务器
- [ ] 后端代码拉取成功
- [ ] 新依赖安装成功
- [ ] .env文件配置完成（重要！）
- [ ] JWT_SECRET已生成并配置
- [ ] PM2服务重启成功
- [ ] 前端代码拉取成功
- [ ] 前端编译成功
- [ ] Nginx重载成功
- [ ] 健康检查通过
- [ ] 登录功能正常
- [ ] 仪表盘数据显示正常
- [ ] 积分搜索功能正常

---

## 🎉 部署完成！

部署成功后，访问：

- **管理后台**: https://www.guandongfang.cn/admin/
- **API健康检查**: https://www.guandongfang.cn/api/v1/health

---

**部署时间**: 2025-10-01
**版本**: v2.0.0-optimized
**预计耗时**: 10-15分钟
