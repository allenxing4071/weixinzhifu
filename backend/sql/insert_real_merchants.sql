-- 插入真实商户数据
-- 基于提供的申请单编号、商户名称、商户号、状态、创建员工号

USE points_app_dev;

-- 清空现有测试数据（可选）
-- DELETE FROM merchants WHERE id LIKE 'merchant-%';

-- 插入真实商户数据
INSERT INTO merchants (
  id, 
  merchant_name, 
  merchant_no, 
  contact_person, 
  contact_phone, 
  business_license,
  status, 
  sub_mch_id, 
  applyment_id, 
  merchant_type, 
  contact_email, 
  legal_person, 
  business_category,
  total_amount, 
  total_orders,
  created_at,
  updated_at
) VALUES 
-- 1. 仁寿县怀仁街道云锦汇会所（个体工商户）
(
  'merchant-001',
  '仁寿县怀仁街道云锦汇会所（个体工商户）',
  '1728001633',
  '刘阳',
  '138****1234',
  '91511421MA68XXX123',
  'active', -- 已完成
  '1728001633',
  '2000002691156098',
  'INDIVIDUAL',
  'liuyang@yunxin.com',
  '刘阳',
  '休闲娱乐',
  85000.00,
  42,
  '2024-12-15 10:00:00',
  '2024-12-27 10:00:00'
),

-- 2. 仁寿县怀仁街道储府鱼庄店（个体工商户）
(
  'merchant-002',
  '仁寿县怀仁街道储府鱼庄店（个体工商户）',
  '1727952181',
  '刘阳',
  '138****5678',
  '91511421MA68XXX456',
  'active', -- 已完成
  '1727952181',
  '2000002690858917',
  'INDIVIDUAL',
  'liuyang@chufu.com',
  '刘阳',
  '餐饮',
  126000.00,
  68,
  '2024-12-14 11:00:00',
  '2024-12-27 11:00:00'
),

-- 3. 仁寿县怀仁街道颐善滋养园养生馆（个体工商户）
(
  'merchant-003',
  '仁寿县怀仁街道颐善滋养园养生馆（个体工商户）',
  '1727857063',
  '刘阳',
  '138****9012',
  '91511421MA68XXX789',
  'active', -- 已完成
  '1727857063',
  '2000002690623402',
  'INDIVIDUAL',
  'liuyang@yishan.com',
  '刘阳',
  '生活服务',
  58000.00,
  29,
  '2024-12-13 12:00:00',
  '2024-12-27 12:00:00'
),

-- 4. 成都市中鑫博海国际酒业贸易有限公司
(
  'merchant-004',
  '成都市中鑫博海国际酒业贸易有限公司',
  '1727774152',
  '邢海龙',
  '139****3456',
  '91510100MA68XXX012',
  'active', -- 已完成
  '1727774152',
  '2000002690164951',
  'ENTERPRISE',
  'xinghl@zhongxin.com',
  '邢海龙',
  '酒类贸易',
  285000.00,
  156,
  '2024-12-12 13:00:00',
  '2024-12-27 13:00:00'
),

-- 5. 德阳市叁思科技有限公司
(
  'merchant-005',
  '德阳市叁思科技有限公司',
  '1727565030',
  '赵其军',
  '137****7890',
  '91510600MA68XXX345',
  'active', -- 已完成
  '1727565030',
  '2000002689372247',
  'ENTERPRISE',
  'zhaoqj@sansi.com',
  '赵其军',
  '数字娱乐',
  198000.00,
  89,
  '2024-12-11 14:00:00',
  '2024-12-27 14:00:00'
)
ON DUPLICATE KEY UPDATE 
  merchant_name = VALUES(merchant_name),
  contact_person = VALUES(contact_person),
  contact_phone = VALUES(contact_phone),
  business_license = VALUES(business_license),
  status = VALUES(status),
  sub_mch_id = VALUES(sub_mch_id),
  applyment_id = VALUES(applyment_id),
  merchant_type = VALUES(merchant_type),
  contact_email = VALUES(contact_email),
  legal_person = VALUES(legal_person),
  business_category = VALUES(business_category),
  total_amount = VALUES(total_amount),
  total_orders = VALUES(total_orders),
  updated_at = VALUES(updated_at);

-- 验证插入的数据
SELECT 
  id,
  merchant_name,
  merchant_no,
  contact_person,
  status,
  sub_mch_id,
  applyment_id,
  merchant_type,
  business_category,
  total_amount,
  total_orders,
  created_at
FROM merchants 
ORDER BY created_at DESC;

-- 统计商户状态
SELECT 
  status,
  COUNT(*) as count
FROM merchants 
GROUP BY status;