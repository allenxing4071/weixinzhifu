#!/bin/bash
# 部署脚本 - 将优化后的代码部署到阿里云服务器
# 执行方式: bash deploy-to-server.sh

set -e  # 遇到错误立即退出

echo "======================================"
echo "🚀 开始部署到阿里云服务器"
echo "======================================"
echo ""

# 服务器信息
SERVER="root@8.156.84.226"
BACKEND_DIR="/root/payment-points-backend"
FRONTEND_DIR="/root/admin-frontend"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📝 部署内容：${NC}"
echo "  - 后端代码更新（包含v2.0.0优化）"
echo "  - 前端代码更新（商户详情优化）"
echo "  - 数据库修复脚本"
echo ""

# ==================== 步骤1：拉取最新代码 ====================
echo -e "${YELLOW}步骤1/6: 拉取最新代码...${NC}"
ssh $SERVER << 'ENDSSH'
cd /root/payment-points-backend
echo "当前目录: $(pwd)"
git pull origin main
echo "✅ 后端代码更新成功"

cd /root/admin-frontend
git pull origin main
echo "✅ 前端代码更新成功"
ENDSSH

echo -e "${GREEN}✅ 代码拉取完成${NC}"
echo ""

# ==================== 步骤2：安装后端依赖 ====================
echo -e "${YELLOW}步骤2/6: 安装后端新依赖...${NC}"
ssh $SERVER << 'ENDSSH'
cd /root/payment-points-backend
npm install dotenv jsonwebtoken bcryptjs express-validator express-rate-limit winston
echo "✅ 依赖安装完成"
ENDSSH

echo -e "${GREEN}✅ 依赖安装完成${NC}"
echo ""

# ==================== 步骤3：配置环境变量 ====================
echo -e "${YELLOW}步骤3/6: 检查环境变量配置...${NC}"
ssh $SERVER << 'ENDSSH'
cd /root/payment-points-backend

if [ ! -f .env ]; then
    echo "⚠️  .env文件不存在，正在创建..."
    cp .env.example .env

    echo ""
    echo "⚠️  重要：请手动编辑 /root/payment-points-backend/.env 文件"
    echo "必须配置以下内容："
    echo "  - DB_PASSWORD=你的MySQL密码"
    echo "  - JWT_SECRET=\$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
    echo "  - ALLOWED_ORIGINS=https://www.guandongfang.cn"
    echo ""
else
    echo "✅ .env文件已存在"
fi

chmod 600 .env
ENDSSH

echo -e "${GREEN}✅ 环境变量检查完成${NC}"
echo ""

# ==================== 步骤4：执行数据库修复 ====================
echo -e "${YELLOW}步骤4/6: 执行数据库修复脚本...${NC}"
echo -e "${RED}⚠️  这将修改数据库！${NC}"
read -p "是否继续？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    ssh $SERVER << 'ENDSSH'
cd /root/payment-points-backend

echo "开始执行数据库修复..."
mysql -u root -p points_app_dev < sql/fix_data_consistency.sql

echo "✅ 数据库修复完成"

# 验证数据
echo ""
echo "验证商户数据："
mysql -u root -p points_app_dev -e "
SELECT
  merchant_name as '商户名称',
  total_amount as '总金额(分)',
  total_orders as '总订单数',
  status as '状态'
FROM merchants
ORDER BY total_amount DESC;
"
ENDSSH

    echo -e "${GREEN}✅ 数据库修复完成${NC}"
else
    echo -e "${YELLOW}⏭️  跳过数据库修复${NC}"
fi
echo ""

# ==================== 步骤5：重启后端服务 ====================
echo -e "${YELLOW}步骤5/6: 重启后端服务...${NC}"
read -p "使用新版本server.js还是旧版本payment-points-api-enhanced.js？(new/old，默认old) " version
version=${version:-old}

if [[ $version == "new" ]]; then
    echo "使用新版本 server.js（模块化版本）"
    ssh $SERVER << 'ENDSSH'
cd /root/payment-points-backend

# 停止旧服务
pm2 stop payment-points-api || true

# 启动新服务
pm2 start server.js --name "payment-points-api-v2"
pm2 save

echo "✅ 新版本服务启动成功"
ENDSSH
else
    echo "使用旧版本 payment-points-api-enhanced.js（已优化字段映射）"
    ssh $SERVER << 'ENDSSH'
cd /root/payment-points-backend

# 重启服务
pm2 restart payment-points-api || pm2 start payment-points-api-enhanced.js --name "payment-points-api"
pm2 save

echo "✅ 服务重启成功"
ENDSSH
fi

echo -e "${GREEN}✅ 后端服务已更新${NC}"
echo ""

# ==================== 步骤6：更新前端 ====================
echo -e "${YELLOW}步骤6/6: 编译并部署前端...${NC}"
ssh $SERVER << 'ENDSSH'
cd /root/admin-frontend

# 编译前端
npm run build

echo "✅ 前端编译完成"
echo "静态文件位置: /root/admin-frontend/dist"
ENDSSH

echo -e "${GREEN}✅ 前端更新完成${NC}"
echo ""

# ==================== 部署完成 ====================
echo "======================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "======================================"
echo ""

echo "检查服务状态："
ssh $SERVER "pm2 list"

echo ""
echo "访问测试："
echo "  - 后端健康检查: http://8.156.84.226:3000/health"
echo "  - 管理后台: https://www.guandongfang.cn"
echo ""

echo -e "${YELLOW}📝 后续操作：${NC}"
echo "1. 检查 .env 文件配置是否正确"
echo "2. 验证商户详情页面显示是否正常"
echo "3. 测试API接口功能"
echo ""

echo -e "${GREEN}✅ 所有步骤完成！${NC}"
