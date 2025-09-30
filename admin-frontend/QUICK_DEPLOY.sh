#!/bin/bash

# 🚀 React 管理后台一键部署脚本
# 在服务器上运行此脚本完成部署

echo "🎯 React 管理后台一键部署开始..."

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请以 root 用户运行此脚本"
    exit 1
fi

# 配置变量
ADMIN_DIR="/var/www/admin"
NGINX_CONFIG="/etc/nginx/sites-available/default"
BACKUP_DIR="/root/backup/$(date +%Y%m%d_%H%M%S)"

echo "📋 部署配置："
echo "- 管理后台目录: $ADMIN_DIR"
echo "- Nginx 配置: $NGINX_CONFIG"
echo "- 备份目录: $BACKUP_DIR"

# 创建备份目录
echo "💾 创建备份..."
mkdir -p $BACKUP_DIR

# 备份现有文件（如果存在）
if [ -d "$ADMIN_DIR" ]; then
    echo "📦 备份现有管理后台文件..."
    cp -r $ADMIN_DIR $BACKUP_DIR/admin_old
fi

# 备份 Nginx 配置
echo "📦 备份 Nginx 配置..."
cp $NGINX_CONFIG $BACKUP_DIR/nginx_default.conf

# 检查压缩包
if [ ! -f "/root/admin-build.tar.gz" ]; then
    echo "❌ 未找到 /root/admin-build.tar.gz"
    echo "请先上传构建文件到 /root/admin-build.tar.gz"
    exit 1
fi

# 创建管理后台目录
echo "📁 创建管理后台目录..."
mkdir -p $ADMIN_DIR

# 解压文件
echo "📦 解压管理后台文件..."
cd $ADMIN_DIR
tar -xzf /root/admin-build.tar.gz

if [ $? -ne 0 ]; then
    echo "❌ 解压失败！"
    exit 1
fi

# 设置权限
echo "🔧 设置文件权限..."
chown -R www-data:www-data $ADMIN_DIR
chmod -R 755 $ADMIN_DIR

# 验证关键文件
echo "✅ 验证文件..."
if [ ! -f "$ADMIN_DIR/index.html" ]; then
    echo "❌ 关键文件 index.html 不存在！"
    exit 1
fi

echo "📄 部署的文件："
ls -la $ADMIN_DIR/

# 配置 Nginx
echo "🔧 配置 Nginx..."

# 检查是否已有管理后台配置
if grep -q "location /admin" $NGINX_CONFIG; then
    echo "✅ Nginx 已有管理后台配置，跳过添加"
else
    echo "➕ 添加管理后台 Nginx 配置..."
    
    # 创建临时配置文件
    cat > /tmp/admin_nginx.conf << 'EOF'

    # 管理后台配置
    location /admin {
        alias /var/www/admin;
        try_files $uri $uri/ /admin/index.html;
        
        # JavaScript 文件
        location ~ \.js$ {
            add_header Content-Type application/javascript;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # CSS 文件
        location ~ \.css$ {
            add_header Content-Type text/css;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # 静态资源缓存
        location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # HTML 不缓存
        location ~ \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
EOF

    # 在 location / 之前插入配置
    sed -i '/location \/ {/i\
    # 管理后台配置\
    location /admin {\
        alias /var/www/admin;\
        try_files $uri $uri/ /admin/index.html;\
        \
        # JavaScript 文件\
        location ~ \\.js$ {\
            add_header Content-Type application/javascript;\
            expires 1y;\
            add_header Cache-Control "public, immutable";\
        }\
        \
        # CSS 文件\
        location ~ \\.css$ {\
            add_header Content-Type text/css;\
            expires 1y;\
            add_header Cache-Control "public, immutable";\
        }\
        \
        # 静态资源缓存\
        location ~* \\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\
            expires 1y;\
            add_header Cache-Control "public, immutable";\
        }\
        \
        # HTML 不缓存\
        location ~ \\.html$ {\
            add_header Cache-Control "no-cache, no-store, must-revalidate";\
            add_header Pragma "no-cache";\
            add_header Expires "0";\
        }\
    }\
    ' $NGINX_CONFIG
fi

# 测试 Nginx 配置
echo "🧪 测试 Nginx 配置..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx 配置测试失败，恢复备份..."
    cp $BACKUP_DIR/nginx_default.conf $NGINX_CONFIG
    exit 1
fi

# 重新加载 Nginx
echo "🔄 重新加载 Nginx..."
systemctl reload nginx

if [ $? -ne 0 ]; then
    echo "❌ Nginx 重新加载失败"
    exit 1
fi

# 验证服务状态
echo "📊 验证服务状态..."
systemctl is-active nginx >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Nginx 服务运行正常"
else
    echo "❌ Nginx 服务异常"
    systemctl status nginx
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📍 访问地址："
echo "  - https://www.guandongfang.cn/admin"
echo "  - https://api.guandongfang.cn/admin"
echo ""
echo "🔐 登录信息："
echo "  - 用户名: admin"
echo "  - 密码: admin123"
echo ""
echo "📁 部署路径: $ADMIN_DIR"
echo "💾 备份路径: $BACKUP_DIR"
echo ""
echo "🔍 如有问题，请检查："
echo "  - Nginx 错误日志: tail -f /var/log/nginx/error.log"
echo "  - Nginx 访问日志: tail -f /var/log/nginx/access.log"
echo "  - 文件权限: ls -la $ADMIN_DIR"