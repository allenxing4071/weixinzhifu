#!/bin/bash

# Git自动化配置脚本
echo "🔧 修复Git推送拉取配置..."

# 1. 确保正确的Git配置
git config user.name "allenxing4071"
git config user.email "allenxing4071@gmail.com"

# 2. 配置凭据助手
git config credential.helper osxkeychain

# 3. 设置远程仓库和上游分支
git remote set-url origin https://allenxing4071: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@github.com/allenxing4071/weixinzhifu.git
git branch -M main
git push --set-upstream origin main

# 4. 验证配置
echo "📋 验证Git配置："
echo "Remote URL:"
git remote -v
echo "Branch tracking:"
git branch -vv
echo "User config:"
git config user.name
git config user.email

echo "✅ Git配置修复完成！"
echo "现在可以直接使用: git push"
