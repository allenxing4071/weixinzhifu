#!/bin/bash
# 服务器修复和部署脚本

echo "🔧 开始修复服务器问题..."

# 进入项目目录
cd /app

# 检查dist目录
echo "📁 检查dist目录..."
if [ ! -d "dist" ]; then
    echo "❌ dist目录不存在，开始编译..."
    npm run build
else
    echo "✅ dist目录存在"
    ls -la dist/
fi

# 停止现有服务
echo "🛑 停止现有PM2服务..."
pm2 delete all || true

# 重新编译
echo "🔧 重新编译TypeScript..."
npm run build

# 检查编译结果
echo "📋 检查编译结果..."
ls -la dist/

# 测试应用启动
echo "🧪 测试应用启动..."
node dist/app.js &
APP_PID=$!
sleep 3

# 测试API
echo "🌐 测试API..."
curl -s http://localhost:3000/health || echo "API测试失败"

# 停止测试进程
kill $APP_PID 2>/dev/null || true

# 启动PM2服务
echo "🚀 启动PM2服务..."
pm2 start ecosystem.config.js

# 检查状态
echo "📊 检查服务状态..."
pm2 status

# 测试API服务
echo "🧪 测试API服务..."
curl -s http://localhost:3000/health

echo "✅ 修复完成！"
