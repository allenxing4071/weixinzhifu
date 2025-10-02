#!/bin/bash

# 用户状态管理修复部署脚本
# 版本: 1.0.0
# 日期: 2025-10-02
# 说明: 修复用户状态显示和管理功能

set -e

echo "=========================================="
echo "  用户状态管理修复部署脚本"
echo "=========================================="
echo ""

# 配置变量
SERVER_IP="8.156.84.226"
SERVER_USER="root"
PROJECT_ROOT="/Users/xinghailong/Documents/soft/weixinzhifu"
SSH_KEY="${PROJECT_ROOT}/config/ssh/weixinpay.pem"
DB_NAME="weixin_payment"
DB_USER="root"
FRONTEND_BUILD_DIR="${PROJECT_ROOT}/admin-frontend/build"
SERVER_WEB_DIR="/var/www/admin"
SQL_FILE="${PROJECT_ROOT}/backend/sql/fix_users_status.sql"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 步骤1: 构建前端
echo ""
print_info "步骤1: 构建前端代码..."
cd ${PROJECT_ROOT}/admin-frontend
npm run build
if [ $? -eq 0 ]; then
    print_info "✅ 前端构建成功"
else
    print_error "❌ 前端构建失败"
    exit 1
fi
cd ${PROJECT_ROOT}

# 步骤2: 备份当前前端代码
echo ""
print_info "步骤2: 备份服务器上的前端代码..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
if [ -d /var/www/admin ]; then
    BACKUP_DIR="/var/www/admin_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r /var/www/admin $BACKUP_DIR
    echo "备份保存至: $BACKUP_DIR"
fi
EOF
print_info "✅ 前端代码备份完成"

# 步骤3: 部署前端代码
echo ""
print_info "步骤3: 部署新的前端代码..."
scp -i $SSH_KEY -r $FRONTEND_BUILD_DIR/* $SERVER_USER@$SERVER_IP:$SERVER_WEB_DIR/
if [ $? -eq 0 ]; then
    print_info "✅ 前端代码部署成功"
else
    print_error "❌ 前端代码部署失败"
    exit 1
fi

# 步骤4: 上传SQL修复脚本
echo ""
print_info "步骤4: 上传数据库修复脚本..."
scp -i $SSH_KEY $SQL_FILE $SERVER_USER@$SERVER_IP:/tmp/fix_users_status.sql
if [ $? -eq 0 ]; then
    print_info "✅ SQL脚本上传成功"
else
    print_error "❌ SQL脚本上传失败"
    exit 1
fi

# 步骤5: 执行数据库修复
echo ""
print_warning "步骤5: 准备执行数据库修复..."
print_warning "⚠️  即将修改数据库表结构，请确认继续"
read -p "是否继续执行数据库修复? (yes/no): " confirm

if [ "$confirm" == "yes" ]; then
    print_info "执行数据库修复脚本..."
    
    # 提示输入数据库密码
    echo ""
    print_warning "请在下一步输入MySQL数据库密码"
    
    ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
echo "执行SQL修复脚本..."
mysql -u root -p weixin_payment < /tmp/fix_users_status.sql

# 验证修复结果
echo ""
echo "========== 验证结果 =========="
mysql -u root -p weixin_payment -e "SHOW COLUMNS FROM users LIKE 'status';"
echo ""
mysql -u root -p weixin_payment -e "SELECT status, COUNT(*) as count FROM users GROUP BY status;"
echo "============================="

# 清理临时文件
rm /tmp/fix_users_status.sql
EOF

    if [ $? -eq 0 ]; then
        print_info "✅ 数据库修复成功"
    else
        print_error "❌ 数据库修复失败"
        exit 1
    fi
else
    print_warning "⚠️  跳过数据库修复步骤"
    print_warning "请手动执行: backend/sql/fix_users_status.sql"
fi

# 步骤6: 清理Nginx缓存
echo ""
print_info "步骤6: 清理Nginx缓存..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
nginx -t && nginx -s reload
echo "Nginx配置已重载"
EOF
print_info "✅ Nginx缓存清理完成"

# 步骤7: 验证部署
echo ""
print_info "步骤7: 验证部署结果..."
echo ""
print_info "请访问以下URL进行验证:"
echo "  - https://www.guandongfang.cn/admin/"
echo ""
print_warning "验证清单:"
echo "  1. 用户列表状态显示是否正确 (✅正常 / 🔒已锁定)"
echo "  2. 状态过滤器是否可以正常使用"
echo "  3. 锁定/解锁按钮功能是否正常"
echo "  4. 用户详情弹窗状态显示是否正确"
echo ""
print_warning "建议: 清理浏览器缓存或使用 Ctrl+F5 强制刷新"

# 完成
echo ""
echo "=========================================="
print_info "🎉 部署完成！"
echo "=========================================="
echo ""
print_info "修改文件清单:"
echo "  - backend/sql/fix_users_status.sql (新增)"
echo "  - admin-frontend/src/App.tsx (修改)"
echo "  - admin-frontend/src/types/index.ts (修改)"
echo ""
print_info "详细修复记录请查看:"
echo "  docs/02-技术实现/08-用户状态管理修复记录.md"
echo ""

