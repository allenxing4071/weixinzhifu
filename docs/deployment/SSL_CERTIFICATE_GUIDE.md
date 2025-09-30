# 🔒 SSL证书配置指南 - Let's Encrypt

## 📋 当前状态

**问题**: 浏览器显示"不安全"警告（红色图标）

**原因**: 当前使用的是自签名SSL证书（`ssl-cert-snakeoil.pem`），浏览器不信任

**解决方案**: 配置Let's Encrypt免费SSL证书

---

## ✅ 解决方案：安装Let's Encrypt证书

### 方法一：使用Certbot自动配置（推荐）

#### 步骤1: 安装Certbot

```bash
# SSH连接到服务器
ssh -i weixinpay.pem root@8.156.84.226

# 更新软件包
apt update

# 安装certbot和nginx插件
apt install -y certbot python3-certbot-nginx
```

#### 步骤2: 获取证书

```bash
# 自动获取并配置证书（推荐）
certbot --nginx -d www.guandongfang.cn -d guandongfang.cn

# 按照提示操作：
# 1. 输入邮箱地址（用于接收续期通知）
# 2. 同意服务条款 (A)
# 3. 选择是否接收营销邮件 (Y/N)
# 4. 选择是否将HTTP重定向到HTTPS (2 - 推荐)
```

#### 步骤3: 验证证书

```bash
# 测试Nginx配置
nginx -t

# 重新加载Nginx
systemctl reload nginx

# 检查证书信息
certbot certificates
```

#### 步骤4: 测试自动续期

```bash
# Let's Encrypt证书有效期90天，需要自动续期
# 测试续期命令
certbot renew --dry-run

# 如果测试成功，certbot会自动设置定时任务
# 查看定时任务
systemctl status certbot.timer
```

---

### 方法二：手动配置证书

如果自动配置失败，可以手动配置：

#### 步骤1: 仅获取证书（不修改Nginx配置）

```bash
certbot certonly --webroot -w /var/www/html -d www.guandongfang.cn -d guandongfang.cn
```

#### 步骤2: 手动修改Nginx配置

证书文件位置：
```
/etc/letsencrypt/live/www.guandongfang.cn/fullchain.pem
/etc/letsencrypt/live/www.guandongfang.cn/privkey.pem
```

修改 `/etc/nginx/sites-available/guandongfang`:

```nginx
server {
    listen 443 ssl http2;
    server_name www.guandongfang.cn guandongfang.cn;
    
    # 修改这两行
    ssl_certificate /etc/letsencrypt/live/www.guandongfang.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.guandongfang.cn/privkey.pem;
    
    # 其他配置保持不变...
}
```

#### 步骤3: 测试并重新加载

```bash
nginx -t
systemctl reload nginx
```

---

## 🔧 故障排查

### 问题1: certbot命令不存在

```bash
# 重新安装
apt update
apt install -y certbot python3-certbot-nginx
```

### 问题2: 域名验证失败

**可能原因**:
- DNS未正确解析到服务器IP
- 防火墙阻止了80端口
- Nginx配置错误

**解决方案**:
```bash
# 检查DNS解析
dig www.guandongfang.cn

# 检查防火墙
ufw status
ufw allow 80/tcp
ufw allow 443/tcp

# 检查Nginx是否监听80端口
netstat -tlnp | grep :80
```

### 问题3: 证书获取成功但浏览器仍显示不安全

**可能原因**:
- Nginx配置未生效
- 浏览器缓存

**解决方案**:
```bash
# 重启Nginx
systemctl restart nginx

# 清除浏览器缓存
# Chrome: Ctrl+Shift+Delete
# 或使用隐私模式测试
```

---

## 📅 证书续期

### 自动续期（推荐）

Certbot会自动设置定时任务，每天检查证书是否需要续期。

```bash
# 查看续期定时器状态
systemctl status certbot.timer

# 手动触发续期测试
certbot renew --dry-run

# 查看续期日志
journalctl -u certbot.timer
```

### 手动续期

```bash
# 手动续期所有证书
certbot renew

# 续期后重新加载Nginx
systemctl reload nginx
```

---

## 🎯 一键配置脚本

创建自动化脚本 `setup-ssl.sh`:

