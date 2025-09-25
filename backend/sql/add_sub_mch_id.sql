-- 为商户表添加特约商户号字段
-- 支持微信支付服务商模式

USE points_app;

-- 添加特约商户号字段
ALTER TABLE merchants 
ADD COLUMN sub_mch_id VARCHAR(32) NULL COMMENT '微信支付特约商户号' 
AFTER qr_code;

-- 为测试商户添加示例特约商户号
UPDATE merchants 
SET sub_mch_id = '1900000001' 
WHERE merchant_name LIKE '%演示%' OR merchant_name LIKE '%测试%';

-- 查看更新结果
SELECT id, merchant_name, merchant_no, sub_mch_id, status 
FROM merchants 
LIMIT 10;
