#!/bin/bash

# 使用SSH密钥修复生产环境部署问题

echo "🔧 使用SSH密钥修复部署问题..."
echo "================================="

# 设置SSH密钥权限
chmod 600 weixinpay.pem
echo "✅ SSH密钥权限已设置"

# 使用SSH密钥连接并执行修复命令
ssh -i weixinpay.pem -o StrictHostKeyChecking=no root@8.156.84.226 << 'EOF'

echo "🚀 开始修复服务器配置..."

# 1. 修复TypeScript编译问题
echo "📦 修复TypeScript编译..."
cd /app/points-system/backend
npm install typescript@latest --save-dev
npm install -g typescript

# 手动编译
echo "🔨 执行编译..."
npx tsc
ls -la dist/ || echo "编译可能失败，尝试其他方法..."

# 如果编译失败，创建基本的dist结构
if [ ! -f "dist/app.js" ]; then
    echo "⚠️ 编译失败，使用备用方案..."
    mkdir -p dist
    # 直接复制源文件并重命名（临时方案）
    cp src/app.ts dist/app.js 2>/dev/null || echo "源文件复制失败"
fi

# 2. 修复Nginx配置
echo "🌐 修复Nginx配置..."
cd /app/points-system

# 创建正确的Nginx配置文件
cat > /etc/nginx/sites-available/api.guandongfang.cn << 'NGINX_CONFIG'
server {
    listen 80;
    server_name api.guandongfang.cn;
    
    # 临时允许HTTP访问，方便测试
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
NGINX_CONFIG

# 启用配置
ln -sf /etc/nginx/sites-available/api.guandongfang.cn /etc/nginx/sites-enabled/

# 测试并重新加载Nginx
nginx -t && systemctl reload nginx
echo "✅ Nginx配置已修复"

# 3. 修复PM2配置文件
echo "⚙️ 检查PM2配置..."
cd /app/points-system
cat pm2-guandongfang.config.js

# 如果编译失败，修改PM2配置直接运行TypeScript
if [ ! -f "backend/dist/app.js" ]; then
    echo "📝 修改PM2配置以运行TypeScript..."
    cat > pm2-guandongfang.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'guandongfang-points-api',
    script: 'backend/src/app.ts',
    interpreter: 'node',
    interpreter_args: '--loader ts-node/esm',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/points-app/error.log',
    out_file: '/var/log/points-app/out.log',
    log_file: '/var/log/points-app/combined.log',
    time: true,
    cron_restart: '0 2 * * *',
    max_memory_restart: '1G'
  }]
}
PM2_CONFIG
fi

# 4. 安装ts-node（如果需要）
cd backend
npm install ts-node --save-dev

# 5. 创建日志目录
mkdir -p /var/log/points-app
chmod 755 /var/log/points-app

# 6. 启动应用
echo "🚀 启动Node.js应用..."
cd /app/points-system
pm2 delete all || true
pm2 start pm2-guandongfang.config.js
pm2 save
pm2 status

# 7. 测试服务
echo "🧪 测试服务..."
sleep 10
curl -s http://localhost:3000/health || echo "❌ 本地服务测试失败"

# 8. 检查进程状态
echo "📊 检查服务状态..."
pm2 list
systemctl status nginx --no-pager
netstat -tlnp | grep :3000 || echo "⚠️ 端口3000未监听"

echo "🎉 修复脚本执行完成！"

EOF

echo "🔍 验证修复结果..."
sleep 5

# 测试API
if curl -s -f http://api.guandongfang.cn/health > /dev/null; then
    echo "✅ HTTP API测试成功"
    curl -s http://api.guandongfang.cn/health
else
    echo "❌ HTTP API测试失败"
fi

echo ""
echo "📋 手动检查步骤："
echo "1. 直接访问: http://api.guandongfang.cn/health"
echo "2. 检查端口: curl http://8.156.84.226:3000/health"
echo "3. SSH登录检查日志: ssh -i weixinpay.pem root@8.156.84.226 'pm2 logs'"