```bash
#!/bin/bash
# Let's Encrypt SSL证书自动配置脚本

set -e

echo "🔒 开始配置Let's Encrypt SSL证书..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root用户运行此脚本"
    exit 1
fi

# 安装certbot
echo "📦 安装certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# 获取证书
echo "📜 获取SSL证书..."
certbot --nginx \
    -d www.guandongfang.cn \
    -d guandongfang.cn \
    --non-interactive \
    --agree-tos \
    --email admin@guandongfang.cn \
    --redirect

# 测试配置
echo "🔍 测试Nginx配置..."
nginx -t

# 重新加载Nginx
echo "🔄 重新加载Nginx..."
systemctl reload nginx

# 测试自动续期
echo "✅ 测试自动续期..."
certbot renew --dry-run

echo ""
echo "🎉 SSL证书配置完成！"
echo ""
echo "📊 证书信息:"
certbot certificates
echo ""
echo "🌐 现在可以安全访问："
echo "   https://www.guandongfang.cn/"
echo "   https://www.guandongfang.cn/admin/"
```

### 使用脚本：

```bash
# 上传脚本到服务器
scp -i weixinpay.pem setup-ssl.sh root@8.156.84.226:/root/

# 在服务器上执行
ssh -i weixinpay.pem root@8.156.84.226 "chmod +x /root/setup-ssl.sh && /root/setup-ssl.sh"
```

---

## 🔍 验证SSL证书

### 在线检查工具

1. **SSL Labs**
   - 访问: https://www.ssllabs.com/ssltest/
   - 输入: www.guandongfang.cn
   - 查看评级（目标：A+）

2. **SSL Checker**
   - 访问: https://www.sslshopper.com/ssl-checker.html
   - 输入: www.guandongfang.cn

### 命令行检查

```bash
# 查看证书信息
openssl s_client -connect www.guandongfang.cn:443 -servername www.guandongfang.cn < /dev/null 2>/dev/null | openssl x509 -noout -dates

# 检查证书链
openssl s_client -connect www.guandongfang.cn:443 -showcerts
```

### 浏览器检查

1. 访问 https://www.guandongfang.cn/
2. 点击地址栏的锁图标
3. 查看证书详情
4. 应该显示：
   - ✅ 颁发者：Let's Encrypt
   - ✅ 有效期：90天
   - ✅ 状态：有效

---

## 📊 证书管理

### 查看所有证书

```bash
certbot certificates
```

输出示例：
```
Certificate Name: www.guandongfang.cn
    Domains: www.guandongfang.cn guandongfang.cn
    Expiry Date: 2025-12-29 12:00:00+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/www.guandongfang.cn/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/www.guandongfang.cn/privkey.pem
```

### 删除证书

```bash
# 删除指定证书
certbot delete --cert-name www.guandongfang.cn
```

### 添加域名到现有证书

```bash
# 扩展证书以包含更多域名
certbot --nginx -d www.guandongfang.cn -d guandongfang.cn -d api.guandongfang.cn --expand
```

---

## ⚡ 性能优化

### Nginx SSL配置优化

在 `/etc/nginx/sites-available/guandongfang` 中添加：

```nginx
server {
    listen 443 ssl http2;
    server_name www.guandongfang.cn;
    
    ssl_certificate /etc/letsencrypt/live/www.guandongfang.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.guandongfang.cn/privkey.pem;
    
    # SSL优化配置
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/www.guandongfang.cn/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # HSTS（强制HTTPS）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 其他配置...
}
```

---

## 📞 常见问题

### Q1: Let's Encrypt证书免费吗？
**A**: 是的，完全免费，但每90天需要续期一次（可自动续期）。

### Q2: 需要修改DNS吗？
**A**: 不需要，但确保域名已正确解析到服务器IP：8.156.84.226

### Q3: 会影响网站访问吗？
**A**: 配置过程中网站可能短暂不可访问（几秒钟），建议在访问量低的时段操作。

### Q4: 证书过期了怎么办？
**A**: Certbot会自动续期，如果自动续期失败，可以手动执行 `certbot renew`

### Q5: 可以用通配符证书吗？
**A**: 可以，但需要DNS验证：
```bash
certbot certonly --dns-route53 -d "*.guandongfang.cn" -d "guandongfang.cn"
```

---

## ✨ 总结

### 配置前
- ❌ 浏览器显示"不安全"
- ❌ 使用自签名证书
- ❌ 用户信任度低

### 配置后
- ✅ 浏览器显示🔒安全图标
- ✅ 使用受信任的证书
- ✅ 提升用户信任度
- ✅ 更好的SEO排名
- ✅ 符合行业标准

---

**建议立即执行**: 使用上面的一键配置脚本，5分钟内完成SSL证书配置！


