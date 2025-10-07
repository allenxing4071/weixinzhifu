# 后端系统问题排查指南

快速诊断和解决后端系统常见问题。

---

## 🔍 快速诊断

### 系统健康检查
```bash
# 1. 检查服务状态
curl http://localhost:3000/health

# 2. 检查进程
ps aux | grep node

# 3. 检查端口占用
netstat -tulpn | grep 3000

# 4. 查看最新日志
tail -f backend/logs/combined.log
```

---

## 🚨 常见错误及解决方案

### 错误1: 数据库连接失败

#### 症状
```
❌ 数据库连接失败: Error: ER_ACCESS_DENIED_ERROR
```

#### 原因分析
1. 数据库用户名或密码错误
2. 数据库服务未启动
3. 网络连接问题

#### 解决步骤
```bash
# Step 1: 检查MySQL服务状态
sudo systemctl status mysql
# 或
brew services list | grep mysql

# Step 2: 测试数据库连接
mysql -h 127.0.0.1 -u root -p

# Step 3: 检查.env配置
cat backend/.env | grep DB_

# Step 4: 验证数据库存在
mysql -u root -p -e "SHOW DATABASES;"

# Step 5: 重置数据库密码（如需要）
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

---

### 错误2: 端口已被占用

#### 症状
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### 解决步骤
```bash
# Step 1: 查找占用端口的进程
lsof -i :3000
# 或
netstat -tulpn | grep 3000

# Step 2: 停止该进程
kill -9 <PID>

# Step 3: 或更换端口
echo "PORT=3001" >> .env
```

---

### 错误3: JWT Token验证失败

#### 症状
```json
{
  "success": false,
  "message": "无效或过期的认证令牌"
}
```

#### 原因分析
1. Token已过期
2. JWT密钥不一致
3. Token格式错误

#### 解决步骤
```bash
# Step 1: 检查JWT密钥
cat .env | grep JWT_SECRET

# Step 2: 重新登录获取新Token
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Step 3: 验证Token格式
# 正确格式: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Step 4: 调整Token过期时间
echo "JWT_EXPIRES_IN=30d" >> .env
```

---

### 错误4: CORS错误

#### 症状
```
Access to fetch at 'http://localhost:3000/api/v1/dashboard/stats'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

#### 解决步骤
```bash
# Step 1: 添加前端域名到ALLOWED_ORIGINS
vim .env

# 添加或修改
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Step 2: 重启服务
pm2 restart payment-api-v2

# Step 3: 验证CORS头
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  -v http://localhost:3000/api/v1/dashboard/stats
```

---

### 错误5: SQL语法错误

#### 症状
```
Error: ER_PARSE_ERROR: You have an error in your SQL syntax
```

#### 解决步骤
```bash
# Step 1: 查看完整错误日志
cat backend/logs/error.log | grep "ER_PARSE_ERROR"

# Step 2: 检查数据库表结构
mysql -u root -p points_app_dev -e "SHOW TABLES;"
mysql -u root -p points_app_dev -e "DESC payment_orders;"

# Step 3: 重新创建表（如需要）
mysql -u root -p points_app_dev < backend/sql/create_all_tables.sql
```

---

### 错误6: 请求限流触发

#### 症状
```json
{
  "success": false,
  "message": "请求过于频繁，请稍后再试",
  "retryAfter": 42
}
```

#### 解决步骤
```bash
# Step 1: 调整限流配置（.env）
RATE_LIMIT_MAX_REQUESTS=200      # API通用限流
RATE_LIMIT_LOGIN_MAX=10          # 登录限流

# Step 2: 重启服务
pm2 restart payment-api-v2

# Step 3: 或等待限流窗口重置（默认1分钟）
```

---

### 错误7: 日志文件权限错误

#### 症状
```
Error: EACCES: permission denied, open 'logs/combined.log'
```

#### 解决步骤
```bash
# Step 1: 创建日志目录
mkdir -p backend/logs

# Step 2: 设置权限
chmod 755 backend/logs

# Step 3: 修改所有者（如使用www-data用户）
sudo chown -R www-data:www-data backend/logs

# Step 4: 或以当前用户运行
sudo chown -R $USER:$USER backend/logs
```

---

### 错误8: 请求体过大 (413 Payload Too Large)

#### 症状
```
413 Request Entity Too Large
```

#### 解决步骤
```javascript
// 已在server-optimized.js中配置
app.use(express.json({ limit: '50mb' }));  // 增大限制
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 如果使用Nginx反向代理，还需配置：
// /etc/nginx/nginx.conf
client_max_body_size 50M;

// 重启Nginx
sudo systemctl restart nginx
```

---

## 📊 性能问题排查

### 问题: 接口响应慢

#### 诊断步骤
```bash
# Step 1: 查看响应时间
curl -w "@-" -o /dev/null -s http://localhost:3000/api/v1/dashboard/stats <<'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
EOF

# Step 2: 检查数据库查询性能
mysql -u root -p -e "SHOW PROCESSLIST;"

# Step 3: 开启慢查询日志
mysql -u root -p -e "SET GLOBAL slow_query_log = 'ON';"
mysql -u root -p -e "SET GLOBAL long_query_time = 1;"

# Step 4: 查看慢查询
tail -f /var/log/mysql/slow-query.log
```

