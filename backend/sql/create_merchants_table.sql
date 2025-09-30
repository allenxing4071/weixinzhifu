-- 创建完整的商户表
-- 包含所有微信支付标准字段

USE points_app_dev;

-- 创建商户表
CREATE TABLE IF NOT EXISTS merchants (
  id VARCHAR(50) PRIMARY KEY COMMENT '商户ID',
  merchant_name VARCHAR(200) NOT NULL COMMENT '商户名称',
  merchant_no VARCHAR(50) NOT NULL UNIQUE COMMENT '商户编号',
  contact_person VARCHAR(100) NOT NULL COMMENT '联系人',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  business_license VARCHAR(50) NOT NULL COMMENT '营业执照号',
  status ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'pending' COMMENT '商户状态',
  qr_code TEXT NULL COMMENT '收款二维码',
  sub_mch_id VARCHAR(32) NULL COMMENT '微信特约商户号',
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '总收款金额',
  total_orders INT NOT NULL DEFAULT 0 COMMENT '总订单数',
  
  -- 新增微信标准字段
  applyment_id VARCHAR(64) NULL COMMENT '微信申请单号',
  merchant_type VARCHAR(32) DEFAULT 'INDIVIDUAL' COMMENT '商户类型：INDIVIDUAL个体/ENTERPRISE企业',
  contact_email VARCHAR(128) NULL COMMENT '联系邮箱',
  legal_person VARCHAR(64) NULL COMMENT '法定代表人姓名',
  business_category VARCHAR(64) NULL COMMENT '经营类目',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_merchant_no (merchant_no),
  INDEX idx_status (status),
  INDEX idx_applyment_id (applyment_id),
  INDEX idx_merchant_type (merchant_type),
  INDEX idx_sub_mch_id (sub_mch_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户表';

-- 插入测试数据（基于MockWechatApiService中的真实商户数据）
INSERT INTO merchants (
  id, merchant_name, merchant_no, contact_person, contact_phone, business_license,
  status, sub_mch_id, applyment_id, merchant_type, contact_email, legal_person, business_category,
  total_amount, total_orders
) VALUES 
(
  'merchant_1735113600_abc123',
  '仁寿县怀仁街道云锦汇会所（个体工商户）',
  'M35113600',
  '刘阳',
  '13800138001',
  '91512345MA6CXXX001',
  'active',
  '1728001633',
  '2000002691156098',
  'INDIVIDUAL',
  'liuyang@example.com',
  NULL,
  '休闲娱乐',
  0.00,
  0
),
(
  'merchant_1735113700_def456',
  '成都市中鑫博海国际酒业贸易有限公司',
  'M35113700',
  '邢海龙',
  '13800138004',
  '91512345MA6CXXX004',
  'active',
  '1727774152',
  '2000002690164951',
  'ENTERPRISE',
  'xinghailong@zhongxinbohai.com',
  '邢海龙',
  '酒类贸易',
  15800.50,
  12
),
(
  'merchant_1735113800_ghi789',
  '德阳市叁思科技有限公司',
  'M35113800',
  '赵其军',
  '13800138005',
  '91512345MA6CXXX005',
  'pending',
  '1727565030',
  '2000002689372247',
  'ENTERPRISE',
  'zhaoqijun@sansitech.com',
  '赵其军',
  '软件开发',
  0.00,
  0
) ON DUPLICATE KEY UPDATE 
  merchant_name = VALUES(merchant_name),
  contact_person = VALUES(contact_person),
  contact_phone = VALUES(contact_phone),
  status = VALUES(status),
  applyment_id = VALUES(applyment_id),
  merchant_type = VALUES(merchant_type),
  contact_email = VALUES(contact_email),
  legal_person = VALUES(legal_person),
  business_category = VALUES(business_category);

-- 验证数据
SELECT 
  id,
  merchant_name,
  merchant_no,
  contact_person,
  status,
  sub_mch_id,
  applyment_id,
  merchant_type,
  contact_email
FROM merchants 
ORDER BY created_at;
