#!/bin/bash

# 关东方积分系统快速部署脚本
# 域名：api.guandongfang.cn
# 服务器：8.156.84.226

set -e

echo "🚀 开始部署关东方积分系统到生产环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
DOMAIN="guandongfang.cn"
API_DOMAIN="api.guandongfang.cn"
SERVER_IP="8.156.84.226"
SSH_KEY="weixinpay.pem"
SSH_USER="root"

echo -e "${BLUE}📋 收集微信配置信息...${NC}"

# 收集微信配置
read -p "📱 请输入微信小程序AppID (wx开头): " WECHAT_APP_ID
read -s -p "🔑 请输入微信小程序AppSecret (32位): " WECHAT_APP_SECRET
echo ""
read -p "💳 请输入微信支付商户号 (数字): " WECHAT_MCH_ID  
read -s -p "🔐 请输入微信支付API密钥 (32位): " WECHAT_API_KEY
echo ""

# 验证输入
if [[ -z "$WECHAT_APP_ID" || -z "$WECHAT_APP_SECRET" || -z "$WECHAT_MCH_ID" || -z "$WECHAT_API_KEY" ]]; then
    echo -e "${RED}❌ 微信配置信息不完整，请重新运行${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 配置信息收集完成${NC}"

# 创建部署包
echo -e "${BLUE}📦 准备部署包...${NC}"
DEPLOY_TEMP="./deploy-temp-$(date +%H%M%S)"
mkdir -p $DEPLOY_TEMP

# 复制后端代码
cp -r backend/* $DEPLOY_TEMP/
cp nginx-guandongfang.conf $DEPLOY_TEMP/nginx.conf
cp pm2-guandongfang.config.js $DEPLOY_TEMP/ecosystem.config.js

# 创建生产环境配置
cat > $DEPLOY_TEMP/.env << EOF
NODE_ENV=production
PORT=3000

# 数据库配置（暂时本地，后续可升级云数据库）
DB_HOST=localhost
DB_PORT=3306
DB_USER=points_app
DB_PASSWORD=GuanDongFang2024!@#
DB_NAME=points_app

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 微信配置
WECHAT_APP_ID=$WECHAT_APP_ID
WECHAT_APP_SECRET=$WECHAT_APP_SECRET
WECHAT_MCH_ID=$WECHAT_MCH_ID
WECHAT_API_KEY=$WECHAT_API_KEY
WECHAT_NOTIFY_URL=https://$API_DOMAIN/api/v1/payments/callback
WECHAT_CERT_PATH=/app/certs/

# JWT配置
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/points-app/app.log

# 安全配置
ALLOWED_ORIGINS=https://servicewechat.com,https://$DOMAIN,https://$API_DOMAIN
EOF

# 创建服务器部署脚本
cat > $DEPLOY_TEMP/deploy-on-server.sh << 'SERVEREOF'
#!/bin/bash
set -e

echo "🔧 在服务器上执行部署..."

# 安装MySQL（本地）
apt install -y mysql-server mysql-client

# 安装Redis
apt install -y redis-server

# 启动服务
systemctl enable mysql redis-server nginx
systemctl start mysql redis-server nginx

# 配置MySQL
mysql << MYSQLEOF
CREATE DATABASE IF NOT EXISTS points_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'points_app'@'localhost' IDENTIFIED BY 'GuanDongFang2024!@#';
GRANT ALL PRIVILEGES ON points_app.* TO 'points_app'@'localhost';
FLUSH PRIVILEGES;
MYSQLEOF

# 导入数据库结构
mysql -u points_app -pGuanDongFang2024!@# points_app < sql/init.sql

# 申请SSL证书
certbot --nginx -d api.guandongfang.cn --email admin@guandongfang.cn --agree-tos --non-interactive --quiet

# 配置nginx
cp nginx.conf /etc/nginx/sites-available/api.guandongfang.cn
ln -sf /etc/nginx/sites-available/api.guandongfang.cn /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 部署应用
cd /app
npm install --production
npm run build

# 启动应用
pm2 start ecosystem.config.js
pm2 startup
pm2 save

echo "🎉 部署完成！"
echo "🌐 API地址: https://api.guandongfang.cn"
SERVEREOF

chmod +x $DEPLOY_TEMP/deploy-on-server.sh

# 打包并上传
echo -e "${BLUE}📤 上传代码到服务器...${NC}"
tar -czf points-deploy.tar.gz -C $DEPLOY_TEMP .

# 上传到服务器
scp -i $SSH_KEY points-deploy.tar.gz $SSH_USER@$SERVER_IP:/tmp/

# 在服务器上解压和部署
ssh -i $SSH_KEY $SSH_USER@$SERVER_IP << 'ENDSSH'
cd /app
tar -xzf /tmp/points-deploy.tar.gz
chmod +x deploy-on-server.sh
./deploy-on-server.sh
ENDSSH

# 清理临时文件
rm -rf $DEPLOY_TEMP points-deploy.tar.gz

echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "${BLUE}🧪 测试部署结果：${NC}"
echo "curl https://api.guandongfang.cn/health"
echo ""
echo -e "${YELLOW}📋 下一步配置微信公众平台：${NC}"
echo "1. 登录 https://mp.weixin.qq.com"
echo "2. 开发 → 开发管理 → 开发设置"  
echo "3. 配置request合法域名：https://api.guandongfang.cn"
echo "4. 小程序就可以正常调用API了！"
