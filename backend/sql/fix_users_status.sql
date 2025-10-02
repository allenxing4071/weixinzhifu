-- 修复 users 表状态字段
-- 执行时间：2025-10-02
-- 说明：为 users 表添加 status 字段，用于管理用户账户状态

USE weixin_payment;

-- 1. 检查并添加 status 字段（如果不存在）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'locked') NOT NULL DEFAULT 'active' COMMENT '用户状态：active-正常 locked-已锁定' 
AFTER phone;

-- 2. 添加索引（如果不存在）
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_status (status);

-- 3. 将所有现有用户设置为正常状态（确保数据一致性）
UPDATE users SET status = 'active' WHERE status IS NULL;

-- 4. 查看修改结果
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
  SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) as locked_users
FROM users;

-- 5. 显示表结构确认
SHOW CREATE TABLE users;