#### 优化建议
1. 为常用字段添加索引
```sql
CREATE INDEX idx_user_id ON payment_orders(user_id);
CREATE INDEX idx_merchant_id ON payment_orders(merchant_id);
CREATE INDEX idx_created_at ON payment_orders(created_at);
```

2. 调整数据库连接池大小
```env
DB_CONNECTION_LIMIT=20  # 根据服务器资源调整
```

---

### 问题: 内存占用过高

#### 诊断步骤
```bash
# Step 1: 查看进程内存使用
ps aux | grep node | grep -v grep

# Step 2: 使用PM2监控
pm2 monit

# Step 3: 生成堆快照
node --inspect server-optimized.js
# 使用Chrome DevTools分析内存
```

#### 优化建议
1. 增加日志文件大小限制
```javascript
// utils/logger.js
maxsize: 5242880,  // 5MB
maxFiles: 5
```

2. 调整Node.js内存限制
```bash
node --max-old-space-size=512 server-optimized.js
```

---

## 🔐 安全问题排查

### 问题: SQL注入攻击尝试

#### 检测方法
```bash
# 查看安全事件日志
cat backend/logs/combined.log | grep "Security Event"

# 查找可疑SQL语句
cat backend/logs/error.log | grep -i "sql syntax"
```

#### 防护措施
所有查询已使用参数化查询，但仍需：
1. 定期检查日志
2. 使用Web Application Firewall (WAF)
3. 限制数据库用户权限

---

### 问题: 暴力破解登录

#### 检测方法
```bash
# 查看登录限流日志
cat backend/logs/combined.log | grep "Login Rate Limit Exceeded"

# 统计失败登录尝试
cat backend/logs/combined.log | grep "Failed Admin Login Attempt" | wc -l
```

#### 防护措施
已实现限流（每分钟5次），可进一步：
```env
# 降低限流阈值
RATE_LIMIT_LOGIN_MAX=3

# 增加限流窗口
RATE_LIMIT_WINDOW_MS=300000  # 5分钟
```

---

## 🛠️ 开发调试技巧

### 1. 启用详细日志
```env
LOG_LEVEL=debug  # 默认为info
NODE_ENV=development  # 开发模式显示堆栈跟踪
```

### 2. 使用调试器
```bash
# 启动调试模式
node --inspect server-optimized.js

# Chrome浏览器访问
chrome://inspect
```

### 3. 测试单个接口
```bash
# 使用httpie（更友好的curl）
brew install httpie

# 测试POST接口
http POST localhost:3000/api/v1/auth/admin/login \
  username=admin \
  password=admin123

# 测试带Token的GET接口
http GET localhost:3000/api/v1/dashboard/stats \
  Authorization:"Bearer YOUR_TOKEN"
```

### 4. 数据库调试
```bash
# 开启查询日志
mysql -u root -p -e "SET GLOBAL general_log = 'ON';"

# 查看所有SQL查询
tail -f /var/log/mysql/general.log

# 关闭查询日志（避免日志过大）
mysql -u root -p -e "SET GLOBAL general_log = 'OFF';"
```

---

## 📋 日常维护检查清单

### 每日检查
- [ ] 查看error.log是否有异常
- [ ] 检查服务运行状态
- [ ] 查看数据库连接池状态

### 每周检查
- [ ] 清理日志文件（保留最近7天）
- [ ] 检查磁盘空间
- [ ] 查看慢查询日志

### 每月检查
- [ ] 备份数据库
- [ ] 更新依赖包
- [ ] 审查安全日志

---

## 🆘 紧急故障处理

### 服务完全无响应

```bash
# 1. 立即重启服务
pm2 restart payment-api-v2 --update-env

# 2. 如果无法重启，强制停止
pm2 delete payment-api-v2
pm2 start server-optimized.js --name "payment-api-v2"

# 3. 检查系统资源
free -h
df -h
top

# 4. 查看错误日志
tail -100 backend/logs/error.log
```

### 数据库连接耗尽

```bash
# 1. 查看当前连接数
mysql -u root -p -e "SHOW PROCESSLIST;"

# 2. 杀死长时间运行的查询
mysql -u root -p -e "KILL <process_id>;"

# 3. 增加数据库最大连接数
mysql -u root -p -e "SET GLOBAL max_connections = 200;"

# 4. 调整应用连接池
# 在.env中
DB_CONNECTION_LIMIT=20
```

---

## 📞 获取帮助

### 收集信息
在寻求帮助前，请收集以下信息：

```bash
# 1. 系统信息
uname -a
node --version
npm --version

# 2. 服务状态
pm2 list
pm2 info payment-api-v2

# 3. 最近日志
tail -100 backend/logs/combined.log > debug_log.txt
tail -100 backend/logs/error.log >> debug_log.txt

# 4. 环境变量（移除敏感信息）
cat .env | sed 's/=.*/=***/' > debug_env.txt

# 5. 数据库状态
mysql -u root -p -e "SHOW STATUS LIKE '%connect%';" > debug_db.txt
```

### 联系支持
将收集的信息发送给开发团队，并描述：
1. 问题现象
2. 复现步骤
3. 预期结果 vs 实际结果
4. 已尝试的解决方法

---

**问题排查指南版本**: v1.0
**更新时间**: 2025-10-01
