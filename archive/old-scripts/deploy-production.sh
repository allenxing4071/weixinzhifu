#!/bin/bash

# 积分系统阿里云生产环境部署脚本
# 使用方法：chmod +x deploy-production.sh && ./deploy-production.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署积分系统到阿里云生产环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置信息收集
echo -e "${BLUE}📋 请提供部署配置信息...${NC}"

read -p "🌐 请输入你的备案域名（如 example.com）: " DOMAIN_NAME
read -p "📱 请输入微信小程序AppID: " WECHAT_APP_ID
read -s -p "🔑 请输入微信小程序AppSecret: " WECHAT_APP_SECRET
echo ""
read -p "💳 请输入微信支付商户号: " WECHAT_MCH_ID
read -s -p "🔐 请输入微信支付API密钥: " WECHAT_API_KEY
echo ""
read -p "🖥️  请输入阿里云服务器IP地址: " SERVER_IP
read -p "👤 请输入服务器SSH用户名（通常是root）: " SSH_USER

# 验证输入
if [[ -z "$DOMAIN_NAME" || -z "$WECHAT_APP_ID" || -z "$SERVER_IP" ]]; then
    echo -e "${RED}❌ 必填信息不完整，请重新运行脚本${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 配置信息收集完成${NC}"

# 创建部署包
echo -e "${BLUE}📦 准备部署包...${NC}"

# 创建临时部署目录
DEPLOY_DIR="./deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p $DEPLOY_DIR

# 打包后端代码
echo "📦 打包后端代码..."
cp -r backend/* $DEPLOY_DIR/
cd $DEPLOY_DIR

# 创建生产环境配置
cat > .env << EOF
# 生产环境配置
NODE_ENV=production
PORT=3000

# 数据库配置（阿里云RDS）
DB_HOST=rm-xxxxxxx.mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=points_app
DB_PASSWORD=SecurePassword123!
DB_NAME=points_app

# Redis配置（阿里云Redis）
REDIS_HOST=r-xxxxxxx.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=RedisPassword123!
REDIS_DB=0

# 微信小程序配置
WECHAT_APP_ID=$WECHAT_APP_ID
WECHAT_APP_SECRET=$WECHAT_APP_SECRET
WECHAT_MCH_ID=$WECHAT_MCH_ID
WECHAT_API_KEY=$WECHAT_API_KEY
WECHAT_NOTIFY_URL=https://api.$DOMAIN_NAME/api/v1/payments/callback
WECHAT_CERT_PATH=/app/certs/
WECHAT_TEMPLATE_ID=填入模板消息ID

# JWT配置
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/points-app/app.log

# 安全配置
ALLOWED_ORIGINS=https://servicewechat.com,https://$DOMAIN_NAME,https://api.$DOMAIN_NAME

# 积分配置
POINTS_RATIO=1
POINTS_EXPIRY_DAYS=365
POINTS_MAX_DAILY=10000
EOF

echo "✅ 生产环境配置创建完成"

cd ..

# 创建nginx配置
echo "🌐 创建nginx配置..."
cat > $DEPLOY_DIR/nginx.conf << EOF
server {
    listen 80;
    server_name api.$DOMAIN_NAME;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.$DOMAIN_NAME;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/api.$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.$DOMAIN_NAME/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 日志
    access_log /var/log/nginx/api.access.log;
    error_log /var/log/nginx/api.error.log;

    # 反向代理到Node.js应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 创建PM2配置
echo "⚙️ 创建PM2配置..."
cat > $DEPLOY_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'points-system-api',
    script: 'dist/app.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/points-app/combined.log',
    out_file: '/var/log/points-app/out.log',
    error_file: '/var/log/points-app/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    min_uptime: '10s',
    max_restarts: 10
  }]
}
EOF

# 创建部署脚本
echo "🚀 创建服务器部署脚本..."
cat > $DEPLOY_DIR/server-setup.sh << 'EOF'
#!/bin/bash

# 阿里云服务器环境配置脚本

set -e

echo "🔧 开始配置阿里云服务器环境..."

# 更新系统
yum update -y

# 安装Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装PM2
npm install -g pm2

# 安装nginx
yum install -y nginx

# 安装certbot（SSL证书）
yum install -y epel-release
yum install -y certbot python3-certbot-nginx

# 创建应用目录
mkdir -p /app
mkdir -p /var/log/points-app
mkdir -p /app/certs

# 设置权限
chown -R nginx:nginx /var/log/points-app
chmod 755 /app

# 启动nginx
systemctl enable nginx
systemctl start nginx

# 防火墙配置
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --reload

echo "✅ 服务器基础环境配置完成"

# 获取SSL证书
echo "🔒 配置SSL证书..."
certbot --nginx -d api.$1 --email admin@$1 --agree-tos --non-interactive

echo "✅ SSL证书配置完成"

# 复制nginx配置
cp nginx.conf /etc/nginx/conf.d/api.conf
nginx -t && systemctl reload nginx

echo "✅ Nginx配置完成"

# 安装应用
echo "📦 部署应用..."
npm install --production
npm run build

# 启动应用
pm2 start ecosystem.config.js
pm2 startup
pm2 save

echo "🎉 部署完成！"
echo "🌐 API地址: https://api.$1"
echo "❤️ 健康检查: https://api.$1/health"
EOF

chmod +x $DEPLOY_DIR/server-setup.sh

echo -e "${GREEN}✅ 部署包准备完成：$DEPLOY_DIR${NC}"

# 创建上传脚本
cat > upload-to-server.sh << EOF
#!/bin/bash

echo "📤 上传代码到阿里云服务器..."

# 打包代码
tar -czf points-system-deploy.tar.gz -C $DEPLOY_DIR .

# 上传到服务器
scp points-system-deploy.tar.gz $SSH_USER@$SERVER_IP:/tmp/

# 在服务器上执行部署
ssh $SSH_USER@$SERVER_IP << 'ENDSSH'
cd /app
tar -xzf /tmp/points-system-deploy.tar.gz
./server-setup.sh $DOMAIN_NAME
ENDSSH

echo "✅ 部署完成！"
echo "🌐 请访问: https://api.$DOMAIN_NAME/health"
EOF

chmod +x upload-to-server.sh

echo ""
echo -e "${GREEN}🎉 部署准备完成！${NC}"
echo ""
echo -e "${BLUE}📋 接下来的步骤：${NC}"
echo "1. 📤 运行 ./upload-to-server.sh 上传代码到服务器"
echo "2. 🌐 在阿里云控制台配置域名解析：api.$DOMAIN_NAME -> $SERVER_IP"
echo "3. 🗄️  在阿里云控制台创建RDS数据库和Redis实例"
echo "4. ⚙️  修改服务器上的.env文件，填入真实的数据库连接信息"
echo "5. 📱 在微信公众平台配置域名：https://api.$DOMAIN_NAME"
echo "6. 🧪 测试API接口：https://api.$DOMAIN_NAME/health"
echo ""
echo -e "${YELLOW}⚠️  注意：请确保阿里云安全组已开放80和443端口${NC}"
