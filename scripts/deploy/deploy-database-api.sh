#!/bin/bash

# ==============================================
# 数据库管理API部署脚本
# ==============================================

set -e

# 配置
SERVER_IP="8.156.84.226"
SERVER_USER="root"
SSH_KEY="config/ssh/weixinpay.pem"
BACKEND_PATH="/root/weixinzhifu/backend"
SERVICE_NAME="payment-points-api-enhanced"

echo "🚀 开始部署数据库管理API..."
echo ""

# 1. 连接服务器并拉取最新代码
echo "📥 1/3 从GitHub拉取最新代码..."
ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/weixinzhifu
git pull origin main
echo "✅ 代码更新成功"
ENDSSH

echo ""

# 2. 重启PM2服务
echo "🔄 2/3 重启后端服务..."
ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# 查找并重启服务
pm2 restart payment-points-api-enhanced || pm2 restart payment-api || pm2 restart all
echo "✅ 服务重启成功"
ENDSSH

echo ""

# 3. 验证部署
echo "✅ 3/3 验证部署..."
echo ""
echo "请手动测试以下API:"
echo "  1. 数据库统计: curl https://www.guandongfang.cn/api/v1/admin/database/stats"
echo "  2. 表列表: curl https://www.guandongfang.cn/api/v1/admin/database/tables"
echo ""
echo "或通过数据库管理界面访问:"
echo "  http://localhost:8080/database-viewer.html"
echo ""
echo "🎉 部署完成!"
echo ""
echo "📌 服务器连接命令:"
echo "  ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP}"
echo ""
echo "📌 查看日志:"
echo "  ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP} 'pm2 logs payment-points-api-enhanced'"
echo ""

