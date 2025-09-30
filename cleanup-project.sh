#!/bin/bash

# 项目清理脚本
# 清理冗余的日志文件、临时文件、重复的部署文档等
# 不过度清理，保留必要的文档和配置

echo "🧹 开始清理项目冗余文件..."

# 1. 清理日志文件
echo ""
echo "📋 清理日志文件..."
rm -f backend/api-final.log
rm -f backend-deploy.log
rm -f deploy.log
rm -f backend/src/api-final.log
rm -f backend/src/api-fixed.log
rm -f backend/src/api-complete.log
rm -f backend/src/api-3003-fixed.log
rm -f backend/src/api-3003.log
rm -f backend/server.log
rm -f backend/src/simple-db-api.log
rm -f backend/simple-db-api.log
rm -f backend/simple-api.log
rm -f backend/simple-server.log
rm -f admin-frontend/frontend.log
rm -f admin-frontend/admin-dev.log
rm -f admin-frontend/admin-start.log
rm -f api-final.log

# 2. 清理重复的部署文档（保留最新的 00-项目实施状态总结.md）
echo "📄 清理重复的部署文档..."
rm -f DEPLOYMENT_SUCCESS_REPORT.md
rm -f DEPLOYMENT_COMPLETE_FINAL.md
rm -f DEPLOYMENT_SUCCESS.md
rm -f CORS_FIX_SUCCESS.md
rm -f SSL_DEPLOYMENT_READY.md
rm -f GOOD_NIGHT_SUMMARY.md
rm -f BACKEND_API_STATUS.md
rm -f deployment-summary.md

# 3. 清理重复的部署脚本（保留最完整的版本）
echo "🔧 清理重复的部署脚本..."
rm -f admin-frontend/deploy-to-server.sh
rm -f admin-frontend/server-deploy.sh
rm -f admin-frontend/server-redeploy.sh
rm -f admin-frontend/upload-verify.sh
rm -f admin-frontend/check-deployment.sh
rm -f admin-frontend/diagnose.sh

# 4. 清理临时Markdown文档
echo "📝 清理临时文档..."
rm -f admin-frontend/DEPLOY_STEPS.md
rm -f admin-frontend/DEPLOYMENT_COMPLETE.md
rm -f admin-frontend/EXECUTE_NOW.md
rm -f admin-frontend/FINAL_SUMMARY.md
rm -f admin-frontend/manual-deploy-guide.md
rm -f admin-frontend/ONE_LINE_DEPLOY.txt
rm -f admin-frontend/READY_TO_EXECUTE.md
rm -f admin-frontend/SERVER_COMMANDS.md
rm -f admin-frontend/SSH_STEPS.md
rm -f admin-frontend/URGENT_DEPLOY.md

# 5. 清理旧的压缩包
echo "📦 清理旧的压缩包..."
rm -f admin-frontend/admin-build.tar.gz
rm -f admin-frontend/react-permissions-fixed.tar.gz
rm -f admin-build.tar.gz
rm -f admin-build-20250930_020347.tar.gz

# 6. 清理临时HTML文件（保留正式的小程序文件）
echo "🌐 清理临时HTML文件..."
rm -f admin-page.html
rm -f index.html
rm -f miniprogram-payment.html

# 7. 清理旧的Nginx配置（保留生产环境使用的）
echo "⚙️  清理旧的Nginx配置文件..."
rm -f nginx-admin-config.conf
# 保留 nginx-guandongfang-fixed.conf (当前生产环境使用)

# 8. 清理旧的脚本（保留有用的）
echo "🔨 清理旧的脚本..."
rm -f auto-deploy.sh
rm -f check-security-group.sh
rm -f configure-ssl.sh
rm -f deploy-to-aliyun.sh
rm -f setup-ssl.sh
rm -f test-server-connection.sh

# 9. 清理archive中的测试文件（已归档，可删除）
echo "🗑️  清理archive中的测试文件..."
rm -rf archive/temp-servers/
rm -rf archive/测试文件/

# 10. 清理back目录的备份
echo "💾 清理备份目录..."
rm -rf back/

# 11. 清理config中的临时文件
echo "📋 清理config中的临时文件..."
rm -f config/clean-preview.html
rm -f config/preview.html
rm -f config/simple-server.js
rm -f config/test-server.js
rm -f config/auto-deploy.ps1
rm -f config/deploy-real.ps1
rm -f config/upload.bat
rm -f config/auto-ssh.exp
rm -f config/ssh-password.txt

# 12. 清理admin-simple目录（已有完整的admin-frontend）
echo "🚮 清理简化版admin目录..."
rm -rf admin-simple/

# 13. 清理旧的进度文档（保留在docs中的正式版本）
echo "📊 清理旧的进度文档..."
rm -f progress.md
rm -f progress-enhanced.md
rm -f access-status.md
rm -f claude.md

echo ""
echo "✅ 清理完成！"
echo ""
echo "保留的重要文件："
echo "  ✅ docs/ - 完整的项目文档"
echo "  ✅ backend/payment-points-api-enhanced.js - 生产环境后端"
echo "  ✅ admin-frontend/build/ - 前端构建产物"
echo "  ✅ frontend/miniprogram/ - 微信小程序"
echo "  ✅ nginx-guandongfang-fixed.conf - 生产Nginx配置"
echo "  ✅ deploy-admin-complete.sh - 管理后台部署脚本"
echo "  ✅ deploy-backend-complete.sh - 后端部署脚本"
echo "  ✅ deploy-ssl-cert.sh - SSL证书部署脚本"
echo "  ✅ weixinpay.pem - SSH密钥"
echo ""
echo "如需恢复文件，请使用 git checkout 命令"
