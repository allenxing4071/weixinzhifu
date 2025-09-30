#!/bin/bash
# SSL证书一键部署脚本
# 使用方法: ./deploy-ssl-cert.sh <证书文件.pem> <私钥文件.key>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
SERVER_IP="8.156.84.226"
SERVER_USER="root"
SSH_KEY="../../config/ssh/weixinpay.pem"
DOMAIN="www.guandongfang.cn"

echo -e "${GREEN}🔐 SSL证书部署脚本${NC}"
echo "================================"

# 检查参数
if [ $# -ne 2 ]; then
    echo -e "${RED}❌ 用法错误！${NC}"
    echo "使用方法: $0 <证书文件.pem> <私钥文件.key>"
    echo ""
    echo "示例:"
    echo "  $0 ~/Downloads/fullchain.pem ~/Downloads/private.key"
    exit 1
fi

CERT_FILE="$1"
KEY_FILE="$2"

# 检查文件是否存在
if [ ! -f "$CERT_FILE" ]; then
    echo -e "${RED}❌ 证书文件不存在: $CERT_FILE${NC}"
    exit 1
fi

if [ ! -f "$KEY_FILE" ]; then
    echo -e "${RED}❌ 私钥文件不存在: $KEY_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 找到证书文件: $CERT_FILE${NC}"
echo -e "${GREEN}✅ 找到私钥文件: $KEY_FILE${NC}"
echo ""

# 1. 上传证书文件
echo -e "${YELLOW}📤 步骤 1/5: 上传证书文件到服务器...${NC}"
scp -i "$SSH_KEY" "$CERT_FILE" "${SERVER_USER}@${SERVER_IP}:/etc/nginx/ssl/guandongfang/fullchain.pem"
scp -i "$SSH_KEY" "$KEY_FILE" "${SERVER_USER}@${SERVER_IP}:/etc/nginx/ssl/guandongfang/private.key"
echo -e "${GREEN}✅ 证书文件上传成功${NC}"
echo ""

# 2. 设置文件权限
echo -e "${YELLOW}🔒 步骤 2/5: 设置证书文件权限...${NC}"
ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
chmod 644 /etc/nginx/ssl/guandongfang/fullchain.pem
chmod 600 /etc/nginx/ssl/guandongfang/private.key
chown root:root /etc/nginx/ssl/guandongfang/*
echo "✅ 权限设置完成"
ENDSSH
echo ""

# 3. 验证证书
echo -e "${YELLOW}🔍 步骤 3/5: 验证SSL证书...${NC}"
ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
openssl x509 -in /etc/nginx/ssl/guandongfang/fullchain.pem -noout -subject -dates -issuer
ENDSSH
echo ""

# 4. 应用HTTPS配置
echo -e "${YELLOW}⚙️  步骤 4/5: 应用HTTPS Nginx配置...${NC}"
ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
cp /root/nginx-https-ready.conf /etc/nginx/sites-available/guandongfang
echo "✅ 配置文件已更新"
ENDSSH
echo ""

# 5. 测试并重启Nginx
echo -e "${YELLOW}🔄 步骤 5/5: 测试并重启Nginx...${NC}"
ssh -i "$SSH_KEY" "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
echo "测试Nginx配置..."
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx配置测试通过"
    echo "重启Nginx..."
    systemctl reload nginx
    echo "✅ Nginx已重新加载"
else
    echo "❌ Nginx配置测试失败！"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}🎉 SSL证书部署成功！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "访问地址:"
    echo "  管理后台: https://${DOMAIN}/admin/"
    echo "  API地址:  https://${DOMAIN}/api/v1/"
    echo ""
    echo "下一步:"
    echo "  1. 在浏览器中访问 https://${DOMAIN}/admin/ 验证证书"
    echo "  2. 在微信小程序后台配置服务器域名: https://${DOMAIN}"
    echo "  3. 测试微信小程序API调用"
else
    echo -e "${RED}❌ 部署失败！${NC}"
    exit 1
fi
