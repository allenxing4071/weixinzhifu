#!/bin/bash
# 项目清理脚本
# 日期: 2025-10-03

echo "=========================================="
echo "  开始清理项目..."
echo "=========================================="
echo ""

# 阶段1: 清理系统临时文件
echo "🗑️  阶段1: 清理系统临时文件..."
find . -name ".DS_Store" -delete
rm -f backend/logs/*.log
echo "✅ 完成"
echo ""

# 阶段2: 创建新目录结构
echo "📁 阶段2: 创建新目录结构..."
mkdir -p docs/reports
mkdir -p scripts/test
mkdir -p archive/deprecated-backend
mkdir -p archive/deprecated-docs
echo "✅ 完成"
echo ""

# 阶段3: 移动日期报告
echo "📚 阶段3: 整理日期报告..."
[ -f "DEPLOYMENT_REPORT_20251003.md" ] && mv DEPLOYMENT_REPORT_20251003.md docs/reports/2025-10-03-部署报告.md
[ -f "HOTFIX_20251003_USER_STATUS.md" ] && mv HOTFIX_20251003_USER_STATUS.md docs/reports/2025-10-03-用户状态紧急修复.md
[ -f "docs/00-2025年9月30日完成工作总结.md" ] && mv "docs/00-2025年9月30日完成工作总结.md" docs/reports/2025-09-30-完成工作总结.md
[ -f "docs/00-2025年10月1日后端全局优化总结.md" ] && mv "docs/00-2025年10月1日后端全局优化总结.md" docs/reports/2025-10-01-后端全局优化.md
[ -f "docs/00-2025年10月1日微观细节优化记录.md" ] && mv "docs/00-2025年10月1日微观细节优化记录.md" docs/reports/2025-10-01-微观细节优化.md
[ -f "docs/00-2025年10月2日用户状态修复总结.md" ] && mv "docs/00-2025年10月2日用户状态修复总结.md" docs/reports/2025-10-02-用户状态修复.md
[ -f "docs/00-413错误修复记录.md" ] && mv "docs/00-413错误修复记录.md" docs/reports/2024-XX-XX-413错误修复.md
echo "✅ 完成"
echo ""

# 阶段4: 移动测试脚本
echo "🧪 阶段4: 整理测试脚本..."
[ -f "complete-functional-test.sh" ] && mv complete-functional-test.sh scripts/test/
[ -f "test-all-apis.sh" ] && mv test-all-apis.sh scripts/test/
echo "✅ 完成"
echo ""

# 阶段5: 归档冗余文件
echo "📦 阶段5: 归档冗余文件..."
[ -f "backend/payment-points-api-enhanced.js" ] && mv backend/payment-points-api-enhanced.js archive/deprecated-backend/
[ -f "backend/payment-points-api-optimized.js" ] && mv backend/payment-points-api-optimized.js archive/deprecated-backend/
[ -f "backend/server.js" ] && mv backend/server.js archive/deprecated-backend/
[ -f "backend/server-optimized.js" ] && mv backend/server-optimized.js archive/deprecated-backend/
[ -f "BACKEND_OPTIMIZATION_V2.md" ] && mv BACKEND_OPTIMIZATION_V2.md archive/deprecated-docs/
[ -f "DEPLOY_NOW.md" ] && mv DEPLOY_NOW.md archive/deprecated-docs/
[ -f "MANUAL_DEPLOY.md" ] && mv MANUAL_DEPLOY.md archive/deprecated-docs/
[ -f "OPTIMIZATION_FILE_LIST.md" ] && mv OPTIMIZATION_FILE_LIST.md archive/deprecated-docs/
echo "✅ 完成"
echo ""

echo "=========================================="
echo "  ✅ 清理完成！"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 查看变更: git status"
echo "2. 提交变更: git add -A && git commit -m '🧹 整理项目结构'"
echo ""
