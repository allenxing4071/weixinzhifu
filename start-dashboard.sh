#!/bin/bash

# 微信支付积分系统 - 开发者控制台启动脚本

echo "🎯 微信支付积分系统 - 开发者控制台"
echo "======================================"
echo ""

# 检查端口是否被占用
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，尝试使用端口 8081"
    PORT=8081
fi

# 检查是否安装了Python3
if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python3 启动HTTP服务器"
    echo "📡 访问地址: http://localhost:$PORT/dashboard.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo "======================================"
    echo ""
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "✅ 使用 Python 启动HTTP服务器"
    echo "📡 访问地址: http://localhost:$PORT/dashboard.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo "======================================"
    echo ""
    python -m SimpleHTTPServer $PORT
elif command -v npx &> /dev/null; then
    echo "✅ 使用 Node.js http-server 启动"
    echo "📡 访问地址: http://localhost:$PORT/dashboard.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo "======================================"
    echo ""
    npx -y http-server -p $PORT
else
    echo "❌ 错误: 未找到 Python 或 Node.js"
    echo ""
    echo "请安装以下工具之一:"
    echo "  - Python 3: brew install python3"
    echo "  - Node.js: brew install node"
    exit 1
fi

