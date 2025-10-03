# 开发者控制台 - 快速开始

## 🚀 5秒启动

```bash
cd /Users/xinghailong/Documents/soft/weixinzhifu
./start-dashboard.sh
```

然后在浏览器打开: **http://localhost:8080/dashboard.html**

---

## 📸 预览

控制台包含以下区域：

### 1️⃣ 核心数据 (页面顶部)
- 有消费用户: 实时统计
- 活跃商户: 实时统计
- 项目版本: v1.0.0

### 2️⃣ 功能模块 (6个卡片)
- 👥 用户管理
- 🏪 商户管理
- ⭐ 积分管理
- 📦 订单管理
- 🔌 API文档
- ⚙️ 系统设置

### 3️⃣ API快速访问
- 管理后台: https://www.guandongfang.cn/admin/
- 数据统计: https://www.guandongfang.cn/api/v1/admin/dashboard/stats

### 4️⃣ SSH登录
```bash
ssh -i config/ssh/weixinpay.pem root@8.156.84.226
```

### 5️⃣ 常用命令 (4个Tab)
- 数据库操作: 备份、登录
- 日志查看: PM2、Nginx
- 进程管理: 启动、重启、停止
- Nginx操作: 测试、重载

### 6️⃣ 快捷操作 (6个按钮)
- 🚀 部署管理后台
- ⚙️ 部署后端服务
- 🧪 运行测试
- 🧹 项目清理
- 📚 查看文档
- 🔍 系统状态

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|-------|------|
| `Cmd/Ctrl + D` | 打开文档 |
| `Cmd/Ctrl + R` | 刷新数据 |
| `Cmd/Ctrl + K` | 快速搜索 (开发中) |

---

## 🎯 常见操作

### 复制API地址
1. 找到"后端API"区域
2. 点击对应API的"复制"按钮
3. 粘贴到Postman或终端使用

### 登录服务器
1. 找到"服务器登录"区域
2. 点击SSH命令的"复制"按钮
3. 粘贴到终端执行

### 执行命令
1. 点击"常用命令"对应的Tab
2. 找到需要的命令
3. 点击"复制"按钮
4. 粘贴到终端执行

### 快捷部署
1. 点击"快捷操作"区域的对应卡片
2. 确认操作
3. 等待执行结果

---

## 📚 详细文档

- **功能说明**: `DASHBOARD_README.md`
- **使用指南**: `docs/05-操作手册/开发者控制台使用指南.md`
- **实施总结**: `DASHBOARD_IMPLEMENTATION.md`

---

## 🔧 配置修改

**修改API地址** (dashboard.js):
```javascript
const CONFIG = {
    API_BASE_URL: 'https://www.guandongfang.cn/api/v1',
    ADMIN_URL: 'https://www.guandongfang.cn/admin/',
    REFRESH_INTERVAL: 30000, // 30秒
};
```

**修改颜色主题** (dashboard.css):
```css
:root {
    --primary-color: #5B67F1;    /* 主色调 */
    --success-color: #52C41A;    /* 成功色 */
    --warning-color: #FAAD14;    /* 警告色 */
    --error-color: #FF4D4F;      /* 错误色 */
}
```

---

## ❓ 常见问题

### Q: 数据显示为默认值?
A: 需要先登录管理后台获取Token，或检查API地址是否正确。

### Q: 复制按钮无效?
A: 请使用HTTPS或localhost访问，系统会自动降级使用传统复制方式。

### Q: 启动脚本报错?
A: 确保已安装Python3或Node.js: `brew install python3`

---

**快速帮助**: 按 `Cmd/Ctrl + D` 查看完整文档

