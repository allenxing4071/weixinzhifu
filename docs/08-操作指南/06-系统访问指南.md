# 🌐 关东方积分系统 - 访问指南

## ✅ 问题已解决！

之前的 403 Forbidden 错误是因为网站根目录 `/var/www/html/` 缺少 `index.html` 文件。

现在已经创建了欢迎页面，所有访问都正常了！

---

## 📍 访问地址

### 1. 网站首页
```
https://www.guandongfang.cn/
https://8.156.84.226/
```
显示欢迎页面，包含管理后台链接

### 2. 管理后台（React应用）
```
https://www.guandongfang.cn/admin/
https://8.156.84.226/admin/
```
**⚠️ 重要：访问地址末尾必须带斜杠 `/`**

### 3. API接口
```
https://www.guandongfang.cn/api/v1/
https://api.guandongfang.cn/
```

---

## 🔐 管理后台登录

```
用户名：admin
密码：admin123
```

---

## ✅ 测试验证结果

### 首页测试
```bash
curl -k -s -H "Host: www.guandongfang.cn" https://8.156.84.226/
✅ 返回欢迎页面
```

### 管理后台测试
```bash
curl -k -s -H "Host: www.guandongfang.cn" https://8.156.84.226/admin/
✅ 返回React应用HTML
✅ 引用 static/js/main.3832578c.js
```

### 静态资源测试
```bash
curl -k -s -H "Host: www.guandongfang.cn" https://8.156.84.226/admin/static/js/main.3832578c.js
✅ 正常返回JavaScript代码
```

---

## 🎯 功能说明

### 网站首页功能
- 显示欢迎信息
- 提供管理后台入口链接
- 响应式设计

### 管理后台功能
1. **📊 数据仪表板** - 实时业务监控
2. **👥 用户管理** - 积分用户管理
3. **🏪 商户管理** - 商户信息CRUD
4. **📋 订单管理** - 订单状态跟踪
5. **🎁 积分管理** - 积分记录查看
6. **⚙️ 系统设置** - 管理员配置

---

## 🛠 技术架构

### 前端
- **框架**: React 18.2.0
- **UI库**: Ant Design 5.12.0
- **状态管理**: Redux Toolkit
- **路由**: React Router 6.4.0

### 后端
- **运行环境**: Node.js
- **API端口**: localhost:3000
- **数据库**: PostgreSQL

### Web服务器
- **软件**: Nginx 1.24.0
- **操作系统**: Ubuntu 24.04 LTS
- **SSL**: TLSv1.2/TLSv1.3

---

## 📂 文件部署结构

```
/var/www/
├── html/                          # 网站根目录
│   ├── index.html                # 欢迎页面 ✅
│   └── miniprogram/              # 小程序相关
│
└── admin/                         # React管理后台
    ├── index.html                # React应用入口
    ├── asset-manifest.json
    ├── favicon.ico
    ├── logo192.png
    ├── logo512.png
    ├── manifest.json
    ├── robots.txt
    └── static/
        ├── css/
        │   ├── main.4cdc6e2e.css
        │   └── main.4cdc6e2e.css.map
        └── js/
            ├── main.3832578c.js        # React主应用 (1.1MB)
            ├── main.3832578c.js.LICENSE.txt
            └── main.3832578c.js.map
```

---

## 🔧 Nginx配置要点

### HTTP到HTTPS重定向
```nginx
server {
    listen 80;
    server_name www.guandongfang.cn;
    return 301 https://$server_name$request_uri;
}
```

### 主站点配置
```nginx
server {
    listen 443 ssl http2;
    server_name www.guandongfang.cn;
    
    # 首页
    root /var/www/html;
    index index.html;
    
    # 管理后台
    location /admin/ {
        alias /var/www/admin/;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }
    
    # 静态资源
    location /admin/static/ {
        alias /var/www/admin/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🚨 常见问题解决

### 1. 访问网站显示 403 Forbidden
**原因**: `/var/www/html/` 目录缺少 index.html 文件

**解决方案**:
```bash
echo '<html><body><h1>欢迎访问</h1></body></html>' > /var/www/html/index.html
```

### 2. 管理后台显示空白页
**可能原因**:
- 静态资源路径不正确
- JavaScript文件加载失败
- 浏览器缓存问题

**解决方案**:
```bash
# 清除浏览器缓存
Ctrl + F5 (Windows) / Cmd + Shift + R (Mac)

# 检查静态文件权限
ls -la /var/www/admin/static/

# 查看浏览器控制台错误
F12 → Console 标签
```

### 3. API调用失败
**检查后端服务**:
```bash
# 查看PM2进程状态
pm2 status

# 查看API日志
pm2 logs points-api-final

# 重启API服务
pm2 restart points-api-final
```

### 4. SSL证书警告
**当前状态**: 使用自签名证书

**解决方案**: 配置Let's Encrypt证书
```bash
# 安装certbot
apt install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d www.guandongfang.cn
```

---

## 📊 性能优化建议

### 已启用的优化
- ✅ 静态资源长期缓存 (1年)
- ✅ Gzip压缩
- ✅ HTTP/2支持

### 待实施的优化
- ⏳ CDN加速
- ⏳ 图片压缩优化
- ⏳ 代码分割 (Code Splitting)
- ⏳ 懒加载 (Lazy Loading)

---

## 🔒 安全加固建议

### 当前状态
- ✅ HTTPS启用
- ✅ 文件权限正确 (www-data:www-data 755)
- ⚠️ 使用默认管理员密码

### 建议操作
1. **立即修改默认密码**
   ```
   当前: admin/admin123
   建议: 使用强密码 (12位以上，包含大小写字母、数字、特殊字符)
   ```

2. **配置防火墙**
   ```bash
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp
   ufw enable
   ```

3. **定期备份**
   ```bash
   # 备份数据库
   pg_dump -U postgres points_system > backup.sql
   
   # 备份文件
   tar -czf backup.tar.gz /var/www/
   ```

---

## 📞 运维命令参考

### Nginx管理
```bash
# 测试配置
nginx -t

# 重新加载
systemctl reload nginx

# 查看状态
systemctl status nginx

# 查看访问日志
tail -f /var/log/nginx/access.log

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### PM2管理
```bash
# 查看所有进程
pm2 list

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 查看监控
pm2 monit
```

### 系统监控
```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
netstat -tulpn
```

---

## 📅 维护计划

### 每日检查
- [ ] 查看访问日志
- [ ] 检查API响应时间
- [ ] 监控服务器资源使用

### 每周任务
- [ ] 备份数据库
- [ ] 更新系统安全补丁
- [ ] 清理日志文件

### 每月任务
- [ ] 性能分析和优化
- [ ] 安全审计
- [ ] 容量规划评估

---

## ✨ 总结

🎉 **关东方积分系统已成功部署并可以正常访问！**

### 快速访问链接
- **首页**: https://www.guandongfang.cn/
- **管理后台**: https://www.guandongfang.cn/admin/
- **登录**: admin / admin123

### 技术支持
如遇到任何问题，请查看：
- `/var/log/nginx/error.log` - Nginx错误日志
- `pm2 logs` - 后端应用日志
- 浏览器开发者工具 (F12) - 前端错误信息

---

**部署完成时间**: 2025年9月30日  
**部署状态**: ✅ 成功  
**系统版本**: v1.0.0
