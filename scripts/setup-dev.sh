#!/bin/bash

# 积分系统开发环境部署脚本
# 使用方法：chmod +x scripts/setup-dev.sh && ./scripts/setup-dev.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署积分系统开发环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要工具
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 未安装，请先安装 $1${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ $1 已安装${NC}"
    fi
}

echo -e "${BLUE}🔍 检查环境依赖...${NC}"
check_command node
check_command npm
check_command mysql
check_command redis-server

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js版本过低，需要>=18.0.0，当前版本：$(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js版本符合要求：$(node -v)${NC}"

# 启动Redis（如果未启动）
echo -e "${BLUE}🔧 检查Redis服务...${NC}"
if ! pgrep -x "redis-server" > /dev/null; then
    echo -e "${YELLOW}⚠️  Redis未启动，正在启动...${NC}"
    brew services start redis
    sleep 2
fi
echo -e "${GREEN}✅ Redis服务运行中${NC}"

# 创建数据库
echo -e "${BLUE}🗄️  初始化数据库...${NC}"
echo "请输入MySQL root密码（如果有的话，没有直接回车）："
mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS points_app_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'points_app'@'localhost' IDENTIFIED BY 'dev_password_123';
GRANT ALL PRIVILEGES ON points_app_dev.* TO 'points_app'@'localhost';
FLUSH PRIVILEGES;
" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  使用root无密码方式创建数据库...${NC}"
    mysql -u root -e "
    CREATE DATABASE IF NOT EXISTS points_app_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER IF NOT EXISTS 'points_app'@'localhost' IDENTIFIED BY 'dev_password_123';
    GRANT ALL PRIVILEGES ON points_app_dev.* TO 'points_app'@'localhost';
    FLUSH PRIVILEGES;
    "
}

# 导入数据库结构
echo -e "${BLUE}📊 导入数据库结构...${NC}"
mysql -u points_app -pdev_password_123 points_app_dev < backend/sql/init.sql

echo -e "${GREEN}✅ 数据库初始化完成${NC}"

# 安装后端依赖
echo -e "${BLUE}📦 安装后端依赖...${NC}"
cd backend
npm install
echo -e "${GREEN}✅ 后端依赖安装完成${NC}"

# 创建环境配置文件
echo -e "${BLUE}⚙️  创建环境配置...${NC}"
if [ ! -f .env ]; then
    cp config.env .env
    # 更新数据库密码
    sed -i '' 's/DB_PASSWORD=/DB_PASSWORD=dev_password_123/' .env
    echo -e "${GREEN}✅ 环境配置文件已创建: backend/.env${NC}"
    echo -e "${YELLOW}⚠️  请编辑 backend/.env 文件，填入真实的微信配置信息${NC}"
else
    echo -e "${YELLOW}⚠️  .env 文件已存在，请检查配置${NC}"
fi

# 创建日志目录
mkdir -p logs

# 编译TypeScript
echo -e "${BLUE}🔨 编译TypeScript...${NC}"
npm run build
echo -e "${GREEN}✅ 编译完成${NC}"

# 回到项目根目录
cd ..

echo -e "${GREEN}🎉 开发环境部署完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步操作：${NC}"
echo "1. 编辑 backend/.env 文件，配置真实的微信参数"
echo "2. 运行：cd backend && npm run dev"
echo "3. 在浏览器打开：http://localhost:3000/health"
echo "4. 使用微信开发者工具打开 frontend/miniprogram"
echo ""
echo -e "${YELLOW}⚠️  注意：需要提供真实的微信小程序和支付配置才能完整测试${NC}"
