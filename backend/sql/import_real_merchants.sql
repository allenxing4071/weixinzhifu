USE points_app_dev;

-- 清空现有的模拟商户数据
DELETE FROM merchants WHERE id LIKE 'merchant_%';

-- 导入5条真实商户数据
INSERT INTO merchants (
  id,
  applyment_id,
  merchant_name,
  merchant_no,
  contact_person,
  contact_phone,
  business_license,
  status,
  sub_mch_id,
  total_amount,
  total_orders,
  merchant_type,
  contact_email,
  legal_person,
  business_category,
  created_at,
  updated_at
) VALUES
-- 1. 仁寿县怀仁街道云锦汇会所（个体工商户）
(
  'merchant_real_001',
  '2000002691156098',
  '仁寿县怀仁街道云锦汇会所（个体工商户）',
  'M001',
  '刘阳',
  '13800138001',
  '91512345MA6CXXX001',
  'active',
  '1728001633',
  0,
  0,
  'INDIVIDUAL',
  'liuyang@example.com',
  '刘阳',
  '休闲娱乐',
  NOW(),
  NOW()
),
-- 2. 仁寿县怀仁街道储府鱼庄店（个体工商户）
(
  'merchant_real_002',
  '2000002690858917',
  '仁寿县怀仁街道储府鱼庄店（个体工商户）',
  'M002',
  '刘阳',
  '13800138002',
  '91512345MA6CXXX002',
  'active',
  '1727952181',
  0,
  0,
  'INDIVIDUAL',
  'liuyang@example.com',
  '刘阳',
  '餐饮',
  NOW(),
  NOW()
),
-- 3. 仁寿县怀仁街道颐善滋养园养生馆（个体工商户）
(
  'merchant_real_003',
  '2000002690623402',
  '仁寿县怀仁街道颐善滋养园养生馆（个体工商户）',
  'M003',
  '刘阳',
  '13800138003',
  '91512345MA6CXXX003',
  'active',
  '1727857063',
  0,
  0,
  'INDIVIDUAL',
  'liuyang@example.com',
  '刘阳',
  '休闲娱乐',
  NOW(),
  NOW()
),
-- 4. 成都市中鑫博海国际酒业贸易有限公司
(
  'merchant_real_004',
  '2000002690164951',
  '成都市中鑫博海国际酒业贸易有限公司',
  'M004',
  '邢海龙',
  '13800138004',
  '91510100MA6CXXX004',
  'active',
  '1727774152',
  0,
  0,
  'ENTERPRISE',
  'xinghailong@example.com',
  '邢海龙',
  '食品保健',
  NOW(),
  NOW()
),
-- 5. 德阳市叁思科技有限公司
(
  'merchant_real_005',
  '2000002689372247',
  '德阳市叁思科技有限公司',
  'M005',
  '赵其军',
  '13800138005',
  '91510600MA6CXXX005',
  'active',
  '1727565030',
  0,
  0,
  'ENTERPRISE',
  'zhaoqijun@example.com',
  '赵其军',
  '科技服务',
  NOW(),
  NOW()
);

-- 查看导入结果
SELECT id, applyment_id, merchant_name, sub_mch_id, status, contact_person 
FROM merchants 
ORDER BY created_at DESC;
