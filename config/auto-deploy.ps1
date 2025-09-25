# 自动化部署脚本
$serverIP = "8.156.84.226"
$username = "root"
$password = "Xhl_196312"

Write-Host "🚀 开始自动部署到阿里云服务器..." -ForegroundColor Green

# 步骤1：上传代码包
Write-Host "📤 步骤1：上传代码包..."
scp guandongfang-points.tar.gz root@${serverIP}:/tmp/

# 步骤2：在服务器执行部署
Write-Host "🔧 步骤2：在服务器执行部署命令..."

$deployCommands = @"
echo '🔧 开始服务器配置...'
mkdir -p /app/points-system
cd /app/points-system
tar -xzf /tmp/guandongfang-points.tar.gz
echo '📦 代码解压完成'

echo '🔧 安装Node.js环境...'
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

echo '📦 安装项目依赖...'
cd backend
npm install --production
npm run build

echo '🗄️ 配置数据库...'
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

mysql << 'MYSQL_EOF'
CREATE DATABASE IF NOT EXISTS points_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'points_app'@'localhost' IDENTIFIED BY 'GuanDongFang2024!@#';
GRANT ALL PRIVILEGES ON points_app.* TO 'points_app'@'localhost';
FLUSH PRIVILEGES;
MYSQL_EOF

mysql -u points_app -p'GuanDongFang2024!@#' points_app < sql/init.sql

echo '🚀 启动应用服务...'
cd /app/points-system
npm install -g pm2
pm2 start pm2-guandongfang.config.js
pm2 startup
pm2 save

echo '🌐 配置Nginx...'
apt install -y nginx certbot python3-certbot-nginx
cp nginx-guandongfang.conf /etc/nginx/sites-available/api.guandongfang.cn
ln -sf /etc/nginx/sites-available/api.guandongfang.cn /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo '🔒 申请SSL证书...'
certbot --nginx -d api.guandongfang.cn --email admin@guandongfang.cn --agree-tos --non-interactive

echo '✅ 部署完成！测试API...'
curl http://localhost:3000/health
curl https://api.guandongfang.cn/health

echo '🎉 积分系统部署成功！'
"@

ssh root@$serverIP $deployCommands

Write-Host "✅ 部署完成！" -ForegroundColor Green
