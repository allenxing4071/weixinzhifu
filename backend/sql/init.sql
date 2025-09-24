-- 积分系统数据库初始化脚本
-- 版本: v1.0.0
-- 创建时间: 2024-12

-- 创建数据库
CREATE DATABASE IF NOT EXISTS points_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE points_app;

-- ====================================
-- 用户表
-- ====================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY COMMENT '用户ID',
  wechat_id VARCHAR(100) NOT NULL COMMENT '微信ID',
  openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信OpenID',
  unionid VARCHAR(100) NULL COMMENT '微信UnionID',
  nickname VARCHAR(100) NOT NULL COMMENT '用户昵称',
  avatar VARCHAR(500) NULL COMMENT '头像URL',
  phone VARCHAR(20) NULL COMMENT '手机号',
  points_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '积分余额',
  status ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active' COMMENT '用户状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_openid (openid),
  INDEX idx_unionid (unionid),
  INDEX idx_phone (phone),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ====================================
-- 商户表
-- ====================================
CREATE TABLE IF NOT EXISTS merchants (
  id VARCHAR(50) PRIMARY KEY COMMENT '商户ID',
  merchant_name VARCHAR(200) NOT NULL COMMENT '商户名称',
  merchant_no VARCHAR(50) NOT NULL UNIQUE COMMENT '商户编号',
  contact_person VARCHAR(100) NOT NULL COMMENT '联系人',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  business_license VARCHAR(50) NOT NULL COMMENT '营业执照号',
  status ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'pending' COMMENT '商户状态',
  qr_code TEXT NULL COMMENT '收款二维码',
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '总收款金额',
  total_orders INT NOT NULL DEFAULT 0 COMMENT '总订单数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_merchant_no (merchant_no),
  INDEX idx_status (status),
  INDEX idx_total_amount (total_amount),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户表';

-- ====================================
-- 支付订单表
-- ====================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(50) PRIMARY KEY COMMENT '订单ID',
  order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  merchant_id VARCHAR(50) NOT NULL COMMENT '商户ID',
  amount DECIMAL(15,2) NOT NULL COMMENT '支付金额（分）',
  points_awarded DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '已发放积分',
  status ENUM('pending', 'paid', 'cancelled', 'expired', 'refunded') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  payment_method ENUM('wechat') NOT NULL DEFAULT 'wechat' COMMENT '支付方式',
  transaction_id VARCHAR(100) NULL COMMENT '微信交易号',
  description VARCHAR(255) NOT NULL COMMENT '订单描述',
  paid_at TIMESTAMP NULL COMMENT '支付时间',
  expired_at TIMESTAMP NOT NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
  
  INDEX idx_order_no (order_no),
  INDEX idx_user_id (user_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_paid_at (paid_at),
  INDEX idx_created_at (created_at),
  INDEX idx_expired_at (expired_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付订单表';

-- ====================================
-- 积分记录表
-- ====================================
CREATE TABLE IF NOT EXISTS points_records (
  id VARCHAR(50) PRIMARY KEY COMMENT '记录ID',
  user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
  order_id VARCHAR(50) NULL COMMENT '关联订单ID',
  points_change DECIMAL(15,2) NOT NULL COMMENT '积分变化量',
  points_balance DECIMAL(15,2) NOT NULL COMMENT '变化后余额',
  source ENUM('payment_reward', 'mall_consumption', 'admin_adjust', 'expired_deduct') NOT NULL COMMENT '积分来源',
  description VARCHAR(255) NOT NULL COMMENT '变化描述',
  expires_at TIMESTAMP NULL COMMENT '积分过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES payment_orders(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_order_id (order_id),
  INDEX idx_source (source),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at),
  INDEX idx_user_source (user_id, source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分记录表';

-- ====================================
-- 初始化数据
-- ====================================

-- 创建测试商户
INSERT INTO merchants (id, merchant_name, merchant_no, contact_person, contact_phone, business_license, status) VALUES 
('merchant_demo_001', '演示商户1', 'M20241201001', '张三', '13800138001', '91110000000000001X', 'active'),
('merchant_demo_002', '演示商户2', 'M20241201002', '李四', '13800138002', '91110000000000002X', 'active');

-- ====================================
-- 创建索引优化查询性能
-- ====================================

-- 支付订单复合索引
CREATE INDEX idx_payment_orders_user_status_time ON payment_orders(user_id, status, created_at);
CREATE INDEX idx_payment_orders_merchant_status_time ON payment_orders(merchant_id, status, paid_at);

-- 积分记录复合索引  
CREATE INDEX idx_points_records_user_time ON points_records(user_id, created_at);
CREATE INDEX idx_points_records_user_source_time ON points_records(user_id, source, created_at);

-- ====================================
-- 创建视图便于查询
-- ====================================

-- 用户积分统计视图
CREATE VIEW v_user_points_summary AS
SELECT 
  u.id as user_id,
  u.nickname,
  u.points_balance,
  COALESCE(SUM(CASE WHEN pr.points_change > 0 THEN pr.points_change ELSE 0 END), 0) as total_earned,
  COALESCE(SUM(CASE WHEN pr.points_change < 0 THEN ABS(pr.points_change) ELSE 0 END), 0) as total_spent,
  COUNT(DISTINCT po.id) as total_orders,
  COALESCE(SUM(po.amount), 0) as total_payment_amount
FROM users u
LEFT JOIN points_records pr ON u.id = pr.user_id
LEFT JOIN payment_orders po ON u.id = po.user_id AND po.status = 'paid'
GROUP BY u.id, u.nickname, u.points_balance;

-- 商户交易统计视图
CREATE VIEW v_merchant_transaction_summary AS
SELECT 
  m.id as merchant_id,
  m.merchant_name,
  m.status,
  COUNT(po.id) as total_orders,
  COALESCE(SUM(CASE WHEN po.status = 'paid' THEN po.amount ELSE 0 END), 0) as total_amount,
  COALESCE(SUM(CASE WHEN po.status = 'paid' THEN po.points_awarded ELSE 0 END), 0) as total_points_awarded,
  MAX(po.paid_at) as last_payment_time
FROM merchants m
LEFT JOIN payment_orders po ON m.id = po.merchant_id
GROUP BY m.id, m.merchant_name, m.status;

-- ====================================
-- 存储过程
-- ====================================

-- 用户积分余额校验存储过程
DELIMITER $$
CREATE PROCEDURE VerifyUserPointsBalance(IN p_user_id VARCHAR(50))
BEGIN
  DECLARE calculated_balance DECIMAL(15,2);
  DECLARE current_balance DECIMAL(15,2);
  
  -- 计算积分记录的累计余额
  SELECT COALESCE(SUM(points_change), 0) INTO calculated_balance
  FROM points_records 
  WHERE user_id = p_user_id 
  AND (expires_at IS NULL OR expires_at > NOW());
  
  -- 获取用户表中的余额
  SELECT points_balance INTO current_balance
  FROM users 
  WHERE id = p_user_id;
  
  -- 比较余额是否一致
  IF calculated_balance != current_balance THEN
    SELECT 
      p_user_id as user_id,
      calculated_balance as calculated_balance,
      current_balance as stored_balance,
      'BALANCE_MISMATCH' as status;
  ELSE
    SELECT 
      p_user_id as user_id,
      calculated_balance as balance,
      'BALANCE_CORRECT' as status;
  END IF;
END$$
DELIMITER ;

-- ====================================
-- 定时任务相关
-- ====================================

-- 创建定时任务日志表
CREATE TABLE IF NOT EXISTS cron_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL COMMENT '任务名称',
  status ENUM('running', 'completed', 'failed') NOT NULL COMMENT '执行状态',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  end_time TIMESTAMP NULL COMMENT '结束时间',
  result_message TEXT NULL COMMENT '执行结果',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  INDEX idx_job_name (job_name),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时任务日志表';

-- ====================================
-- 数据库完整性检查
-- ====================================

-- 检查表是否创建成功
SELECT 
  TABLE_NAME as '表名',
  TABLE_ROWS as '行数',
  DATA_LENGTH as '数据大小',
  INDEX_LENGTH as '索引大小'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'points_app'
ORDER BY TABLE_NAME;
