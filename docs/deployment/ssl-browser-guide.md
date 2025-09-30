# 浏览器SSL证书问题解决指南

## 问题现象
访问 https://www.guandongfang.cn/ 时显示：
- "您的连接不是私密连接"
- "net::ERR_CERT_AUTHORITY_INVALID"

## 原因
服务器使用的是自签名SSL证书，浏览器不信任此证书。

## 解决方案

### 方案1：浏览器强制访问（最简单）

#### Chrome/Edge浏览器：
1. 看到警告页面时，点击 **"高级"** 按钮
2. 点击 **"继续前往 www.guandongfang.cn（不安全）"**
3. 即可正常访问管理后台

#### Firefox浏览器：
1. 点击 **"高级..."**
2. 点击 **"接受风险并继续"**

#### Safari浏览器：
1. 点击 **"显示详细信息"**
2. 点击 **"访问此网站"**
3. 输入系统密码确认

### 方案2：修改hosts文件（推荐开发环境）

在本地电脑添加hosts记录：

**Windows系统：**
1. 以管理员身份打开记事本
2. 打开文件：`C:\Windows\System32\drivers\etc\hosts`
3. 在末尾添加：
   ```
   8.156.84.226 www.guandongfang.cn
   8.156.84.226 api.guandongfang.cn
   ```
4. 保存文件
5. 刷新DNS：`ipconfig /flushdns`

**macOS/Linux系统：**
1. 打开终端
2. 编辑hosts文件：`sudo nano /etc/hosts`
3. 添加：
   ```
   8.156.84.226 www.guandongfang.cn
   8.156.84.226 api.guandongfang.cn
   ```
4. 保存并退出
5. 刷新DNS：`sudo dscacheutil -flushcache`

### 方案3：安装自签名证书到系统（高级用户）

1. 下载服务器证书：
   ```bash
   openssl s_client -connect www.guandongfang.cn:443 -servername www.guandongfang.cn </dev/null 2>/dev/null | openssl x509 -outform PEM > guandongfang.crt
   ```

2. **Windows系统：**
   - 双击 .crt 文件
   - 点击"安装证书"
   - 选择"本地计算机"
   - 选择"将所有的证书都放入下列存储" → "受信任的根证书颁发机构"

3. **macOS系统：**
   - 双击 .crt 文件打开"钥匙串访问"
   - 找到证书，双击设置信任级别为"始终信任"

## 验证访问

设置完成后，访问以下地址验证：

- **管理后台**：https://www.guandongfang.cn/
- **API接口**：https://api.guandongfang.cn/health
- **登录测试**：https://api.guandongfang.cn/api/v1/admin/auth/login

## 管理后台功能

成功访问后，可以使用以下账号登录：
- **用户名**：admin
- **密码**：admin123

## 注意事项

1. **生产环境**：建议申请正式SSL证书
2. **开发测试**：可以使用方案1或方案2
3. **团队协作**：所有开发人员都需要进行相同配置

> 💡 **提示**：这些都是临时解决方案，正式上线前建议配置正式的SSL证书。