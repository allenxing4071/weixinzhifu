# 微信支付积分系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](.nvmrc)
[![Production](https://img.shields.io/badge/status-production-success.svg)](https://www.guandongfang.cn/admin/)

> 基于微信支付的积分赠送系统，用户通过扫码支付后自动获得1:1积分奖励。包含完整的管理后台和微信小程序。

## 🎯 项目概述

### 核心功能
- ✅ **微信登录授权** - 小程序一键登录
- ✅ **扫码支付功能** - 微信支付接入
- ✅ **积分自动发放** - 支付成功后1:1积分奖励
- ✅ **积分余额查询** - 实时积分查询
- ✅ **积分记录管理** - 完整的积分流水
- ✅ **管理后台** - 用户、商户、订单、积分管理
- 🚧 **积分商城** - 第二期开发中

### 在线访问
- **管理后台**: https://www.guandongfang.cn/admin/
- **登录账号**: admin / admin123
- **服务器**: 阿里云 8.156.84.226

## 🏗 技术架构

### 技术栈
- **前端**: React 18 + TypeScript + Ant Design
- **后端**: Node.js + Express.js
- **数据库**: MySQL 8.0
- **部署**: Nginx + PM2 + HTTPS
- **小程序**: 微信原生框架

### 系统架构
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  微信小程序      │────▶│   Nginx (443)    │────▶│   Node.js   │
│  (用户端)        │     │   反向代理        │     │  (端口3000) │
└─────────────────┘     └──────────────────┘     └─────────────┘
                                                         │
┌─────────────────┐     ┌──────────────────┐            │
│  React管理后台   │────▶│   Nginx (443)    │            │
│  (管理员端)      │     │   静态文件服务    │            │
└─────────────────┘     └──────────────────┘            ▼
                                                  ┌─────────────┐
                                                  │   MySQL     │
                                                  │  (端口3306) │
                                                  └─────────────┘
```

## 📦 项目结构

```
weixinzhifu/
├── backend/                    # 后端API服务
│   ├── src/                   # TypeScript源码（未使用）
│   ├── sql/                   # 数据库脚本
│   ├── payment-points-api-enhanced.js  # 生产环境后端（✅运行中）
│   └── package.json
├── admin-frontend/             # 管理后台前端
│   ├── src/                   # React源码
│   ├── build/                 # 构建产物（✅已部署）
│   └── package.json
├── frontend/miniprogram/       # 微信小程序
│   ├── pages/                 # 页面
│   ├── components/            # 组件
│   └── app.js
├── docs/                       # 项目文档
│   ├── 01-需求文档/
│   ├── 02-技术设计/
│   └── 10-操作指南/
├── scripts/                    # 脚本工具
│   ├── deploy-admin-complete.sh
│   └── deploy-backend-complete.sh
├── config/                     # 配置文件
│   └── nginx/
├── .cursorrules               # Cursor AI规则
├── CHANGELOG.md               # 变更日志
└── README.md                  # 本文件
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0
- Nginx (生产环境)
- 微信开发者工具

### 本地开发

#### 1. 克隆项目
```bash
git clone git@github.com:allenxing4071/weixinzhifu.git
cd weixinzhifu
```

#### 2. 安装依赖
```bash
# 后端
cd backend
npm install

# 前端
cd ../admin-frontend
npm install
```

#### 3. 配置环境变量
```bash
cd backend
cp env.example .env
# 编辑 .env 文件，配置数据库等信息
```

#### 4. 初始化数据库
```bash
mysql -u root -p < backend/sql/create_all_tables.sql
```

#### 5. 启动服务
```bash
# 启动后端（开发环境）
cd backend
node payment-points-api-enhanced.js

# 启动前端（开发环境）
cd admin-frontend
npm start
```

### 微信小程序开发

1. **打开微信开发者工具**
2. **导入项目**: `frontend/miniprogram`
3. **配置API地址**: 
   - 开发环境: 修改 `app.js` 中的 `baseUrl`
   - 生产环境: `https://www.guandongfang.cn/api/v1`
4. **预览调试**: 点击"预览"扫码测试

## 📚 文档

### 核心文档
- [项目实施状态总结](docs/00-项目实施状态总结.md) - 最新进度和状态
- [已完成功能锁定文档](docs/00-已完成功能锁定文档.md) - 功能清单
- [变更日志](CHANGELOG.md) - 版本更新记录

### 详细文档
- [需求文档](docs/01-需求文档/) - 功能需求说明
- [技术设计](docs/02-技术设计/) - 技术方案设计
- [部署记录](docs/09-部署记录/) - 部署过程记录
- [操作指南](docs/10-操作指南/) - 使用说明

## 🔧 部署

### 生产环境部署

#### 管理后台部署
```bash
./scripts/deploy/deploy-admin-complete.sh
```

#### 后端服务部署
```bash
./scripts/deploy/deploy-backend-complete.sh
```

#### SSL证书部署
```bash
./scripts/deploy/deploy-ssl-cert.sh
```

详细部署指南请参考：[部署文档](docs/09-部署记录/)

## 📊 当前状态

### ✅ 已完成（80%）
- ✅ 管理后台部署上线
- ✅ 后端API完整开发
- ✅ HTTPS证书配置
- ✅ 数据库结构设计
- ✅ 微信小程序开发

### ⏰ 等待中（15%）
- ⏰ ICP备案审核（guandongfang.cn）
- ⏰ 微信商户号审核

### 🔜 待开发（5%）
- 🔜 微信支付接口对接
- 🔜 二维码生成功能
- 🔜 小程序真机测试

## 🔐 安全

### 敏感信息
- SSH密钥: `weixinpay.pem` (不提交到git)
- 数据库密码: `.env` 文件
- 微信API密钥: 环境变量

### 安全检查清单
- [x] HTTPS强制重定向
- [x] SSL证书配置
- [x] 数据库访问控制
- [x] API接口鉴权
- [x] 敏感文件 .gitignore

## 🤝 贡献

### 开发规范
1. **延续现有功能** - 只在现有基础上扩展
2. **修改前先备份** - git commit 保存当前状态
3. **测试后再部署** - 本地测试通过后再上传
4. **更新文档** - 所有变更必须更新文档

### 禁止行为
- ❌ 不要修改生产环境后端 `payment-points-api-enhanced.js`
- ❌ 不要使用TypeScript后端 `backend/src/` (有编译错误)
- ❌ 不要重构已部署代码
- ❌ 不要修改Nginx配置 `nginx-guandongfang-fixed.conf`

详细规则请参考：[.cursorrules](.cursorrules)

## 📞 联系方式

- **技术支持**: 参考项目文档
- **问题反馈**: 提交 GitHub Issue
- **项目维护**: 开发团队

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**当前版本**: v2.0.0  
**最后更新**: 2025-09-30  
**维护状态**: ✅ 积极维护中
