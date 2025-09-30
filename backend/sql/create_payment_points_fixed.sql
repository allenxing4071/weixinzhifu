-- 使用正确的数据库
USE points_app_dev;

-- 删除已存在的表（重新创建）
DROP TABLE IF EXISTS points_records;
DROP TABLE IF EXISTS payment_orders;

-- 支付订单表（去掉外键约束，使用索引）
CREATE TABLE payment_orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  merchant_id VARCHAR(50) NOT NULL,
  merchant_name VARCHAR(200) NOT NULL,
  merchant_category VARCHAR(100),
  amount INT NOT NULL,                    -- 支付金额（分）
  points_awarded INT DEFAULT 0,           -- 本次消费获得积分
  payment_method VARCHAR(50) DEFAULT 'wechat_pay',
  status ENUM('pending','paid','cancelled','refunded') DEFAULT 'pending',
  wechat_order_id VARCHAR(100),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 积分记录表（去掉外键约束，使用索引）
CREATE TABLE points_records (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  points_change INT NOT NULL,              -- 积分变化（+获得 -消费）
  record_type ENUM('payment_reward', 'mall_consumption', 'admin_adjust') DEFAULT 'payment_reward',
  related_order_id VARCHAR(50),            -- 关联支付订单
  merchant_id VARCHAR(50),                 -- 关联商户
  merchant_name VARCHAR(200),              -- 冗余商户名称
  description VARCHAR(500),                -- 详细描述
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_record_type (record_type),
  INDEX idx_created_at (created_at),
  INDEX idx_related_order_id (related_order_id)
);

-- 插入测试支付订单数据
INSERT INTO payment_orders (id, user_id, merchant_id, merchant_name, merchant_category, amount, points_awarded, status, paid_at, created_at) VALUES
('order_001', 'user_test_001', 'merchant_real_001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '休闲娱乐', 50000, 50, 'paid', '2025-09-26 10:30:00', '2025-09-26 10:30:00'),
('order_002', 'user_test_001', 'merchant_real_003', '上海融昕化妆品有限公司（个体工商户）', '零售批发', 20000, 20, 'paid', '2025-09-25 15:20:00', '2025-09-25 15:20:00'),
('order_003', 'user_test_002', 'merchant_real_001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '休闲娱乐', 30000, 30, 'paid', '2025-09-25 16:45:00', '2025-09-25 16:45:00'),
('order_004', 'user_test_001', 'merchant_real_005', '简阳市金叶科技有限公司', '科技服务', 15000, 15, 'paid', '2025-09-24 14:10:00', '2025-09-24 14:10:00');

-- 插入对应的积分记录数据
INSERT INTO points_records (id, user_id, points_change, record_type, related_order_id, merchant_id, merchant_name, description, created_at) VALUES
('points_001', 'user_test_001', 50, 'payment_reward', 'order_001', 'merchant_real_001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '在仁寿县怀仁街道云锦汇会所消费获得积分', '2025-09-26 10:30:00'),
('points_002', 'user_test_001', 20, 'payment_reward', 'order_002', 'merchant_real_003', '上海融昕化妆品有限公司（个体工商户）', '在上海融昕化妆品有限公司消费获得积分', '2025-09-25 15:20:00'),
('points_003', 'user_test_002', 30, 'payment_reward', 'order_003', 'merchant_real_001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '在仁寿县怀仁街道云锦汇会所消费获得积分', '2025-09-25 16:45:00'),
('points_004', 'user_test_001', 15, 'payment_reward', 'order_004', 'merchant_real_005', '简阳市金叶科技有限公司', '在简阳市金叶科技有限公司消费获得积分', '2025-09-24 14:10:00');

-- 更新用户积分余额（根据记录计算）
UPDATE user_points SET 
  available_points = 1373,    -- 1288 + 50 + 20 + 15 = 1373
  total_earned = 2085,        -- 2000 + 85 = 2085
  total_spent = 712           -- 保持不变
WHERE user_id = 'user_test_001';

UPDATE user_points SET 
  available_points = 880,     -- 850 + 30 = 880  
  total_earned = 1230,        -- 1200 + 30 = 1230
  total_spent = 350           -- 保持不变
WHERE user_id = 'user_test_002';
