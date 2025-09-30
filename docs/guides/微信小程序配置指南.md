# 微信小程序服务器域名配置指南

## 📱 SSL证书部署完成后的配置步骤

### 1. 登录微信公众平台

访问：https://mp.weixin.qq.com
使用您的微信小程序账号登录

### 2. 进入开发设置

1. 点击左侧菜单 **开发** → **开发管理**
2. 点击 **开发设置** 标签页
3. 找到 **服务器域名** 配置区域

### 3. 配置服务器域名

点击 **修改** 按钮，添加以下域名：

#### ✅ request合法域名（必须）
```
https://www.guandongfang.cn
```

#### ✅ uploadFile合法域名（可选）
```
https://www.guandongfang.cn
```

#### ✅ downloadFile合法域名（可选）
```
https://www.guandongfang.cn
```

### 4. 保存配置

点击 **保存并提交** 按钮

**⚠️ 重要提示**：
- 微信每月只能修改5次服务器域名，请谨慎操作
- 域名必须使用HTTPS协议
- 域名必须已备案（您的域名已备案 ✅）
- SSL证书必须有效且受信任

---

## 🧪 测试小程序API调用

配置完成后，在小程序开发工具中测试：

### 测试代码示例

```javascript
// 测试登录API
wx.request({
  url: 'https://www.guandongfang.cn/api/v1/admin/auth/login',
  method: 'POST',
  data: {
    username: 'admin',
    password: 'admin123'
  },
  success(res) {
    console.log('✅ 登录成功:', res.data);
  },
  fail(err) {
    console.error('❌ 登录失败:', err);
  }
});

// 测试获取数据API
wx.request({
  url: 'https://www.guandongfang.cn/api/v1/admin/dashboard/stats',
  method: 'GET',
  success(res) {
    console.log('✅ 获取统计数据成功:', res.data);
  },
  fail(err) {
    console.error('❌ 获取数据失败:', err);
  }
});
```

---

## ✅ 验证清单

配置完成后，请验证以下项目：

- [ ] 微信公众平台服务器域名已配置
- [ ] 小程序可以正常调用登录API
- [ ] 小程序可以正常获取数据
- [ ] 没有SSL证书错误
- [ ] 没有域名不合法错误

---

## 🔧 常见问题

### Q1: 提示"不在以下 request 合法域名列表中"
**A**: 请确认已在微信公众平台配置了服务器域名，并且域名完全匹配（包括https://）

### Q2: 提示"ssl握手失败"  
**A**: 请确认SSL证书已正确安装且未过期

### Q3: 提示"域名未备案"
**A**: 您的域名已备案，不应该出现此问题。如果出现，请联系阿里云核实备案状态

### Q4: 开发工具中可以访问，但真机预览失败
**A**: 
1. 检查是否开启了"不校验合法域名"选项（生产环境必须关闭）
2. 确认手机网络正常
3. 确认SSL证书在手机浏览器中也是信任的

---

## 📞 需要帮助？

如果配置过程中遇到任何问题，请提供：
1. 具体的错误信息截图
2. 小程序开发工具的控制台日志
3. 网络请求的详细信息

我会立即帮您解决！🚀
