-- 小程序用户表
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  points_change INT,
  record_type ENUM('payment_reward', 'mall_consumption', 'admin_adjust') DEFAULT 'payment_reward',
  related_order_id VARCHAR(50),
  description VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  merchant_id VARCHAR(50),
  amount INT,
  status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  wechat_order_id VARCHAR(100),
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插入测试用户数据
INSERT IGNORE INTO users (id, wechat_id, nickname, avatar, phone) VALUES
('user_test_001', 'wx_openid_test_001', '积分测试用户', 'https://example.com/avatar1.jpg', '13800138001'),
('user_test_002', 'wx_openid_test_002', '支付测试用户', 'https://example.com/avatar2.jpg', '13800138002');

-- 插入测试积分数据
INSERT IGNORE INTO user_points (user_id, available_points, total_earned, total_spent) VALUES
('user_test_001', 1288, 2000, 712),
('user_test_002', 850, 1200, 350);

-- 插入测试积分记录
INSERT IGNORE INTO points_records (id, user_id, points_change, record_type, description, created_at) VALUES
('record_001', 'user_test_001', 100, 'payment_reward', '支付获得积分', '2025-09-20 10:00:00'),
('record_002', 'user_test_001', -50, 'mall_consumption', '商城消费', '2025-09-21 14:30:00'),
('record_003', 'user_test_001', 200, 'payment_reward', '支付获得积分', '2025-09-22 16:45:00'),
('record_004', 'user_test_002', 150, 'payment_reward', '支付获得积分', '2025-09-23 09:15:00');
