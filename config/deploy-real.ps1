# 真实环境部署脚本
$ErrorActionPreference = "Stop"

Write-Host "🚀 开始部署真实环境..." -ForegroundColor Green
Write-Host "🌐 目标服务器: 8.156.84.226" -ForegroundColor Blue
Write-Host "🏷️  域名: api.guandongfang.cn" -ForegroundColor Blue

# 使用plink处理SSH连接（如果有PuTTY）
$commands = @"
echo '🔧 开始部署积分系统...'
mkdir -p /app/points-system
cd /app/points-system
tar -xzf /tmp/guandongfang-points.tar.gz
cp production-final.env .env
echo '📦 文件准备完成'

echo '🔧 安装Node.js 18...'
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version

echo '📦 安装依赖...'
cd backend
npm install --production
npm run build

echo '🗄️ 配置MySQL...'
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

mysql << 'MYSQLEOF'
CREATE DATABASE IF NOT EXISTS points_app CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'points_app'@'localhost' IDENTIFIED BY 'GuanDongFang2024!@#';
GRANT ALL PRIVILEGES ON points_app.* TO 'points_app'@'localhost';
FLUSH PRIVILEGES;
MYSQLEOF

mysql -u points_app -p'GuanDongFang2024!@#' points_app < sql/init.sql

echo '🚀 启动应用...'
npm install -g pm2
cd /app/points-system
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

echo '✅ 测试API...'
curl -s https://api.guandongfang.cn/health

echo '🎉 部署完成！'
"@

# 先上传文件
Write-Host "📤 上传部署包..." -ForegroundColor Yellow
$uploadResult = cmd /c "echo Xhl_196312 | scp guandongfang-points.tar.gz root@8.156.84.226:/tmp/ 2>&1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 文件上传成功" -ForegroundColor Green
    
    # 执行部署命令
    Write-Host "🔧 执行部署..." -ForegroundColor Yellow
    $deployResult = cmd /c "echo Xhl_196312 | ssh root@8.156.84.226 `"$commands`" 2>&1"
    
    Write-Host "部署结果:" -ForegroundColor Blue
    Write-Host $deployResult
} else {
    Write-Host "❌ 文件上传失败" -ForegroundColor Red
    Write-Host $uploadResult
}
