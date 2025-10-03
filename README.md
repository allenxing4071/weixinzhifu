# 💰 微信支付积分系统

> 基于微信支付的积分赠送系统，用户通过扫码支付后自动获得1:1积分奖励

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production-success.svg)](https://www.guandongfang.cn/admin/)
[![Version](https://img.shields.io/badge/version-v1.0.0-brightgreen.svg)]()

---

## 🎯 项目简介

本项目是一个完整的微信支付积分赠送系统，包含管理后台和微信小程序两部分。

**核心功能**：
- ✅ 微信登录授权
- ✅ 扫码支付功能  
- ✅ 支付成功后1:1积分发放
- ✅ 积分余额查询
- ✅ 积分记录管理
- ✅ 完整的管理后台
- 🚧 积分商城（V2.0规划）

---

## 📊 当前状态

### ✅ 已上线
- **管理后台**：https://www.guandongfang.cn/admin/
  - 账号：`admin` / `admin123`
  - 功能：用户、商户、订单、积分、管理员管理

- **后端API**：生产环境稳定运行
  - 服务器：阿里云 8.156.84.226
  - 技术：Node.js + Express + MySQL
  - 进程：PM2管理

### ⏰ 等待中
- **ICP备案**：guandongfang.cn 正在审核
- **微信商户号**：审核中（约40分钟）
- **小程序发布**：代码已完成，等待备案通过

---

## 🚀 快速开始

### 🎯 开发者控制台 (NEW!)

一个仿照 Web3 Alpha Hunter 风格的可视化管理面板，提供快速访问系统功能、查看数据、执行命令的统一入口。

```bash
# 一键启动控制台
./start-dashboard.sh
# 访问: http://localhost:8080/dashboard.html
```

**主要功能**:
- 📊 核心数据实时展示
- 🔧 功能模块快速导航
- 🔌 API地址一键复制
- ⌨️ 常用命令速查
- ⚡ 快捷操作按钮

详见: [开发者控制台快速开始](./QUICK_START_DASHBOARD.md)

---

### 环境要求
```
Node.js >= 18.0.0
MySQL >= 8.0
Nginx (生产环境)
微信开发者工具
Python 3 (启动控制台)
```

### 克隆项目
```bash
git clone <repository-url>
cd weixinzhifu
```

### 后端部署

#### 1. 本地开发
```bash
cd backend
npm install
cp env.example .env
# 编辑 .env 文件，配置数据库等信息
node payment-points-api-enhanced.js
```

#### 2. 生产环境（已部署）
```bash
# 服务器：root@8.156.84.226
# 文件：/root/weixinzhifu/backend/payment-points-api-enhanced.js
# 端口：3000
# 进程：PM2管理

# 查看服务状态
pm2 list

# 查看日志
pm2 logs
```

### 管理后台部署

#### 1. 本地开发
```bash
cd admin-frontend
npm install
npm start  # 开发模式：http://localhost:3000/admin/
```

#### 2. 构建部署
```bash
npm run build  # 构建到 build/ 目录

# 使用部署脚本（推荐）
../scripts/deploy/deploy-admin-complete.sh
```

### 微信小程序

#### 1. 开发配置
```bash
# 项目路径
cd frontend/miniprogram

# API配置已完成
# - app.js: API地址 https://www.guandongfang.cn/api/v1
# - utils/request.js: 请求封装
```

#### 2. 微信开发者工具
1. 打开微信开发者工具
2. 导入项目：选择 `frontend/miniprogram` 目录
3. 填写AppID（从微信公众平台获取）
4. 开始开发调试

#### 3. 发布上线
1. ⏰ 等待ICP备案通过
2. 在微信开发者工具中上传代码
3. 在微信公众平台提交审核
4. 审核通过后发布

---

## 📁 项目结构

```
weixinzhifu/
├── 🎯 开发者控制台 (NEW!)
│   ├── dashboard.html                    # ⭐ 控制台主页面
│   ├── dashboard.css                     # 样式文件
│   ├── dashboard.js                      # 交互脚本
│   ├── start-dashboard.sh                # 一键启动脚本
│   ├── DASHBOARD_README.md               # 功能说明
│   ├── DASHBOARD_IMPLEMENTATION.md       # 实施总结
│   └── QUICK_START_DASHBOARD.md          # 快速开始
│
├── docs/                       # 📚 项目文档
│   ├── 00-项目总览.md         # ⭐ 项目总览（必读）
│   ├── 01-需求与设计/         # 需求和设计文档
│   ├── 02-技术实现/           # 技术方案文档
│   ├── 03-开发规范/           # 开发规范
│   ├── 04-部署与运维/         # 部署文档
│   ├── 05-操作手册/           # 使用指南
│   │   └── 开发者控制台使用指南.md  # NEW! 控制台详细指南
│   ├── archive/               # 历史文档归档
│   └── README.md              # 文档导航
│
├── backend/                    # 🔧 后端API服务
│   ├── payment-points-api-enhanced.js  # ⭐ 生产环境主文件
│   ├── sql/                   # 数据库脚本
│   ├── config.env             # 生产环境配置
│   └── package.json
│
├── admin-frontend/             # 💼 管理后台（React + Ant Design）
│   ├── src/
│   │   ├── App.tsx            # 主应用文件
│   │   └── utils/             # 工具函数（api, format, table）
│   ├── build/                 # 生产构建（已部署）
│   ├── package.json
│   └── README.md              # 前端说明
│
├── frontend/miniprogram/       # 📱 微信小程序
│   ├── pages/                 # 页面（支付、积分、个人中心）
│   ├── services/              # 业务服务
│   ├── utils/                 # 工具函数
│   ├── app.js                 # 应用入口
│   └── project.config.json
│
├── config/                     # ⚙️ 配置文件
│   ├── nginx/                 # Nginx配置
│   ├── ssh/                   # SSH密钥
│   ├── ssl/                   # SSL证书
│   └── pm2-guandongfang.config.js  # PM2配置
│
├── scripts/                    # 🛠️ 部署脚本
│   ├── deploy/                # 部署脚本
│   │   ├── deploy-admin-complete.sh
│   │   ├── deploy-backend-complete.sh
│   │   └── deploy-ssl-cert.sh
│   └── utils/                 # 工具脚本
│
├── archive/                    # 📦 归档文件（已清空）
├── CHANGELOG.md               # 变更日志
├── LICENSE                    # MIT许可证
└── README.md                  # ⭐ 本文档
```

---

## 🔧 技术栈

### 后端技术
- **语言**：JavaScript (Node.js 18+)
- **框架**：Express.js
- **数据库**：MySQL 8.0
- **认证**：JWT Token
- **进程管理**：PM2
- **支付**：微信支付API（待对接）

### 前端技术
- **管理后台**：React 18 + TypeScript + Ant Design
- **小程序**：微信原生小程序框架
- **状态管理**：本地State
- **网络请求**：Axios / wx.request

### 部署运维
- **服务器**：阿里云ECS
- **Web服务器**：Nginx
- **HTTPS**：阿里云SSL证书
- **域名**：guandongfang.cn / www.guandongfang.cn
- **数据库**：MySQL 8.0

---

## 📖 文档导航

| 文档类型 | 路径 | 说明 |
|---------|------|------|
| **🎯 控制台快速开始** | `QUICK_START_DASHBOARD.md` | ⭐ 开发者控制台5秒启动（NEW!） |
| **🎯 控制台使用指南** | `docs/05-操作手册/开发者控制台使用指南.md` | 详细功能说明和使用技巧 |
| **项目总览** | `docs/00-项目总览.md` | ⭐ 快速了解项目（必读） |
| **需求与设计** | `docs/01-需求与设计/` | 产品需求、API接口、架构设计 |
| **技术实现** | `docs/02-技术实现/` | 系统架构、支付流程、二维码方案 |
| **开发规范** | `docs/03-开发规范/` | 项目管理、小程序开发规范 |
| **部署与运维** | `docs/04-部署与运维/` | 部署方案、发布清单、运维指南 |
| **操作手册** | `docs/05-操作手册/` | 上传、发布、测试、配置指南 |
| **文档总览** | `docs/README.md` | 完整的文档导航 |

---

## 🔐 安全配置

### 已配置的安全措施
- ✅ HTTPS部署（阿里云SSL证书）
- ✅ Nginx反向代理
- ✅ 数据库密码环境变量化
- ✅ JWT Token认证
- ✅ CORS跨域配置

### 待完善
- ⏰ 微信支付签名验证
- ⏰ API请求频率限制
- ⏰ 敏感数据加密存储

---

## 🧪 测试

### 管理后台测试
1. 访问：https://www.guandongfang.cn/admin/
2. 登录：`admin` / `admin123`
3. 测试各功能模块

### 小程序测试
1. ⏰ 等待ICP备案通过
2. 使用微信开发者工具真机调试
3. 测试支付、积分等功能

---

## 📈 监控和日志

### 服务监控
```bash
# PM2监控
pm2 monit

# 查看日志
pm2 logs

# 重启服务
pm2 restart payment-points-api-enhanced
```

### Nginx日志
```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

### 数据库监控
```bash
# 连接数据库
mysql -u root -p weixin_payment

# 查看表结构
SHOW TABLES;
```

---

## 🚀 下一步计划

### 短期（等待备案）
- ⏰ ICP备案审核
- ⏰ 微信商户号审核
- 📝 完善项目文档
- 🧪 准备小程序测试

### 中期（备案通过后）
- 🚀 小程序真机测试
- 💰 对接微信支付API
- 🔐 二维码生成功能
- 📊 数据监控和分析

### 长期（V2.0规划）
- 🛒 积分商城
- 📈 数据分析报表
- 🎁 营销活动功能
- 👥 会员等级体系

详细规划见：`docs/archive/V2.0规划/`

---

## 📞 联系方式

- **技术支持**：查看项目文档或提交Issue
- **管理后台**：https://www.guandongfang.cn/admin/
- **部署问题**：参考 `docs/04-部署与运维/`

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢所有参与项目开发的团队成员！

---

**开发团队**：积分系统开发组  
**版本**：v1.0.0  
**最后更新**：2025年9月30日  
**项目状态**：✅ 管理后台已上线，⏰ 小程序等待ICP备案