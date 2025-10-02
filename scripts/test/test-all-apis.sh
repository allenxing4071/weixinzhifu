#!/bin/bash
# 全面测试所有API的数据返回格式

set -e

SSH_KEY="/Users/xinghailong/Documents/soft/weixinzhifu/config/ssh/weixinpay.pem"
SERVER="root@8.156.84.226"
BASE_URL="http://localhost:3000/api/v1"

echo "========================================="
echo "  全面API数据格式测试"
echo "========================================="
echo ""

ssh -i "$SSH_KEY" "$SERVER" 'bash -s' << 'REMOTE_SCRIPT'
# 获取Token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

echo "✓ Token获取成功"
echo ""

# 测试Dashboard
echo "=== 1. Dashboard API ==="
curl -s "http://localhost:3000/api/v1/admin/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasOverview: (.data.overview != null), hasToday: (.data.today != null)}'

# 测试用户管理
echo ""
echo "=== 2. 用户管理 API ==="
echo "2.1 用户统计:"
curl -s "http://localhost:3000/api/v1/admin/users/stats" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, data}'

echo "2.2 用户列表:"
curl -s "http://localhost:3000/api/v1/admin/users?page=1&pageSize=2" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasList: (.data.list != null), hasPagination: (.data.pagination != null), count: (.data.list | length)}'

echo "2.3 用户详情:"
USER_ID=$(curl -s "http://localhost:3000/api/v1/admin/users?page=1&pageSize=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.list[0].id')
curl -s "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasUserInfo: (.data.userInfo != null), hasOrderStats: (.data.orderStats != null)}'

# 测试商户管理
echo ""
echo "=== 3. 商户管理 API ==="
echo "3.1 商户统计:"
curl -s "http://localhost:3000/api/v1/admin/merchants/stats" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, data}'

echo "3.2 商户列表:"
curl -s "http://localhost:3000/api/v1/admin/merchants?page=1&pageSize=2" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasList: (.data.list != null), hasPagination: (.data.pagination != null), count: (.data.list | length)}'

echo "3.3 商户详情:"
MCH_ID=$(curl -s "http://localhost:3000/api/v1/admin/merchants?page=1&pageSize=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.list[0].id')
curl -s "http://localhost:3000/api/v1/admin/merchants/$MCH_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasData: (.data != null), merchantName: .data.name}'

# 测试订单管理
echo ""
echo "=== 4. 订单管理 API ==="
echo "4.1 订单统计:"
curl -s "http://localhost:3000/api/v1/admin/orders/stats" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, data}'

echo "4.2 订单列表:"
curl -s "http://localhost:3000/api/v1/admin/orders?page=1&pageSize=2" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasList: (.data.list != null), hasPagination: (.data.pagination != null), count: (.data.list | length)}'

echo "4.3 订单详情:"
ORDER_ID=$(curl -s "http://localhost:3000/api/v1/admin/orders?page=1&pageSize=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.list[0].id')
curl -s "http://localhost:3000/api/v1/admin/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasData: (.data != null), orderId: .data.id, hasPointsRecords: (.data.pointsRecords != null)}'

# 测试积分管理
echo ""
echo "=== 5. 积分管理 API ==="
echo "5.1 积分统计:"
curl -s "http://localhost:3000/api/v1/admin/points/stats" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasData: (.data != null), hasOverview: (.data.overview != null)}'

echo "5.2 积分记录列表:"
curl -s "http://localhost:3000/api/v1/admin/points?page=1&pageSize=2" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasList: (.data.list != null), hasPagination: (.data.pagination != null), count: (.data.list | length)}'

# 测试系统设置
echo ""
echo "=== 6. 系统设置 API ==="
echo "6.1 管理员列表:"
curl -s "http://localhost:3000/api/v1/admin/admin-users?page=1&pageSize=2" \
  -H "Authorization: Bearer $TOKEN" | jq -c '{success, hasData: (.data != null), dataCount: (.data | length), hasStats: (.stats != null)}'

echo ""
echo "========================================="
echo "  测试完成"
echo "========================================="
REMOTE_SCRIPT

