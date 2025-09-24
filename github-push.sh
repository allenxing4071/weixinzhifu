#!/bin/bash

# GitHub推送脚本 - 使用Personal Access Token
# 使用方法: ./github-push.sh YOUR_GITHUB_TOKEN

echo "🚀 开始推送到GitHub..."

if [ -z "$1" ]; then
    echo "❌ 错误：请提供GitHub Personal Access Token"
    echo "使用方法: ./github-push.sh YOUR_TOKEN"
    exit 1
fi

TOKEN=$1
USERNAME="allenxing4071"
REPO="weixinzhifu"

echo "📝 配置Git用户信息..."
git config user.name "$USERNAME"
git config user.email "allenxing4071@gmail.com"

echo "📁 添加所有文件..."
git add .

echo "💾 提交代码..."
git commit -m "feat: 微信支付积分赠送系统完整版

🎯 完整的B2B2C积分营销系统
✅ 后端API服务 (Node.js + TypeScript + Express)  
✅ 微信小程序前端 (原生小程序)
✅ 支付积分同步功能 (1元=1积分)
✅ 用户认证和积分管理
✅ 完整的数据库设计和文档

核心功能：
- 微信登录授权 🔐
- 扫码支付功能 💳  
- 支付成功后积分发放 🎁
- 积分余额查询 💰
- 积分记录管理 📊

技术栈：
- 后端: Node.js, TypeScript, Express, MySQL, Redis
- 前端: 微信小程序原生开发
- 支付: 微信支付API
- 安全: HTTPS, JWT, 数据加密

项目完成度: 85% (开发完成，待部署验证)
通过Cursor IDE开发完成 🎨"

echo "🔗 设置远程仓库..."
git remote set-url origin https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO.git

echo "🚀 推送到GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ 推送成功！"
    echo "📱 仓库地址: https://github.com/$USERNAME/$REPO"
    echo "🔧 Cursor已连接到GitHub"
else
    echo "❌ 推送失败，请检查Token权限"
fi
