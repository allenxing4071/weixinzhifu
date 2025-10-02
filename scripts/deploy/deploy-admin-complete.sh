#!/bin/bash
# 完整的React管理后台部署脚本
# 功能：压缩本地构建文件 → 上传到服务器 → 解压 → 配置Nginx → 重启服务

set -e  # 遇到错误立即退出

echo "🚀 开始部署React管理后台到阿里云服务器..."
echo "================================================"

# 配置变量
SERVER_IP="8.156.84.226"
SERVER_USER="root"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SSH_KEY="${PROJECT_ROOT}/config/ssh/weixinpay.pem"
LOCAL_BUILD_DIR="${PROJECT_ROOT}/admin-frontend/build"
REMOTE_DIR="/var/www/admin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 步骤1: 检查本地构建文件
echo ""
echo "📋 步骤1: 检查本地构建文件..."
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo "❌ 错误: 本地构建目录不存在: $LOCAL_BUILD_DIR"
    echo "请先运行: cd admin-frontend && npm run build"
    exit 1
fi

if [ ! -f "$LOCAL_BUILD_DIR/index.html" ]; then
    echo "❌ 错误: 找不到 index.html 文件"
    exit 1
fi

# 检查是否是React应用
if grep -q "static/js/main" "$LOCAL_BUILD_DIR/index.html"; then
    echo "✅ 确认是React应用构建文件"
else
    echo "❌ 错误: 不是有效的React构建文件"
    exit 1
fi

# 步骤2: 压缩本地构建文件
echo ""
echo "📦 步骤2: 压缩本地构建文件..."
ARCHIVE_NAME="admin-build-${TIMESTAMP}.tar.gz"
cd "${PROJECT_ROOT}"
tar -czf "${ARCHIVE_NAME}" -C admin-frontend build/
echo "✅ 压缩完成: ${ARCHIVE_NAME} ($(du -h ${ARCHIVE_NAME} | cut -f1))"

# 步骤3: 上传到服务器
echo ""
echo "📤 步骤3: 上传到服务器..."
scp -i "$SSH_KEY" "${ARCHIVE_NAME}" ${SERVER_USER}@${SERVER_IP}:/tmp/
echo "✅ 上传完成"

# 步骤4: 在服务器上执行部署
echo ""
echo "🔧 步骤4: 在服务器上执行部署..."
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo "  → 备份当前admin目录..."
if [ -d /var/www/admin ]; then
    mv /var/www/admin /var/www/admin.backup.$(date +%Y%m%d_%H%M%S)
    echo "  ✅ 备份完成"
fi

echo "  → 创建新的admin目录并解压..."
mkdir -p /var/www/admin
cd /var/www/admin
tar -xzf /tmp/admin-build-*.tar.gz --strip-components=1
echo "  ✅ 解压完成"

echo "  → 设置权限..."
chown -R www-data:www-data /var/www/admin
chmod -R 755 /var/www/admin
echo "  ✅ 权限设置完成"

echo "  → 验证文件..."
if [ -f /var/www/admin/index.html ]; then
    echo "  ✅ index.html 存在"
    if grep -q "static/js/main" /var/www/admin/index.html; then
        echo "  ✅ 确认是React应用"
    else
        echo "  ❌ 警告: 不是React应用"
    fi
fi

ls -lh /var/www/admin/ | head -10

echo "  → 配置Nginx..."
# 备份现有配置
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# 创建完整的Nginx配置
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    server_name 8.156.84.226;
    
    # HTTP to HTTPS redirect
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.guandongfang.cn guandongfang.cn 8.156.84.226;
    
    # SSL configuration
    ssl_certificate /root/1727765161_20250925_cert/www.guandongfang.cn_bundle.crt;
    ssl_certificate_key /root/1727765161_20250925_cert/www.guandongfang.cn.key;
    ssl_session_timeout 5m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
    ssl_prefer_server_ciphers on;
    
    # React Admin Frontend - Static files first
    location /admin/static/ {
        alias /var/www/admin/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # React Admin Frontend - Main location
    location /admin {
        alias /var/www/admin/;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
        
        # React app MIME types
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Root location
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ =404;
    }
}
EOF

echo "  ✅ Nginx配置已更新"

echo "  → 测试Nginx配置..."
nginx -t

echo "  → 重启Nginx..."
systemctl reload nginx
echo "  ✅ Nginx已重启"

echo "  → 清理临时文件..."
rm -f /tmp/admin-build-*.tar.gz
echo "  ✅ 清理完成"

ENDSSH

echo ""
echo "✅ 部署完成！"
echo ""

# 步骤5: 验证部署
echo "🔍 步骤5: 验证部署..."
echo ""
echo "正在测试访问..."
sleep 2

# 测试HTTP访问
HTTP_RESPONSE=$(curl -s -H "Host: www.guandongfang.cn" http://${SERVER_IP}/admin | head -3)
echo "HTTP响应:"
echo "$HTTP_RESPONSE"
echo ""

# 测试HTTPS访问
HTTPS_RESPONSE=$(curl -k -s -H "Host: www.guandongfang.cn" https://${SERVER_IP}/admin | head -1)
if echo "$HTTPS_RESPONSE" | grep -q "<!doctype html>"; then
    echo "✅ HTTPS访问正常"
    
    # 检查是否是React应用
    if curl -k -s -H "Host: www.guandongfang.cn" https://${SERVER_IP}/admin | grep -q "static/js/main"; then
        echo "✅ React应用加载成功！"
    else
        echo "⚠️  警告: 可能不是React应用"
    fi
else
    echo "⚠️  警告: HTTPS访问异常"
fi

# 步骤6: 清理本地临时文件
echo ""
echo "🧹 步骤6: 清理本地临时文件..."
cd "${PROJECT_ROOT}"
rm -f "${ARCHIVE_NAME}"
echo "✅ 本地临时文件已清理"

echo ""
echo "================================================"
echo "🎉 部署流程全部完成！"
echo ""
echo "📝 访问信息:"
echo "  - 管理后台地址: https://www.guandongfang.cn/admin"
echo "  - 或者访问: https://8.156.84.226/admin"
echo ""
echo "🔐 默认登录账号:"
echo "  - 用户名: admin"
echo "  - 密码: admin123"
echo ""
echo "📊 检查命令:"
echo "  - 查看Nginx状态: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'systemctl status nginx'"
echo "  - 查看访问日志: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'tail -f /var/log/nginx/access.log'"
echo "  - 查看错误日志: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'tail -f /var/log/nginx/error.log'"
echo ""
