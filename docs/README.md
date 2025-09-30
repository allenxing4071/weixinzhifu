# 积分赠送小程序项目

## 🎯 项目简介

基于微信支付的积分赠送系统，用户通过扫码支付后自动获得1:1积分奖励。本项目包含完整的后端API服务和微信小程序前端。

### 核心功能
- ✅ 微信登录授权
- ✅ 扫码支付功能
- ✅ 支付成功后1:1积分发放
- ✅ 积分余额查询
- ✅ 积分记录管理
- 🚧 积分商城（第二期开发）

## 🏗 项目结构

```
weinxinzhifu/
├── docs/                           # 项目文档
│   ├── 00-项目开发总体规划.md
│   ├── 01-需求文档/
│   ├── 02-技术设计/
│   ├── 03-产品设计/
│   ├── 04-开发规范/
│   ├── 05-测试文档/
│   └── 06-部署运维/
├── backend/                        # 后端API服务
│   ├── src/
│   │   ├── config/                 # 配置文件
│   │   ├── models/                 # 数据模型
│   │   ├── services/               # 业务服务
│   │   ├── controllers/            # 控制器
│   │   ├── middleware/             # 中间件
│   │   ├── routes/                 # 路由
│   │   └── app.ts                  # 应用入口
│   ├── sql/                        # 数据库脚本
│   ├── package.json
│   └── tsconfig.json
└── frontend/                       # 前端小程序
    └── miniprogram/
        ├── pages/                  # 页面
        ├── components/             # 组件
        ├── services/               # 服务
        ├── utils/                  # 工具
        ├── app.js                  # 应用入口
        ├── app.json                # 应用配置
        └── app.wxss                # 全局样式
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0
- Nginx (生产环境)
- 微信开发者工具

### 生产环境访问
- **管理后台**: https://www.guandongfang.cn/admin/
- **登录账号**: admin / admin123
- **服务器**: 阿里云 8.156.84.226
- **域名**: guandongfang.cn / www.guandongfang.cn

### 后端服务部署

1. **生产环境（已部署）**
```bash
# 服务文件: /root/weixinzhifu/backend/payment-points-api-enhanced.js
# 进程管理: PM2
# 服务端口: 3000
pm2 list  # 查看服务状态
pm2 logs  # 查看日志
```

2. **本地开发环境**
```bash
cd backend
npm install
cp env.example .env
# 编辑 .env 文件，配置数据库等
node payment-points-api-enhanced.js
```

3. **数据库**
```bash
# 生产环境数据库已配置
# 数据库名: weixin_payment
# 字符集: utf8mb4
```

### 小程序部署

1. **项目配置**
   - 项目目录：`frontend/miniprogram`
   - API地址：https://www.guandongfang.cn/api/v1
   - 已配置文件：app.js, utils/request.js, utils/request-full.js, app-demo.js

2. **微信公众平台配置**
   - 服务器域名（request）：https://www.guandongfang.cn
   - 服务器域名（uploadFile）：https://www.guandongfang.cn
   - 服务器域名（downloadFile）：https://www.guandongfang.cn
   - 业务域名验证文件：已上传到服务器

3. **当前状态**
   - ⚠️ 等待ICP备案审核通过
   - ✅ 小程序代码已完成
   - ✅ 域名HTTPS已配置
   - ⏰ 备案通过后即可发布

## 🔧 开发指南

### 后端API文档

#### 认证接口
- `POST /api/v1/auth/wechat-login` - 微信登录
- `GET /api/v1/auth/user-info` - 获取用户信息
- `PUT /api/v1/auth/user-info` - 更新用户信息

#### 支付接口
- `POST /api/v1/payments` - 创建支付订单
- `GET /api/v1/payments/:orderId` - 查询订单状态
- `POST /api/v1/payments/callback` - 支付回调
- `GET /api/v1/payments/history` - 支付历史

#### 积分接口
- `GET /api/v1/points/balance` - 获取积分余额
- `GET /api/v1/points/history` - 获取积分记录
- `GET /api/v1/points/statistics` - 获取积分统计

### 核心设计原则

1. **支付-积分同步**：使用数据库事务确保数据一致性
2. **用户体验优先**：支付页面1-3秒内明确积分价值
3. **安全第一**：所有接口HTTPS，敏感数据加密
4. **性能优化**：代码分包、缓存策略、CDN加速

## 📊 技术栈

### 后端技术栈
- **语言**：TypeScript
- **框架**：Express.js
- **数据库**：MySQL 8.0
- **缓存**：Redis 6.0
- **认证**：JWT
- **支付**：微信支付API

### 前端技术栈
- **框架**：微信原生小程序
- **状态管理**：Zustand
- **网络请求**：wx.request封装
- **代码压缩**：微信开发者工具

## 🔒 安全配置

### 必需的安全措施
1. **HTTPS部署**：所有接口必须使用HTTPS
2. **数据加密**：敏感数据传输和存储加密
3. **签名验证**：微信支付回调签名验证
4. **权限控制**：用户只能访问自己的数据
5. **输入验证**：所有输入参数严格验证

### 配置检查清单
- [ ] SSL证书配置正确
- [ ] 微信支付域名白名单
- [ ] API密钥安全存储
- [ ] 数据库访问权限最小化
- [ ] 日志脱敏处理

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd backend
npm test                    # 运行所有测试
npm run test:watch         # 监听模式
npm run test:coverage      # 覆盖率测试

# 代码检查
npm run lint               # ESLint检查
npm run lint:fix           # 自动修复
```

### 测试覆盖率目标
- 单元测试覆盖率：≥80%
- 集成测试覆盖率：≥70%
- 核心业务逻辑：100%

## 📈 监控

### 关键指标
- **业务指标**：支付成功率、积分发放准确率
- **性能指标**：接口响应时间、系统可用性
- **用户指标**：日活用户、支付转化率

### 监控工具
- **应用监控**：Prometheus + Grafana
- **日志监控**：ELK Stack
- **错误监控**：Sentry

## 🚀 部署

### 开发环境
```bash
# 启动后端开发服务
cd backend && npm run dev

# 启动小程序开发
# 使用微信开发者工具打开 frontend/miniprogram
```

### 生产环境
```bash
# 后端部署
cd backend
npm run build
npm start

# 小程序发布
# 在微信开发者工具中上传代码
# 在微信公众平台提交审核
```

详细部署指南请参考：`docs/06-部署运维/01-部署方案文档.md`

## 📞 联系我们

- **技术支持**：tech-support@example.com
- **客服电话**：400-123-4567
- **问题反馈**：请提交issue或联系开发团队

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**开发团队**：积分系统开发组  
**版本**：v1.0.0  
**最后更新**：2024年12月
