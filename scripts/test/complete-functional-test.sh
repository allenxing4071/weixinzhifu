#!/bin/bash
# 完整功能测试 - 测试每个菜单的所有CRUD操作

set -e

echo "==========================================="
echo "  完整功能测试 - 所有菜单CRUD验证"
echo "==========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api/v1"

# 获取Token
echo "🔐 获取管理员Token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Token获取成功${NC}"
echo ""

# ========================================
# 1. 仪表板测试
# ========================================
echo "========================================="
echo "  1️⃣  仪表板 (Dashboard)"
echo "========================================="

echo "1.1 获取仪表板统计..."
DASHBOARD_RESPONSE=$(curl -s "${BASE_URL}/admin/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN")

DASHBOARD_SUCCESS=$(echo "$DASHBOARD_RESPONSE" | jq -r '.success')
if [ "$DASHBOARD_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 仪表板统计数据加载成功${NC}"
  echo "$DASHBOARD_RESPONSE" | jq '{success, hasOverview: (.data.overview != null), hasToday: (.data.today != null), hasTrends: (.data.trends != null)}'
else
  echo -e "${RED}❌ 仪表板统计失败${NC}"
  echo "$DASHBOARD_RESPONSE" | jq '.'
fi

echo ""

# ========================================
# 2. 用户管理测试
# ========================================
echo "========================================="
echo "  2️⃣  用户管理 (Users)"
echo "========================================="

echo "2.1 获取用户统计..."
USER_STATS=$(curl -s "${BASE_URL}/admin/users/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "$USER_STATS" | jq '{success, data}'

echo ""
echo "2.2 获取用户列表..."
USER_LIST=$(curl -s "${BASE_URL}/admin/users?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN")
USER_LIST_SUCCESS=$(echo "$USER_LIST" | jq -r '.success')
if [ "$USER_LIST_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 用户列表加载成功${NC}"
  echo "$USER_LIST" | jq '{success, hasList: (.data.list != null), hasPagination: (.data.pagination != null), count: (.data.list | length)}'
else
  echo -e "${RED}❌ 用户列表失败${NC}"
fi

# 获取第一个用户ID用于详情测试
USER_ID=$(echo "$USER_LIST" | jq -r '.data.list[0].id')

echo ""
echo "2.3 获取用户详情 (ID: $USER_ID)..."
USER_DETAIL=$(curl -s "${BASE_URL}/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$USER_DETAIL" | jq '{success, userName: .data.userInfo.nickname, points: .data.userInfo.availablePoints, orderCount: .data.orderStats.orderCount}'

echo ""
echo "2.4 测试调整用户积分..."
ADJUST_POINTS=$(curl -s -X POST "${BASE_URL}/admin/users/$USER_ID/adjust-points" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points":10,"reason":"测试调整"}')
echo "$ADJUST_POINTS" | jq '{success, message, pointsChange: .data.pointsChange}'

echo ""

# ========================================
# 3. 商户管理测试
# ========================================
echo "========================================="
echo "  3️⃣  商户管理 (Merchants)"
echo "========================================="

echo "3.1 获取商户统计..."
MCH_STATS=$(curl -s "${BASE_URL}/admin/merchants/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "$MCH_STATS" | jq '{success, data}'

echo ""
echo "3.2 获取商户列表..."
MCH_LIST=$(curl -s "${BASE_URL}/admin/merchants?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN")
MCH_LIST_SUCCESS=$(echo "$MCH_LIST" | jq -r '.success')
if [ "$MCH_LIST_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 商户列表加载成功${NC}"
  echo "$MCH_LIST" | jq '{success, hasList: (.data.list != null), count: (.data.list | length)}'
else
  echo -e "${RED}❌ 商户列表失败${NC}"
fi

MCH_ID=$(echo "$MCH_LIST" | jq -r '.data.list[0].id')

echo ""
echo "3.3 获取商户详情 (ID: $MCH_ID)..."
MCH_DETAIL=$(curl -s "${BASE_URL}/admin/merchants/$MCH_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$MCH_DETAIL" | jq '{success, merchantName: .data.name, hasQrCode: (.data.qrCode != null)}'

echo ""
echo "3.4 测试生成二维码..."
QR_RESPONSE=$(curl -s -X POST "${BASE_URL}/admin/merchants/$MCH_ID/qrcode" \
  -H "Authorization: Bearer $TOKEN")
echo "$QR_RESPONSE" | jq '{success, message, hasQrCode: (.data.qrCode != null)}'

echo ""
echo "3.5 测试创建商户..."
CREATE_MCH=$(curl -s -X POST "${BASE_URL}/admin/merchants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantName":"测试商户",
    "wechatMchId":"TEST'$(date +%s)'",
    "businessCategory":"零售",
    "contactPerson":"测试联系人",
    "contactPhone":"13800138000"
  }')
echo "$CREATE_MCH" | jq '{success, message, merchantId: .data.id}'

NEW_MCH_ID=$(echo "$CREATE_MCH" | jq -r '.data.id')

if [ "$NEW_MCH_ID" != "null" ] && [ -n "$NEW_MCH_ID" ]; then
  echo ""
  echo "3.6 测试更新商户..."
  UPDATE_MCH=$(curl -s -X PUT "${BASE_URL}/admin/merchants/$NEW_MCH_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"merchantName":"测试商户(已更新)","contactPerson":"新联系人"}')
  echo "$UPDATE_MCH" | jq '{success, message}'

  echo ""
  echo "3.7 测试删除商户..."
  DELETE_MCH=$(curl -s -X DELETE "${BASE_URL}/admin/merchants/$NEW_MCH_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "$DELETE_MCH" | jq '{success, message}'
fi

echo ""

# ========================================
# 4. 订单管理测试
# ========================================
echo "========================================="
echo "  4️⃣  订单管理 (Orders)"
echo "========================================="

echo "4.1 获取订单统计..."
ORDER_STATS=$(curl -s "${BASE_URL}/admin/orders/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "$ORDER_STATS" | jq '{success, data}'

echo ""
echo "4.2 获取订单列表..."
ORDER_LIST=$(curl -s "${BASE_URL}/admin/orders?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN")
ORDER_LIST_SUCCESS=$(echo "$ORDER_LIST" | jq -r '.success')
if [ "$ORDER_LIST_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 订单列表加载成功${NC}"
  echo "$ORDER_LIST" | jq '{success, hasList: (.data.list != null), count: (.data.list | length)}'
else
  echo -e "${RED}❌ 订单列表失败${NC}"
fi

ORDER_ID=$(echo "$ORDER_LIST" | jq -r '.data.list[0].id')

echo ""
echo "4.3 获取订单详情 (ID: $ORDER_ID)..."
ORDER_DETAIL=$(curl -s "${BASE_URL}/admin/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$ORDER_DETAIL" | jq '{success, orderId: .data.id, amount: .data.amount, merchantName: .data.merchantName, userName: .data.userNickname}'

echo ""
echo "4.4 测试订单查询 (按状态)..."
ORDER_SEARCH=$(curl -s "${BASE_URL}/admin/orders?page=1&pageSize=3&status=paid" \
  -H "Authorization: Bearer $TOKEN")
echo "$ORDER_SEARCH" | jq '{success, count: (.data.list | length), allPaid: ([.data.list[].status] | all(. == "paid"))}'

echo ""

# ========================================
# 5. 积分管理测试
# ========================================
echo "========================================="
echo "  5️⃣  积分管理 (Points)"
echo "========================================="

echo "5.1 获取积分统计..."
POINTS_STATS=$(curl -s "${BASE_URL}/admin/points/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "$POINTS_STATS" | jq '{success, hasOverview: (.data.overview != null), totalAvailable: .data.overview.totalAvailable}'

echo ""
echo "5.2 获取积分记录列表..."
POINTS_LIST=$(curl -s "${BASE_URL}/admin/points?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN")
POINTS_LIST_SUCCESS=$(echo "$POINTS_LIST" | jq -r '.success')
if [ "$POINTS_LIST_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 积分记录列表加载成功${NC}"
  echo "$POINTS_LIST" | jq '{success, hasList: (.data.list != null), count: (.data.list | length)}'
else
  echo -e "${RED}❌ 积分记录列表失败${NC}"
  echo "$POINTS_LIST" | jq '.'
fi

echo ""

# ========================================
# 6. 系统设置测试
# ========================================
echo "========================================="
echo "  6️⃣  系统设置 (Admin Users)"
echo "========================================="

echo "6.1 获取管理员列表..."
ADMIN_LIST=$(curl -s "${BASE_URL}/admin/admin-users?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN")
ADMIN_LIST_SUCCESS=$(echo "$ADMIN_LIST" | jq -r '.success')
if [ "$ADMIN_LIST_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 管理员列表加载成功${NC}"
  echo "$ADMIN_LIST" | jq '{success, hasData: (.data != null), count: (.data | length), hasStats: (.stats != null)}'
else
  echo -e "${RED}❌ 管理员列表失败${NC}"
fi

echo ""
echo "6.2 测试创建管理员..."
CREATE_ADMIN=$(curl -s -X POST "${BASE_URL}/admin/admin-users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testadmin'$(date +%s)'",
    "password":"test123456",
    "realName":"测试管理员",
    "email":"test@example.com",
    "roleId":"role_admin"
  }')
echo "$CREATE_ADMIN" | jq '{success, message, adminId: .data.id}'

NEW_ADMIN_ID=$(echo "$CREATE_ADMIN" | jq -r '.data.id')

if [ "$NEW_ADMIN_ID" != "null" ] && [ -n "$NEW_ADMIN_ID" ]; then
  echo ""
  echo "6.3 测试更新管理员..."
  UPDATE_ADMIN=$(curl -s -X PUT "${BASE_URL}/admin/admin-users/$NEW_ADMIN_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"realName":"测试管理员(已更新)"}')
  echo "$UPDATE_ADMIN" | jq '{success, message}'

  echo ""
  echo "6.4 测试删除管理员..."
  DELETE_ADMIN=$(curl -s -X DELETE "${BASE_URL}/admin/admin-users/$NEW_ADMIN_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "$DELETE_ADMIN" | jq '{success, message}'
fi

echo ""
echo "==========================================="
echo "  ✅ 所有功能测试完成"
echo "==========================================="

