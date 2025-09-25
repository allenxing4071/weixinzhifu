#!/bin/bash

# 微信支付积分系统 - 生产环境部署脚本
# 版本: v1.0.0
# 作者: 产品开发团队

set -e  # 遇到错误立即停止

echo "🚀 开始生产环境部署..."
echo "服务器: 8.156.84.226"
echo "域名: api.guandongfang.cn"
echo "项目: 微信支付积分赠送系统"
echo "================================="

# 配置变量
SERVER_IP="8.156.84.226"
SERVER_USER="root"
SERVER_PASSWORD="Xhl_196312"
DOMAIN="api.guandongfang.cn"
PROJECT_NAME="points-system"
DEPLOY_PATH="/app/${PROJECT_NAME}"

# 第1步：准备部署包
echo "📦 第1步：准备部署包..."
rm -rf deploy-package
mkdir -p deploy-package

# 复制必要文件
cp -r backend deploy-package/
cp -r frontend deploy-package/
cp production-final.env deploy-package/.env
cp nginx-guandongfang.conf deploy-package/
cp pm2-guandongfang.config.js deploy-package/
cp -r docs deploy-package/ 2>/dev/null || echo "docs目录不存在，跳过"

# 清理不必要的文件
find deploy-package -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find deploy-package -name ".git*" -exec rm -rf {} + 2>/dev/null || true
find deploy-package -name "*.log" -exec rm -f {} + 2>/dev/null || true

echo "✅ 部署包准备完成"

# 第2步：创建部署tar包
echo "📦 第2步：创建部署包..."
tar -czf points-system-deploy.tar.gz -C deploy-package .
echo "✅ 部署包创建完成: points-system-deploy.tar.gz"

# 第3步：上传到服务器
echo "🌐 第3步：上传到服务器..."
echo "正在连接服务器 ${SERVER_IP}..."

# 使用expect自动化SSH交互
expect << EOF
set timeout 30
spawn scp points-system-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
expect {
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "${SERVER_PASSWORD}\r"
    }
    timeout {
        puts "连接超时"
        exit 1
    }
}
expect eof
EOF

if [ $? -eq 0 ]; then
    echo "✅ 文件上传成功"
else
    echo "❌ 文件上传失败"
    exit 1
fi

# 第4步：在服务器上执行部署
echo "🔧 第4步：在服务器上执行部署..."

expect << 'EOF'
set timeout 60
spawn ssh root@8.156.84.226
expect {
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "Xhl_196312\r"
    }
}
expect "root@"

# 在服务器上执行部署命令
send "echo '开始服务器端部署...'\r"
send "mkdir -p /app/points-system\r"
send "cd /app/points-system\r"
send "tar -xzf /tmp/points-system-deploy.tar.gz\r"
send "echo '✅ 部署包解压完成'\r"

# 安装Node.js依赖
send "cd backend\r"
send "echo '📦 安装Node.js依赖...'\r"
send "npm install --production\r"
expect {
    "root@" { send "echo '✅ 依赖安装完成'\r" }
    timeout { send "echo '⚠️ 依赖安装超时，继续...'\r" }
}

# 编译TypeScript
send "echo '🔨 编译TypeScript...'\r"
send "npm run build\r"
expect {
    "root@" { send "echo '✅ 编译完成'\r" }
    timeout { send "echo '⚠️ 编译超时，继续...'\r" }
}

# 配置数据库
send "echo '🗄️ 配置数据库...'\r"
send "mysql -e \"CREATE DATABASE IF NOT EXISTS points_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"\r"
send "mysql -e \"CREATE USER IF NOT EXISTS 'points_app'@'localhost' IDENTIFIED BY 'GuanDongFang2024!@#';\"\r"
send "mysql -e \"GRANT ALL PRIVILEGES ON points_app.* TO 'points_app'@'localhost';\"\r"
send "mysql -e \"FLUSH PRIVILEGES;\"\r"
send "mysql -u points_app -p'GuanDongFang2024!@#' points_app < sql/init.sql\r"
send "echo '✅ 数据库配置完成'\r"

# 启动应用服务
send "cd /app/points-system\r"
send "echo '🚀 启动应用服务...'\r"
send "pm2 delete all || true\r"
send "pm2 start pm2-guandongfang.config.js\r"
send "pm2 save\r"
send "echo '✅ 应用服务启动完成'\r"

# 配置Nginx
send "echo '🌐 配置Nginx...'\r"
send "cp nginx-guandongfang.conf /etc/nginx/sites-available/api.guandongfang.cn\r"
send "ln -sf /etc/nginx/sites-available/api.guandongfang.cn /etc/nginx/sites-enabled/\r"
send "nginx -t && systemctl reload nginx\r"
send "echo '✅ Nginx配置完成'\r"

# 申请SSL证书
send "echo '🔒 申请SSL证书...'\r"
send "certbot --nginx -d api.guandongfang.cn --email admin@guandongfang.cn --agree-tos --non-interactive || echo '证书申请可能失败，请手动处理'\r"

# 测试服务
send "echo '🧪 测试服务...'\r"
send "sleep 5\r"
send "curl -s http://localhost:3000/health || echo '本地测试失败'\r"
send "curl -s https://api.guandongfang.cn/health || echo 'HTTPS测试失败'\r"

send "echo '================================'\r"
send "echo '🎉 部署完成！'\r"
send "echo '📱 API地址: https://api.guandongfang.cn'\r"
send "echo '🔍 健康检查: https://api.guandongfang.cn/health'\r"
send "echo '📋 服务状态: pm2 status'\r"
send "echo '📊 应用日志: pm2 logs'\r"
send "echo '================================'\r"

send "exit\r"
expect eof
EOF

echo "🎉 生产环境部署完成！"
echo ""
echo "📋 部署结果验证："
echo "1. API健康检查: https://api.guandongfang.cn/health"
echo "2. 微信公众平台配置域名: https://api.guandongfang.cn"
echo "3. 小程序测试: 使用微信开发者工具上传体验版"
echo ""
echo "⚠️ 如果遇到问题，请检查："
echo "- 服务器防火墙设置"
echo "- 域名DNS解析"
echo "- SSL证书状态"
echo "- 数据库连接"
echo ""
echo "🎯 下一步："
echo "1. 在微信公众平台配置合法域名"
echo "2. 上传小程序代码并设为体验版"
echo "3. 进行完整的支付流程测试"

# 清理临时文件
rm -rf deploy-package
echo "🧹 清理临时文件完成"
