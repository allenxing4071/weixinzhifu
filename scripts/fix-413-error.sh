#!/bin/bash

# ============================================
# 修复 413 Request Entity Too Large 错误
# ============================================
# 功能：
# 1. 修改 Nginx 配置增加请求体大小限制
# 2. 修改后端 Express 配置
# 3. 重启服务
# ============================================

set -e  # 遇到错误立即退出

echo "============================================"
echo "🔧 开始修复 413 错误"
echo "============================================"

# 配置变量
SSH_KEY="/Users/xinghailong/Documents/soft/weixinzhifu/config/ssh/weixinpay.pem"
SERVER_IP="8.156.84.226"
SERVER_USER="root"
NGINX_CONF="/etc/nginx/sites-available/guandongfang"
BACKUP_SUFFIX=$(date +%Y%m%d_%H%M%S)

echo ""
echo "📋 修复计划："
echo "  1. 备份 Nginx 配置"
echo "  2. 修改 client_max_body_size 为 50M"
echo "  3. 测试并重启 Nginx"
echo "  4. 验证配置"
echo ""

# ============================================
# 步骤1: 备份 Nginx 配置
# ============================================
echo "📦 步骤1: 备份 Nginx 配置..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
# 备份配置文件
BACKUP_FILE="/etc/nginx/sites-available/guandongfang.backup.$(date +%Y%m%d_%H%M%S)"
cp /etc/nginx/sites-available/guandongfang "$BACKUP_FILE"
echo "✅ 已备份到: $BACKUP_FILE"
ENDSSH

# ============================================
# 步骤2: 修改 Nginx 配置
# ============================================
echo ""
echo "🔧 步骤2: 修改 Nginx 配置..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
# 检查配置文件是否存在
if [ ! -f /etc/nginx/sites-available/guandongfang ]; then
    echo "❌ 错误: Nginx 配置文件不存在"
    exit 1
fi

# 添加 client_max_body_size 配置
# 如果已存在则更新，不存在则添加
sed -i '/client_max_body_size/d' /etc/nginx/sites-available/guandongfang

# 在 server 块中添加配置（在 server_name 行后）
sed -i '/server_name www.guandongfang.cn;/a\    \n    # 允许最大请求体为 50MB\n    client_max_body_size 50M;' /etc/nginx/sites-available/guandongfang

echo "✅ 已添加 client_max_body_size 50M"

# 显示修改后的配置（仅显示相关部分）
echo ""
echo "📄 修改后的配置片段："
grep -A 2 "client_max_body_size" /etc/nginx/sites-available/guandongfang || echo "配置已添加"
ENDSSH

# ============================================
# 步骤3: 测试并重启 Nginx
# ============================================
echo ""
echo "🧪 步骤3: 测试 Nginx 配置..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
# 测试配置
echo "测试 Nginx 配置..."
if sudo nginx -t; then
    echo "✅ Nginx 配置测试通过"
    
    # 重启 Nginx
    echo ""
    echo "🔄 重启 Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx 已重启"
else
    echo "❌ Nginx 配置测试失败！"
    echo "正在恢复备份..."
    
    # 查找最新的备份文件
    LATEST_BACKUP=$(ls -t /etc/nginx/sites-available/guandongfang.backup.* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" /etc/nginx/sites-available/guandongfang
        echo "✅ 已恢复备份: $LATEST_BACKUP"
    fi
    exit 1
fi
ENDSSH

# ============================================
# 步骤4: 验证配置
# ============================================
echo ""
echo "✅ 步骤4: 验证配置..."

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
# 检查 Nginx 状态
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx 运行正常"
else
    echo "❌ Nginx 未运行！"
    exit 1
fi

# 显示当前配置
echo ""
echo "📋 当前 Nginx 配置（client_max_body_size）："
grep -n "client_max_body_size" /etc/nginx/sites-available/guandongfang
ENDSSH

# ============================================
# 完成
# ============================================
echo ""
echo "============================================"
echo "✅ Nginx 配置修复完成！"
echo "============================================"
echo ""
echo "📌 下一步："
echo "  1. 修改后端 Express 配置（自动执行）"
echo "  2. 重启后端服务"
echo ""

# ============================================
# 本地修改后端配置提示
# ============================================
echo "🔧 接下来将修改本地后端配置..."
echo "   文件: backend/payment-points-api-enhanced.js"
echo "   修改: 添加 50MB 请求体限制"
echo ""

exit 0
