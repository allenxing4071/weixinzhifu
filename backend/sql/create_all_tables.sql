-- 创建所有缺失的表
USE points_app_dev;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  wechat_id VARCHAR(100) UNIQUE,
  nickname VARCHAR(100),
  avatar VARCHAR(500),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户积分表
CREATE TABLE IF NOT EXISTS user_points (
  user_id VARCHAR(50) PRIMARY KEY,
  available_points INT DEFAULT 0,
  total_earned INT DEFAULT 0,
  total_spent INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  merchant_id VARCHAR(50) NOT NULL,
  merchant_name VARCHAR(200) NOT NULL,
  merchant_category VARCHAR(100),
  amount INT NOT NULL,
  points_awarded INT DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'wechat_pay',
  status ENUM('pending','paid','cancelled','refunded') DEFAULT 'pending',
  wechat_order_id VARCHAR(100),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  points_change INT NOT NULL,
  record_type ENUM('payment_reward', 'mall_consumption', 'admin_adjust') DEFAULT 'payment_reward',
  related_order_id VARCHAR(50),
  merchant_id VARCHAR(50),
  merchant_name VARCHAR(200),
  description VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_record_type (record_type),
  INDEX idx_created_at (created_at),
  INDEX idx_related_order_id (related_order_id)
);

-- 插入测试用户数据
INSERT IGNORE INTO users (id, wechat_id, nickname, avatar, phone) VALUES
('user_test_001', 'wx_openid_test_001', '积分测试用户', 'https://example.com/avatar1.jpg', '13800138001'),
('user_test_002', 'wx_openid_test_002', '支付测试用户', 'https://example.com/avatar2.jpg', '13800138002');

-- 插入测试积分数据
INSERT IGNORE INTO user_points (user_id, available_points, total_earned, total_spent) VALUES
('user_test_001', 1288, 2000, 712),
('user_test_002', 850, 1200, 350);

-- 插入测试支付订单数据
INSERT IGNORE INTO payment_orders (id, user_id, merchant_id, merchant_name, merchant_category, amount, points_awarded, status, paid_at, created_at) VALUES
('order_001', 'user_test_001', 'merchant-001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '休闲娱乐', 50000, 50, 'paid', '2025-09-26 10:30:00', '2025-09-26 10:30:00'),
('order_002', 'user_test_001', 'merchant-002', '仁寿县怀仁街道储府鱼庄店（个体工商户）', '餐饮', 20000, 20, 'paid', '2025-09-25 15:20:00', '2025-09-25 15:20:00'),
('order_003', 'user_test_002', 'merchant-001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '休闲娱乐', 30000, 30, 'paid', '2025-09-25 16:45:00', '2025-09-25 16:45:00'),
('order_004', 'user_test_001', 'merchant-005', '德阳市叁思科技有限公司', '数字娱乐', 15000, 15, 'paid', '2025-09-24 14:10:00', '2025-09-24 14:10:00');

-- 插入对应的积分记录数据
INSERT IGNORE INTO points_records (id, user_id, points_change, record_type, related_order_id, merchant_id, merchant_name, description, created_at) VALUES
('points_001', 'user_test_001', 50, 'payment_reward', 'order_001', 'merchant-001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '在仁寿县怀仁街道云锦汇会所消费获得积分', '2025-09-26 10:30:00'),
('points_002', 'user_test_001', 20, 'payment_reward', 'order_002', 'merchant-002', '仁寿县怀仁街道储府鱼庄店（个体工商户）', '在仁寿县怀仁街道储府鱼庄店消费获得积分', '2025-09-25 15:20:00'),
('points_003', 'user_test_002', 30, 'payment_reward', 'order_003', 'merchant-001', '仁寿县怀仁街道云锦汇会所（个体工商户）', '在仁寿县怀仁街道云锦汇会所消费获得积分', '2025-09-25 16:45:00'),
('points_004', 'user_test_001', 15, 'payment_reward', 'order_004', 'merchant-005', '德阳市叁思科技有限公司', '在德阳市叁思科技有限公司消费获得积分', '2025-09-24 14:10:00');