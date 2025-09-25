#!/bin/bash

# 简化版部署脚本 - 如果自动化脚本有问题可以用这个

echo "🚀 简化版生产环境部署"
echo "================================="

# 第1步：准备部署包
echo "📦 准备部署包..."
rm -rf deploy-package
mkdir -p deploy-package

cp -r backend deploy-package/
cp -r frontend deploy-package/
cp production-final.env deploy-package/.env
cp nginx-guandongfang.conf deploy-package/
cp pm2-guandongfang.config.js deploy-package/

# 清理
find deploy-package -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# 创建tar包
tar -czf points-system-deploy.tar.gz -C deploy-package .
echo "✅ 部署包创建完成"

echo "📋 手动部署步骤："
echo "1. 上传文件到服务器:"
echo "   scp points-system-deploy.tar.gz root@8.156.84.226:/tmp/"
echo ""
echo "2. SSH登录服务器:"
echo "   ssh root@8.156.84.226  (密码: Xhl_196312)"
echo ""
echo "3. 在服务器执行:"
echo "   mkdir -p /app/points-system"
echo "   cd /app/points-system"
echo "   tar -xzf /tmp/points-system-deploy.tar.gz"
echo "   cd backend"
echo "   npm install --production"
echo "   npm run build"
echo ""
echo "4. 配置数据库:"
echo "   mysql -e \"CREATE DATABASE IF NOT EXISTS points_app;\""
echo "   mysql -e \"CREATE USER IF NOT EXISTS 'points_app'@'localhost' IDENTIFIED BY 'GuanDongFang2024!@#';\""
echo "   mysql -e \"GRANT ALL PRIVILEGES ON points_app.* TO 'points_app'@'localhost';\""
echo "   mysql -u points_app -p'GuanDongFang2024!@#' points_app < sql/init.sql"
echo ""
echo "5. 启动服务:"
echo "   cd /app/points-system"
echo "   pm2 start pm2-guandongfang.config.js"
echo "   pm2 save"
echo ""
echo "6. 配置Nginx:"
echo "   cp nginx-guandongfang.conf /etc/nginx/sites-available/api.guandongfang.cn"
echo "   ln -sf /etc/nginx/sites-available/api.guandongfang.cn /etc/nginx/sites-enabled/"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "7. 申请SSL证书:"
echo "   certbot --nginx -d api.guandongfang.cn --email admin@guandongfang.cn --agree-tos"
echo ""
echo "8. 测试:"
echo "   curl https://api.guandongfang.cn/health"

rm -rf deploy-package
