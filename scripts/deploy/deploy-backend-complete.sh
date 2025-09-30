#!/bin/bash
# 完整的后端API部署脚本
# 功能：构建TypeScript应用 → 上传到服务器 → 配置PM2 → 重启服务

set -e  # 遇到错误立即退出

echo "🚀 开始部署后端API到阿里云服务器..."
echo "================================================"

# 配置变量
SERVER_IP="8.156.84.226"
SERVER_USER="root"
SSH_KEY="../../config/ssh/weixinpay.pem"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 步骤1: 构建TypeScript应用
echo ""
echo "📦 步骤1: 构建TypeScript应用..."
cd backend

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

# 构建
echo "🔨 开始构建..."
npm run build

if [ ! -f "dist/app.js" ]; then
    echo "❌ 错误: 构建失败，找不到 dist/app.js"
    exit 1
fi

echo "✅ 构建完成"
cd ..

# 步骤2: 压缩dist目录和package.json
echo ""
echo "📦 步骤2: 压缩后端文件..."
cd backend
tar -czf "../backend-dist-${TIMESTAMP}.tar.gz" dist/ package.json package-lock.json
cd ..
echo "✅ 压缩完成: backend-dist-${TIMESTAMP}.tar.gz ($(du -h backend-dist-${TIMESTAMP}.tar.gz | cut -f1))"

# 步骤3: 上传到服务器
echo ""
echo "📤 步骤3: 上传到服务器..."
scp -i "$SSH_KEY" "backend-dist-${TIMESTAMP}.tar.gz" ${SERVER_USER}@${SERVER_IP}:/tmp/
echo "✅ 上传完成"

# 步骤4: 在服务器上执行部署
echo ""
echo "🔧 步骤4: 在服务器上执行部署..."
ssh -i "$SSH_KEY" ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

echo "  → 备份当前backend目录..."
if [ -d /root/backend ]; then
    mv /root/backend /root/backend.backup.$(date +%Y%m%d_%H%M%S)
    echo "  ✅ 备份完成"
fi

echo "  → 创建新的backend目录并解压..."
mkdir -p /root/backend
cd /root/backend
tar -xzf /tmp/backend-dist-*.tar.gz
echo "  ✅ 解压完成"

echo "  → 安装生产依赖..."
npm install --production
echo "  ✅ 依赖安装完成"

echo "  → 检查环境变量文件..."
if [ ! -f .env ]; then
    echo "  ⚠️  警告: .env文件不存在，创建默认配置..."
    cat > .env << 'EOF'
# 应用配置
NODE_ENV=production
PORT=3000
APP_NAME=积分管理系统
APP_VERSION=1.0.0

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=points_system
DB_USER=root
DB_PASSWORD=root

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# 管理员JWT配置
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key-change-in-production
ADMIN_JWT_EXPIRES_IN=24h

# 安全配置
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS配置
ALLOWED_ORIGINS=*
EOF
    echo "  ✅ 默认.env文件已创建"
else
    echo "  ✅ .env文件已存在"
fi

echo "  → 停止旧的PM2进程..."
pm2 stop payment-points-api-final 2>/dev/null || true
pm2 delete payment-points-api-final 2>/dev/null || true
echo "  ✅ 旧进程已停止"

echo "  → 创建PM2配置文件..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'points-api-backend',
    script: 'dist/app.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/.pm2/logs/points-api-backend-error.log',
    out_file: '/root/.pm2/logs/points-api-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF
echo "  ✅ PM2配置文件已创建"

echo "  → 启动新的API服务..."
pm2 start ecosystem.config.js
pm2 save
echo "  ✅ API服务已启动"

echo "  → 等待服务启动..."
sleep 3

echo "  → 测试API健康检查..."
HEALTH_CHECK=$(curl -s http://localhost:3000/health || echo "failed")
if echo "$HEALTH_CHECK" | grep -q "success"; then
    echo "  ✅ API服务健康检查通过"
else
    echo "  ❌ 警告: API服务健康检查失败"
fi

echo "  → 清理临时文件..."
rm -f /tmp/backend-dist-*.tar.gz
echo "  ✅ 清理完成"

ENDSSH

echo ""
echo "✅ 部署完成！"
echo ""

# 步骤5: 验证部署
echo "🔍 步骤5: 验证部署..."
echo ""

# 测试健康检查
echo "测试健康检查..."
sleep 2
HEALTH_RESPONSE=$(curl -s http://${SERVER_IP}:3000/health || echo "failed")
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo "✅ 健康检查通过"
else
    echo "⚠️  警告: 健康检查未通过，检查服务状态"
fi

# 步骤6: 清理本地临时文件
echo ""
echo "🧹 步骤6: 清理本地临时文件..."
rm -f "backend-dist-${TIMESTAMP}.tar.gz"
echo "✅ 本地临时文件已清理"

echo ""
echo "================================================"
echo "🎉 后端API部署流程全部完成！"
echo ""
echo "📝 服务信息:"
echo "  - API服务名称: points-api-backend"
echo "  - 运行端口: 3000"
echo "  - 健康检查: http://localhost:3000/health"
echo ""
echo "📊 管理后台API路由:"
echo "  - POST   /api/v1/admin/auth/login         - 管理员登录"
echo "  - GET    /api/v1/admin/dashboard/stats    - 仪表板统计"
echo "  - GET    /api/v1/admin/users              - 用户列表"
echo "  - GET    /api/v1/admin/merchants          - 商户列表"
echo "  - GET    /api/v1/admin/orders             - 订单列表"
echo ""
echo "🔍 检查命令:"
echo "  - 查看服务状态: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
echo "  - 查看服务日志: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'pm2 logs points-api-backend'"
echo "  - 重启服务: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'pm2 restart points-api-backend'"
echo ""
