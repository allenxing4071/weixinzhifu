-- 商户表字段扩展 - 符合微信支付标准
-- 执行时间：2024年12月
-- 说明：添加微信支付必需字段，保持现有字段不变

USE points_app_dev;

-- 1. 添加微信核心字段
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS applyment_id VARCHAR(64) COMMENT '微信申请单号';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS merchant_type VARCHAR(32) DEFAULT 'INDIVIDUAL' COMMENT '商户类型：INDIVIDUAL个体/ENTERPRISE企业';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(128) COMMENT '联系邮箱';

-- 2. 添加可选的补充字段（便于后续扩展）
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS legal_person VARCHAR(64) COMMENT '法定代表人姓名';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_category VARCHAR(64) COMMENT '经营类目';

-- 3. 添加索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_applyment_id ON merchants(applyment_id);
CREATE INDEX IF NOT EXISTS idx_merchant_type ON merchants(merchant_type);

-- 4. 更新现有5个商户的真实数据
-- 基于MockWechatApiService中的数据

UPDATE merchants SET 
    applyment_id = '2000002691156098',
    merchant_type = 'INDIVIDUAL',
    contact_email = CASE 
        WHEN contact_phone = '13800138001' THEN 'liuyang@example.com'
        ELSE NULL
    END
WHERE merchant_name LIKE '%云锦汇会所%' OR merchant_name LIKE '%仁寿县怀仁街道云锦汇会所%';

UPDATE merchants SET 
    applyment_id = '2000002690858917',
    merchant_type = 'INDIVIDUAL',
    contact_email = CASE 
        WHEN contact_phone = '13800138002' THEN 'liuyang2@example.com'
        ELSE NULL
    END
WHERE merchant_name LIKE '%储府鱼庄%' OR merchant_name LIKE '%仁寿县怀仁街道储府鱼庄%';

UPDATE merchants SET 
    applyment_id = '2000002690623402',
    merchant_type = 'INDIVIDUAL',
    contact_email = CASE 
        WHEN contact_phone = '13800138003' THEN 'liuyang3@example.com'
        ELSE NULL
    END
WHERE merchant_name LIKE '%颐善滋养园%' OR merchant_name LIKE '%仁寿县怀仁街道颐善滋养园%';

UPDATE merchants SET 
    applyment_id = '2000002690164951',
    merchant_type = 'ENTERPRISE',
    legal_person = '邢海龙',
    contact_email = 'xinghailong@zhongxinbohai.com'
WHERE merchant_name LIKE '%中鑫博海%' OR merchant_name LIKE '%成都市中鑫博海%';

UPDATE merchants SET 
    applyment_id = '2000002689372247',
    merchant_type = 'ENTERPRISE',
    legal_person = '赵其军',
    contact_email = 'zhaoqijun@sansitech.com'
WHERE merchant_name LIKE '%叁思科技%' OR merchant_name LIKE '%德阳市叁思科技%';

-- 5. 验证数据更新
SELECT 
    id,
    merchant_name,
    applyment_id,
    sub_mch_id,
    merchant_type,
    contact_person,
    contact_email,
    status
FROM merchants 
WHERE applyment_id IS NOT NULL
ORDER BY created_at;

-- 6. 显示表结构确认
DESCRIBE merchants;
