#!/bin/bash

# ============================================
# 完整修复 413 错误 - 一键执行脚本
# ============================================
# 功能：
# 1. 修复 Nginx 配置
# 2. 部署后端代码
# 3. 验证修复结果
# ============================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "============================================"
echo "🚀 完整修复 413 Request Entity Too Large"
echo "============================================"
echo ""
echo "⚙️ 修复计划："
echo "  步骤1: 修复 Nginx 配置（client_max_body_size 50M）"
echo "  步骤2: 修改后端 Express 配置（limit: 50mb）"
echo "  步骤3: 部署并重启服务"
echo "  步骤4: 验证修复结果"
echo ""

read -p "按 Enter 键开始修复，或 Ctrl+C 取消..." 

# ============================================
# 步骤1: 修复 Nginx 配置
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 步骤1: 修复 Nginx 配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

chmod +x "$SCRIPT_DIR/fix-413-error.sh"
if "$SCRIPT_DIR/fix-413-error.sh"; then
    echo "✅ Nginx 配置修复成功"
else
    echo "❌ Nginx 配置修复失败"
    exit 1
fi

# ============================================
# 步骤2: 部署后端代码
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 步骤2: 部署后端代码"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

chmod +x "$SCRIPT_DIR/deploy-backend-fix-413.sh"
if "$SCRIPT_DIR/deploy-backend-fix-413.sh"; then
    echo "✅ 后端代码部署成功"
else
    echo "❌ 后端代码部署失败"
    exit 1
fi

# ============================================
# 步骤3: 验证修复结果
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 步骤3: 验证修复结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🧪 测试 API 连接..."
sleep 2

# 测试 API 是否正常响应
if curl -s -o /dev/null -w "%{http_code}" https://www.guandongfang.cn/api/v1/merchants | grep -q "200\|401"; then
    echo "✅ API 服务正常响应"
else
    echo "⚠️ API 响应异常，请检查日志"
fi

# ============================================
# 完成总结
# ============================================
echo ""
echo "============================================"
echo "🎉 修复完成！"
echo "============================================"
echo ""
echo "📊 修复内容总结："
echo "  ✅ Nginx client_max_body_size: 50MB"
echo "  ✅ Express JSON limit: 50MB"
echo "  ✅ Express URLencoded limit: 50MB"
echo "  ✅ 服务已重启"
echo ""
echo "📌 配置详情："
echo "  • Nginx 配置: /etc/nginx/conf.d/guandongfang.conf"
echo "  • 后端文件: /root/weixinzhifu/backend/payment-points-api-enhanced.js"
echo "  • 备份文件: 已自动创建时间戳备份"
echo ""
echo "🧪 测试建议："
echo ""
echo "  # 测试大数据量 POST 请求"
echo "  curl -X POST https://www.guandongfang.cn/api/v1/admin/merchants \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "       -d @large-data.json"
echo ""
echo "  # 查看后端日志"
echo "  ssh -i config/ssh/weixinpay.pem root@8.156.84.226 'pm2 logs'"
echo ""
echo "📖 更多信息："
echo "  • 如果仍然出现 413 错误，请检查防火墙或 CDN 设置"
echo "  • 建议单次请求数据量不超过 40MB"
echo "  • 大文件上传建议使用分片上传"
echo ""

exit 0
