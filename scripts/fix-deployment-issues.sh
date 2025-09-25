#!/bin/bash

# 修复生产环境部署问题的脚本
# 请在服务器上手动执行这些命令

echo "🔧 修复部署问题脚本"
echo "请SSH登录服务器执行以下命令："
echo "ssh root@8.156.84.226"
echo "================================="

cat << 'EOF'

# 1. 修复TypeScript编译问题
cd /app/points-system/backend
npm install typescript@latest --save-dev
npm install -g typescript
npm run build
ls -la dist/

# 2. 如果编译仍有问题，手动编译
npx tsc

# 3. 修复Nginx配置
cd /app/points-system
cp nginx-guandongfang.conf /tmp/nginx-backup.conf

# 创建新的正确的Nginx配置
cat > /etc/nginx/sites-available/api.guandongfang.cn << 'NGINX_EOF'
# 限流配置应该在http块中，这里移除
# limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    listen 80;
    server_name api.guandongfang.cn;
    
    # 重定向HTTP到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.guandongfang.cn;
    
    # SSL配置（certbot会自动添加）
    # ssl_certificate /etc/letsencrypt/live/api.guandongfang.cn/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.guandongfang.cn/privkey.pem;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 反向代理到Node.js应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 4. 测试并重新加载Nginx
nginx -t
systemctl reload nginx

# 5. 启动Node.js应用
cd /app/points-system
pm2 delete all || true
pm2 start pm2-guandongfang.config.js
pm2 status

# 6. 申请SSL证书
certbot --nginx -d api.guandongfang.cn --email admin@guandongfang.cn --agree-tos --non-interactive

# 7. 测试服务
echo "🧪 测试服务..."
sleep 5
curl -s http://localhost:3000/health || echo "本地服务未运行"
curl -s https://api.guandongfang.cn/health || echo "HTTPS服务未运行"

# 8. 检查服务状态
echo "📋 服务状态检查："
pm2 status
systemctl status nginx
mysql -u points_app -p'GuanDongFang2024!@#' -e "SELECT COUNT(*) as tables_count FROM information_schema.tables WHERE table_schema='points_app';"

echo "🎉 修复完成！"
echo "API地址: https://api.guandongfang.cn/health"

EOF
