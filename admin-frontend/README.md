# 💼 管理后台 - Admin Frontend

> React + TypeScript + Ant Design 企业级管理后台

---

## 🎯 项目简介

微信支付积分系统的管理后台，用于管理用户、商户、订单、积分和管理员账户。

**已上线地址**：https://www.guandongfang.cn/admin/  
**登录账号**：`admin` / `admin123`

---

## 🏗 技术栈

- **框架**：React 18
- **语言**：TypeScript
- **UI库**：Ant Design
- **路由**：React Router Dom
- **HTTP**：Axios（封装在 utils/api.ts）
- **构建**：Create React App

---

## 📁 项目结构

```
admin-frontend/
├── src/
│   ├── App.tsx                 # ⭐ 主应用文件（单文件架构）
│   ├── App.css                 # 应用样式
│   ├── utils/                  # 工具函数
│   │   ├── api.ts             # API请求封装
│   │   ├── format.ts          # 格式化工具
│   │   └── table.ts           # 表格配置
│   ├── services/              # API服务（备用）
│   ├── types/                 # TypeScript类型定义
│   └── index.tsx              # 应用入口
│
├── public/                     # 静态资源
├── build/                      # ⭐ 生产构建（已部署）
├── package.json
├── tsconfig.json
└── README.md                   # 本文档
```

---

## 🚀 快速开始

### 环境要求
```
Node.js >= 18.0.0
npm >= 9.0.0
```

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm start
# 访问：http://localhost:3000/admin/
```

### 生产构建
```bash
npm run build
# 构建产物在 build/ 目录
```

### 部署到服务器
```bash
# 使用自动化部署脚本（推荐）
../scripts/deploy/deploy-admin-complete.sh

# 或手动部署
scp -i ../config/ssh/weixinpay.pem -r build/* root@8.156.84.226:/var/www/admin/
```

---

## 📊 功能模块

### 1. 仪表板
- 数据统计卡片
- 图表展示
- 快速入口

### 2. 用户管理
- 用户列表（分页、搜索）
- 用户详情查看
- 用户状态管理

### 3. 商户管理
- 商户CRUD
- 批量操作
- 状态管理

### 4. 订单管理
- 订单列表
- 订单状态查询
- 统计分析

### 5. 积分管理
- 积分记录查询
- 余额管理

### 6. 管理员管理
- 管理员账户管理
- 角色权限管理

---

## 🔧 核心技术实现

### API请求
```typescript
// utils/api.ts
import { apiRequest } from './utils/api'

// GET请求
const result = await apiRequest('/admin/users')

// POST请求
const result = await apiRequest('/admin/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username, password })
})
```

### 格式化工具
```typescript
// utils/format.ts
import { formatDateTime, formatAmount, formatPoints } from './utils/format'

// 日期格式化
formatDateTime('2025-09-30T12:00:00') // "2025-09-30 12:00:00"

// 金额格式化（分→元）
formatAmount(10000) // "¥100.00"

// 积分格式化
formatPoints(1234) // "1,234"
```

### 表格配置
```typescript
// utils/table.ts
import { createTimeColumn, amountColumn } from './utils/table'

// 通用列配置
const columns = [
  indexColumn(),
  { title: '用户名', dataIndex: 'username' },
  amountColumn('金额', 'total_amount'),
  createTimeColumn()
]
```

---

## 🎨 代码架构

### 单文件架构
- **优势**：快速开发、部署简单
- **现状**：App.tsx 约4000行
- **适用**：中小型管理后台

### 组件化（可选升级）
如需重构为组件化架构，可按以下结构：
```
src/
├── components/      # 公共组件
├── pages/          # 页面组件
├── hooks/          # 自定义Hooks
├── services/       # API服务
├── utils/          # 工具函数
└── App.tsx         # 路由配置
```

---

## 🔐 认证机制

### Token认证
```typescript
// 登录后保存token
localStorage.setItem('admin_token', token)

// API请求自动带上token
headers: {
  'Authorization': `Bearer ${token}`
}

// 路由守卫
<AuthGuard>
  <Routes>...</Routes>
</AuthGuard>
```

---

## 🧪 测试

### 运行测试
```bash
npm test
```

### 代码检查
```bash
# TypeScript类型检查
npx tsc --noEmit

# 代码格式化
npm run lint
```

---

## 📦 生产环境

### 已部署信息
- **服务器**：阿里云 8.156.84.226
- **路径**：`/var/www/admin/`
- **访问地址**：https://www.guandongfang.cn/admin/
- **Nginx配置**：`../config/nginx/nginx-guandongfang-fixed.conf`

### Nginx配置要点
```nginx
location /admin/ {
  alias /var/www/admin/;
  try_files $uri $uri/ /admin/index.html;
}

location /api/v1/ {
  proxy_pass http://localhost:3000/api/v1/;
}
```

---

## 🐛 常见问题

### API请求失败
- 检查后端服务是否启动：`pm2 list`
- 检查API baseURL配置：应为相对路径 `/api/v1`
- 检查Nginx代理配置

### 页面空白
- 检查浏览器控制台错误
- 检查路由配置是否正确
- 清除浏览器缓存重试

### 编译错误
- 删除 `node_modules` 和 `package-lock.json` 重新安装
- 检查 Node.js 版本是否符合要求
- 检查 TypeScript 类型错误

---

## 📈 性能优化

### 已实施
- ✅ Code Splitting（React Router）
- ✅ Gzip压缩（Nginx）
- ✅ HTTP/2（Nginx）
- ✅ 静态资源缓存

### 可选优化
- 🔲 懒加载路由
- 🔲 虚拟列表（大数据量表格）
- 🔲 CDN加速
- 🔲 Service Worker

---

## 🔄 更新记录

### v1.0.0 (2025-09-30)
- ✅ 完整的管理后台功能
- ✅ 生产环境部署
- ✅ 代码质量优化（工具函数抽取）

---

## 📞 相关链接

- **项目文档**：`../docs/README.md`
- **部署脚本**：`../scripts/deploy/deploy-admin-complete.sh`
- **API文档**：`../docs/01-需求与设计/02-接口需求文档-API.md`
- **后端代码**：`../backend/payment-points-api-enhanced.js`

---

**开发团队**：积分系统开发组  
**版本**：v1.0.0  
**最后更新**：2025年9月30日