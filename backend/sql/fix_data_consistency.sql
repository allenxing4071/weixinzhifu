-- 修复数据一致性问题
-- 执行时间: 2025-10-01
-- 目的: 统一金额单位、修复数据关联

USE points_app_dev;

-- ==================== 1. 统一商户表金额字段类型 ====================
-- 将total_amount从DECIMAL(15,2)改为BIGINT，统一使用"分"作为单位

-- 先备份现有数据
CREATE TABLE IF NOT EXISTS merchants_backup_20251001 AS SELECT * FROM merchants;

-- 修改字段类型（如果有数据，先转换单位）
UPDATE merchants SET total_amount = total_amount * 100 WHERE total_amount IS NOT NULL;

ALTER TABLE merchants
MODIFY COLUMN total_amount BIGINT NOT NULL DEFAULT 0 COMMENT '总收款金额(分，统一单位)';

-- ==================== 2. 修复测试数据关联问题 ====================

-- 2.1 删除孤立的订单数据（这些订单引用的商户ID不存在）
DELETE FROM payment_orders
WHERE merchant_id IN ('merchant-001', 'merchant-002', 'merchant-005');

DELETE FROM points_records
WHERE merchant_id IN ('merchant-001', 'merchant-002', 'merchant-005');

-- 2.2 为现有商户创建正确关联的测试订单
INSERT INTO payment_orders (id, user_id, merchant_id, merchant_name, merchant_category, amount, points_awarded, status, paid_at, created_at) VALUES
-- 商户1: 仁寿县怀仁街道云锦汇会所
('order_new_001', 'user_test_001', 'merchant_1735113600_abc123', '仁寿县怀仁街道云锦汇会所（个体工商户）', '休闲娱乐', 50000, 500, 'paid', '2025-09-26 10:30:00', '2025-09-26 10:30:00'),
('order_new_002', 'user_test_002', 'merchant_1735113600_abc123', '仁寿县怀仁街道云锦汇会所（个体工商户）', '休闲娱乐', 30000, 300, 'paid', '2025-09-25 16:45:00', '2025-09-25 16:45:00'),

-- 商户2: 成都市中鑫博海国际酒业贸易有限公司
('order_new_003', 'user_test_001', 'merchant_1735113700_def456', '成都市中鑫博海国际酒业贸易有限公司', '酒类贸易', 20000, 200, 'paid', '2025-09-25 15:20:00', '2025-09-25 15:20:00'),
('order_new_004', 'user_test_002', 'merchant_1735113700_def456', '成都市中鑫博海国际酒业贸易有限公司', '酒类贸易', 15000, 150, 'paid', '2025-09-24 14:10:00', '2025-09-24 14:10:00'),

-- 商户3: 德阳市叁思科技有限公司（待审核状态，暂无订单）
('order_new_005', 'user_test_001', 'merchant_1735113800_ghi789', '德阳市叁思科技有限公司', '软件开发', 8000, 80, 'pending', NULL, '2025-09-27 09:00:00')
ON DUPLICATE KEY UPDATE
  merchant_id = VALUES(merchant_id),
  merchant_name = VALUES(merchant_name);

-- 2.3 创建对应的积分记录
INSERT INTO points_records (id, user_id, points_change, record_type, related_order_id, merchant_id, merchant_name, description, created_at) VALUES
('points_new_001', 'user_test_001', 500, 'payment_reward', 'order_new_001', 'merchant_1735113600_abc123', '仁寿县怀仁街道云锦汇会所（个体工商户）', '在仁寿县怀仁街道云锦汇会所消费获得积分', '2025-09-26 10:30:00'),
('points_new_002', 'user_test_002', 300, 'payment_reward', 'order_new_002', 'merchant_1735113600_abc123', '仁寿县怀仁街道云锦汇会所（个体工商户）', '在仁寿县怀仁街道云锦汇会所消费获得积分', '2025-09-25 16:45:00'),
('points_new_003', 'user_test_001', 200, 'payment_reward', 'order_new_003', 'merchant_1735113700_def456', '成都市中鑫博海国际酒业贸易有限公司', '在成都市中鑫博海国际酒业贸易有限公司消费获得积分', '2025-09-25 15:20:00'),
('points_new_004', 'user_test_002', 150, 'payment_reward', 'order_new_004', 'merchant_1735113700_def456', '成都市中鑫博海国际酒业贸易有限公司', '在成都市中鑫博海国际酒业贸易有限公司消费获得积分', '2025-09-24 14:10:00')
ON DUPLICATE KEY UPDATE
  merchant_id = VALUES(merchant_id),
  merchant_name = VALUES(merchant_name);

