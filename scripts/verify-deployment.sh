#!/bin/bash

# 生产环境部署验证脚本

echo "🔍 验证生产环境部署状态"
echo "================================="

# 测试API健康检查
echo "1. 测试API健康检查..."
if curl -s -f https://api.guandongfang.cn/health > /dev/null; then
    echo "✅ API健康检查通过"
    curl -s https://api.guandongfang.cn/health | jq . 2>/dev/null || curl -s https://api.guandongfang.cn/health
else
    echo "❌ API健康检查失败"
fi

echo ""

# 测试HTTP重定向
echo "2. 测试HTTP到HTTPS重定向..."
if curl -s -I http://api.guandongfang.cn | grep -q "301\|302"; then
    echo "✅ HTTP重定向正常"
else
    echo "❌ HTTP重定向未配置"
fi

echo ""

# 测试SSL证书
echo "3. 测试SSL证书..."
if openssl s_client -connect api.guandongfang.cn:443 -servername api.guandongfang.cn < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "✅ SSL证书有效"
else
    echo "❌ SSL证书问题"
fi

echo ""

# 测试API接口
echo "4. 测试API接口..."
echo "  - 测试API文档接口..."
if curl -s -f https://api.guandongfang.cn/api/docs > /dev/null; then
    echo "  ✅ API文档接口正常"
else
    echo "  ❌ API文档接口失败"
fi

echo ""

# 检查域名解析
echo "5. 检查域名解析..."
if nslookup api.guandongfang.cn > /dev/null 2>&1; then
    echo "✅ 域名解析正常"
    echo "  IP地址: $(nslookup api.guandongfang.cn | grep -A1 "Name:" | tail -1 | awk '{print $2}')"
else
    echo "❌ 域名解析失败"
fi

echo ""

# 生成小程序配置清单
echo "6. 小程序配置清单..."
echo "📱 微信公众平台配置："
echo "  - 登录: https://mp.weixin.qq.com"
echo "  - AppID: wx9bed12ef0904d035"
echo "  - request合法域名: https://api.guandongfang.cn"
echo "  - uploadFile合法域名: https://api.guandongfang.cn"
echo "  - downloadFile合法域名: https://api.guandongfang.cn"

echo ""

# 生成测试用例
echo "7. 测试用例生成..."
echo "🧪 手动测试步骤："
echo "  1. 打开微信开发者工具"
echo "  2. 导入项目: frontend/miniprogram"
echo "  3. 编译并预览"
echo "  4. 真机测试登录流程"
echo "  5. 测试支付流程（沙箱环境）"

echo ""

echo "🎯 部署验证完成！"
if curl -s -f https://api.guandongfang.cn/health > /dev/null; then
    echo "🎉 生产环境部署成功！"
    echo "📡 API服务地址: https://api.guandongfang.cn"
    echo "📋 健康检查: https://api.guandongfang.cn/health"
    echo "📚 API文档: https://api.guandongfang.cn/api/docs"
else
    echo "⚠️ 还需要完成服务器端修复"
    echo "请执行: ./fix-deployment-issues.sh 中的命令"
fi
