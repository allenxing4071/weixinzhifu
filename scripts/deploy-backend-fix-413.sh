#!/bin/bash

# ============================================
# 部署修复后的后端代码
# ============================================
# 功能：上传并重启后端服务
# ============================================

set -e

echo "============================================"
echo "🚀 部署后端修复代码"
echo "============================================"

# 配置变量
SSH_KEY="/Users/xinghailong/Documents/soft/weixinzhifu/config/ssh/weixinpay.pem"
SERVER_IP="8.156.84.226"
SERVER_USER="root"
BACKEND_DIR="/root/weixinzhifu/backend"
LOCAL_FILE="/Users/xinghailong/Documents/soft/weixinzhifu/backend/payment-points-api-enhanced.js"

echo ""
echo "📋 部署步骤："
echo "  1. 备份服务器上的后端文件"
echo "  2. 上传修复后的代码"
echo "  3. 重启 PM2 服务"
echo "  4. 验证服务状态"
echo ""

# ============================================
# 步骤1: 备份服务器文件
# ============================================
echo "📦 步骤1: 备份服务器文件..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << ENDSSH
# 备份原文件
BACKUP_FILE="${BACKEND_DIR}/payment-points-api-enhanced.js.backup.\$(date +%Y%m%d_%H%M%S)"
cp ${BACKEND_DIR}/payment-points-api-enhanced.js "\$BACKUP_FILE"
echo "✅ 已备份到: \$BACKUP_FILE"
ENDSSH

# ============================================
# 步骤2: 上传修复后的代码
# ============================================
echo ""
echo "📤 步骤2: 上传修复后的代码..."

scp -i "$SSH_KEY" "$LOCAL_FILE" "$SERVER_USER@$SERVER_IP:$BACKEND_DIR/"

if [ $? -eq 0 ]; then
    echo "✅ 代码上传成功"
else
    echo "❌ 代码上传失败"
    exit 1
fi

# ============================================
# 步骤3: 重启 PM2 服务
# ============================================
echo ""
echo "🔄 步骤3: 重启 PM2 服务..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
# 重启 PM2
cd /root/weixinzhifu/backend
pm2 restart all

echo "✅ PM2 服务已重启"

# 等待服务启动
sleep 3
ENDSSH

# ============================================
# 步骤4: 验证服务状态
# ============================================
echo ""
echo "✅ 步骤4: 验证服务状态..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
# 查看 PM2 状态
echo "📊 PM2 进程状态："
pm2 list

echo ""
echo "📋 最新日志（最近 20 行）："
pm2 logs --lines 20 --nostream
ENDSSH

# ============================================
# 完成
# ============================================
echo ""
echo "============================================"
echo "✅ 后端部署完成！"
echo "============================================"
echo ""
echo "📌 修改内容："
echo "  • Express 请求体限制: 50MB"
echo "  • 支持 JSON 和 URL-encoded 数据"
echo ""
echo "🧪 测试建议："
echo "  curl -X POST https://www.guandongfang.cn/api/v1/test \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"test\": \"data\"}'"
echo ""

exit 0