-- 2.4 更新用户积分（重新计算）
UPDATE user_points SET
  available_points = (SELECT COALESCE(SUM(points_change), 0) FROM points_records WHERE user_id = user_points.user_id),
  total_earned = (SELECT COALESCE(SUM(points_change), 0) FROM points_records WHERE user_id = user_points.user_id AND points_change > 0),
  total_spent = (SELECT COALESCE(SUM(ABS(points_change)), 0) FROM points_records WHERE user_id = user_points.user_id AND points_change < 0);

-- 2.5 更新商户的总金额和总订单数（基于实际订单统计）
UPDATE merchants m
SET
  total_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payment_orders
    WHERE merchant_id = m.id AND status = 'paid'
  ),
  total_orders = (
    SELECT COUNT(*)
    FROM payment_orders
    WHERE merchant_id = m.id AND status = 'paid'
  );

-- ==================== 3. 数据验证 ====================

-- 3.1 验证商户数据
SELECT
  id,
  merchant_name as '商户名称',
  total_amount as '总金额(分)',
  total_amount / 100 as '总金额(元)',
  total_orders as '总订单数',
  status as '状态'
FROM merchants
ORDER BY total_amount DESC;

-- 3.2 验证商户与订单关联
SELECT
  m.merchant_name as '商户名称',
  m.total_orders as '商户记录的订单数',
  COUNT(o.id) as '实际订单数',
  m.total_amount as '商户记录的金额(分)',
  SUM(CASE WHEN o.status='paid' THEN o.amount ELSE 0 END) as '实际订单金额(分)',
  CASE
    WHEN m.total_orders = COUNT(CASE WHEN o.status='paid' THEN 1 END)
         AND m.total_amount = SUM(CASE WHEN o.status='paid' THEN o.amount ELSE 0 END)
    THEN '✅ 一致'
    ELSE '❌ 不一致'
  END as '数据一致性'
FROM merchants m
LEFT JOIN payment_orders o ON m.id = o.merchant_id
GROUP BY m.id, m.merchant_name, m.total_orders, m.total_amount;

-- 3.3 验证用户积分
SELECT
  u.nickname as '用户',
  up.available_points as '可用积分',
  up.total_earned as '总获得',
  up.total_spent as '总消费',
  SUM(pr.points_change) as '实际积分变化总和',
  CASE
    WHEN up.available_points = SUM(pr.points_change)
    THEN '✅ 一致'
    ELSE '❌ 不一致'
  END as '数据一致性'
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
LEFT JOIN points_records pr ON u.id = pr.user_id
GROUP BY u.id, u.nickname, up.available_points, up.total_earned, up.total_spent;

-- 3.4 检查孤立数据
SELECT '孤立订单（商户不存在）' as '检查项', COUNT(*) as '数量'
FROM payment_orders o
LEFT JOIN merchants m ON o.merchant_id = m.id
WHERE m.id IS NULL

UNION ALL

SELECT '孤立积分记录（订单不存在）' as '检查项', COUNT(*) as '数量'
FROM points_records pr
LEFT JOIN payment_orders po ON pr.related_order_id = po.id
WHERE pr.related_order_id IS NOT NULL AND po.id IS NULL;

-- ==================== 4. 完成提示 ====================
SELECT
  '✅ 数据一致性修复完成' as '状态',
  NOW() as '执行时间',
  (SELECT COUNT(*) FROM merchants) as '商户总数',
  (SELECT COUNT(*) FROM payment_orders) as '订单总数',
  (SELECT COUNT(*) FROM points_records) as '积分记录总数';
