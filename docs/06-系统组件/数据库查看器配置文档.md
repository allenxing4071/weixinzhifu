# 数据库管理系统 - 部署说明

## 📋 概述

已创建完整的实时联动数据库管理系统，需要在生产环境的后端中注册database路由。

## ✅ 已完成的文件

### 前端文件
- `database-viewer.html` - 主页面
- `database-viewer.css` - 样式
- `database-viewer.js` - 交互逻辑

### 后端文件
- `backend/routes/database.js` - API路由模块

## 🔧 生产环境集成步骤

### 方法1: 在单体应用中添加路由

如果您的生产环境使用 `payment-points-api-enhanced.js` 单体文件，请添加以下代码：

#### 1. 在文件顶部添加引用
```javascript
// 在其他require之后
const databaseRoutes = require('./routes/database');
```

#### 2. 注册路由
```javascript
// 在其他app.use()之后添加
app.use('/api/v1/database', databaseRoutes);
```

#### 3. 确保数据库连接可用
数据库路由需要访问 `req.app.locals.pool`，确保在app启动时设置：

```javascript
// 在数据库连接创建后
app.locals.pool = dbConnection;
```

### 方法2: 使用模块化结构

如果已使用分离的routes结构：

```javascript
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const merchantsRoutes = require('./routes/merchants');
const ordersRoutes = require('./routes/orders');
const pointsRoutes = require('./routes/points');
const dashboardRoutes = require('./routes/dashboard');
const databaseRoutes = require('./routes/database');  // 新增

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/users', usersRoutes);
app.use('/api/v1/admin/merchants', merchantsRoutes);
app.use('/api/v1/admin/orders', ordersRoutes);
app.use('/api/v1/admin/points', pointsRoutes);
app.use('/api/v1/admin/dashboard', dashboardRoutes);
app.use('/api/v1/database', databaseRoutes);  // 新增
```

## 📡 API端点

注册后，以下端点将可用：

```
GET  /api/v1/database/tables              - 获取所有表
GET  /api/v1/database/tables/:name/schema - 获取表结构
GET  /api/v1/database/tables/:name/data   - 获取表数据
GET  /api/v1/database/stats               - 获取数据库统计
POST /api/v1/database/query               - 执行SQL查询
```

## 🧪 测试步骤

### 1. 检查路由是否注册成功
```bash
# SSH登录服务器
ssh -i config/ssh/weixinpay.pem root@8.156.84.226

# 重启后端服务
pm2 restart payment-api

# 检查日志
pm2 logs payment-api
```

### 2. 测试API端点
```bash
# 测试获取数据库统计
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://www.guandongfang.cn/api/v1/database/stats

# 测试获取表列表
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://www.guandongfang.cn/api/v1/database/tables
```

### 3. 访问前端界面
```
https://www.guandongfang.cn/database-viewer.html
```

## 🔐 安全说明

### JWT认证
所有database路由都需要管理员权限：

```javascript
router.use(requireAdmin);
```

### SQL查询限制
`/database/query` 端点仅允许以下SQL语句：
- SELECT
- SHOW  
- DESCRIBE
- DESC

任何UPDATE、DELETE、INSERT等写操作都会被拒绝。

## 🔄 实时联动特性

### 自动刷新
- **30秒**自动刷新数据库统计
- 窗口**获得焦点**时自动刷新
- 手动**刷新按钮**

### 数据更新检测
当数据库有任何变更时：
1. 表列表会自动更新行数和大小
2. 表结构页面会显示最新字段
3. 数据浏览会显示最新记录

## 📊 功能说明

### 1. 数据库概览
- 数据表数量
- 总记录数
- 数据库大小
- 最后更新时间

### 2. 表列表
- 搜索表名
- 显示行数和大小
- 点击查看详情

### 3. 表结构查看
- 字段名、类型、可空性
- 主键、唯一键标识
- 默认值、额外属性
- 索引信息

### 4. 数据浏览
- 分页显示 (10/20/50/100)
- 按任意列排序
- 升序/降序切换
- 数据导出 (开发中)

### 5. SQL查询控制台
- 语法高亮
- 执行时间显示
- 结果表格展示
- 错误提示

## 🚨 常见问题

### Q1: 访问数据库管理页面返回404
**原因**: 后端路由未注册

**解决**: 按照上述步骤在生产环境后端添加database路由注册

### Q2: API返回"数据库未连接"
**原因**: `req.app.locals.pool` 未设置

**解决**: 
```javascript
app.locals.pool = dbConnection;
```

### Q3: 显示"未授权"错误
**原因**: 未登录或token过期

**解决**: 
1. 先访问管理后台登录
2. 然后再打开数据库管理页面

### Q4: SQL查询被拒绝
**原因**: 尝试执行非SELECT查询

**解决**: 仅使用SELECT、SHOW、DESCRIBE查询

## 📝 部署检查清单

- [ ] 后端routes/database.js文件已上传
- [ ] 主应用文件已添加database路由注册
- [ ] 后端服务已重启
- [ ] API端点测试通过
- [ ] 前端文件已上传到Web目录
- [ ] 可以正常访问database-viewer.html
- [ ] JWT认证正常工作
- [ ] 数据能正常加载

## 🔗 相关文件

### 生产环境
```
服务器: root@8.156.84.226
后端: /root/weixinzhifu/backend/
前端: /var/www/
主文件: payment-points-api-enhanced.js (需修改)
```

### 本地开发
```
后端路由: backend/routes/database.js
前端页面: database-viewer.html
前端样式: database-viewer.css
前端脚本: database-viewer.js
```

## 📞 技术支持

如遇问题，请检查：
1. PM2日志: `pm2 logs payment-api`
2. Nginx日志: `tail -f /var/log/nginx/error.log`
3. 浏览器控制台错误
4. 网络请求状态

---

**创建日期**: 2025年10月3日
**版本**: v1.0.0
**状态**: ⏳ 待部署到生产环境

