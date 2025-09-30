-- ==========================================
-- 微信支付积分系统 - 测试数据生成脚本
-- 生成100组真实关联数据
-- 创建时间：2025-09-30
-- ==========================================

USE weixin_payment;

-- 清空现有测试数据（保留结构）
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE point_records;
TRUNCATE TABLE user_points;
TRUNCATE TABLE payment_orders;
TRUNCATE TABLE merchants;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. 插入100个用户数据
-- ==========================================

INSERT INTO users (id, wechat_openid, wechat_unionid, nickname, avatar_url, phone, gender, city, province, country, created_at, updated_at, status) VALUES
-- 用户 1-20 (北京地区)
('user_001', 'wx_openid_001', 'wx_unionid_001', '张伟', 'https://thirdwx.qlogo.cn/mmopen/001.jpg', '13800138001', 1, '北京', '北京市', '中国', '2025-09-01 08:30:00', '2025-09-30 10:00:00', 'active'),
('user_002', 'wx_openid_002', 'wx_unionid_002', '王芳', 'https://thirdwx.qlogo.cn/mmopen/002.jpg', '13800138002', 2, '北京', '北京市', '中国', '2025-09-01 09:15:00', '2025-09-30 09:30:00', 'active'),
('user_003', 'wx_openid_003', 'wx_unionid_003', '李明', 'https://thirdwx.qlogo.cn/mmopen/003.jpg', '13800138003', 1, '北京', '北京市', '中国', '2025-09-02 10:20:00', '2025-09-29 14:20:00', 'active'),
('user_004', 'wx_openid_004', 'wx_unionid_004', '刘静', 'https://thirdwx.qlogo.cn/mmopen/004.jpg', '13800138004', 2, '北京', '北京市', '中国', '2025-09-02 11:45:00', '2025-09-28 16:45:00', 'active'),
('user_005', 'wx_openid_005', 'wx_unionid_005', '陈强', 'https://thirdwx.qlogo.cn/mmopen/005.jpg', '13800138005', 1, '北京', '北京市', '中国', '2025-09-03 08:00:00', '2025-09-30 08:15:00', 'active'),
('user_006', 'wx_openid_006', 'wx_unionid_006', '杨丽', 'https://thirdwx.qlogo.cn/mmopen/006.jpg', '13800138006', 2, '北京', '北京市', '中国', '2025-09-03 09:30:00', '2025-09-29 11:00:00', 'active'),
('user_007', 'wx_openid_007', 'wx_unionid_007', '赵勇', 'https://thirdwx.qlogo.cn/mmopen/007.jpg', '13800138007', 1, '北京', '北京市', '中国', '2025-09-04 10:15:00', '2025-09-28 15:30:00', 'active'),
('user_008', 'wx_openid_008', 'wx_unionid_008', '黄秀英', 'https://thirdwx.qlogo.cn/mmopen/008.jpg', '13800138008', 2, '北京', '北京市', '中国', '2025-09-04 11:00:00', '2025-09-30 12:00:00', 'active'),
('user_009', 'wx_openid_009', 'wx_unionid_009', '周涛', 'https://thirdwx.qlogo.cn/mmopen/009.jpg', '13800138009', 1, '北京', '北京市', '中国', '2025-09-05 08:45:00', '2025-09-29 09:15:00', 'active'),
('user_010', 'wx_openid_010', 'wx_unionid_010', '吴娜', 'https://thirdwx.qlogo.cn/mmopen/010.jpg', '13800138010', 2, '北京', '北京市', '中国', '2025-09-05 09:20:00', '2025-09-28 10:30:00', 'active'),
('user_011', 'wx_openid_011', 'wx_unionid_011', '徐军', 'https://thirdwx.qlogo.cn/mmopen/011.jpg', '13800138011', 1, '北京', '北京市', '中国', '2025-09-06 10:00:00', '2025-09-30 11:45:00', 'active'),
('user_012', 'wx_openid_012', 'wx_unionid_012', '孙敏', 'https://thirdwx.qlogo.cn/mmopen/012.jpg', '13800138012', 2, '北京', '北京市', '中国', '2025-09-06 11:30:00', '2025-09-29 13:20:00', 'active'),
('user_013', 'wx_openid_013', 'wx_unionid_013', '朱峰', 'https://thirdwx.qlogo.cn/mmopen/013.jpg', '13800138013', 1, '北京', '北京市', '中国', '2025-09-07 08:15:00', '2025-09-28 14:00:00', 'active'),
('user_014', 'wx_openid_014', 'wx_unionid_014', '胡玲', 'https://thirdwx.qlogo.cn/mmopen/014.jpg', '13800138014', 2, '北京', '北京市', '中国', '2025-09-07 09:45:00', '2025-09-30 15:30:00', 'active'),
('user_015', 'wx_openid_015', 'wx_unionid_015', '郭鹏', 'https://thirdwx.qlogo.cn/mmopen/015.jpg', '13800138015', 1, '北京', '北京市', '中国', '2025-09-08 10:30:00', '2025-09-29 16:15:00', 'active'),
('user_016', 'wx_openid_016', 'wx_unionid_016', '林慧', 'https://thirdwx.qlogo.cn/mmopen/016.jpg', '13800138016', 2, '北京', '北京市', '中国', '2025-09-08 11:15:00', '2025-09-28 17:00:00', 'active'),
('user_017', 'wx_openid_017', 'wx_unionid_017', '何斌', 'https://thirdwx.qlogo.cn/mmopen/017.jpg', '13800138017', 1, '北京', '北京市', '中国', '2025-09-09 08:00:00', '2025-09-30 08:45:00', 'active'),
('user_018', 'wx_openid_018', 'wx_unionid_018', '高艳', 'https://thirdwx.qlogo.cn/mmopen/018.jpg', '13800138018', 2, '北京', '北京市', '中国', '2025-09-09 09:30:00', '2025-09-29 10:00:00', 'active'),
('user_019', 'wx_openid_019', 'wx_unionid_019', '罗杰', 'https://thirdwx.qlogo.cn/mmopen/019.jpg', '13800138019', 1, '北京', '北京市', '中国', '2025-09-10 10:15:00', '2025-09-28 11:30:00', 'active'),
('user_020', 'wx_openid_020', 'wx_unionid_020', '宋梅', 'https://thirdwx.qlogo.cn/mmopen/020.jpg', '13800138020', 2, '北京', '北京市', '中国', '2025-09-10 11:00:00', '2025-09-30 12:15:00', 'active'),

-- 用户 21-40 (上海地区)
('user_021', 'wx_openid_021', 'wx_unionid_021', '谢浩', 'https://thirdwx.qlogo.cn/mmopen/021.jpg', '13800138021', 1, '上海', '上海市', '中国', '2025-09-11 08:30:00', '2025-09-29 13:00:00', 'active'),
('user_022', 'wx_openid_022', 'wx_unionid_022', '邓丽', 'https://thirdwx.qlogo.cn/mmopen/022.jpg', '13800138022', 2, '上海', '上海市', '中国', '2025-09-11 09:15:00', '2025-09-28 14:30:00', 'active'),
('user_023', 'wx_openid_023', 'wx_unionid_023', '韩磊', 'https://thirdwx.qlogo.cn/mmopen/023.jpg', '13800138023', 1, '上海', '上海市', '中国', '2025-09-12 10:00:00', '2025-09-30 15:00:00', 'active'),
('user_024', 'wx_openid_024', 'wx_unionid_024', '唐红', 'https://thirdwx.qlogo.cn/mmopen/024.jpg', '13800138024', 2, '上海', '上海市', '中国', '2025-09-12 10:45:00', '2025-09-29 16:30:00', 'active'),
('user_025', 'wx_openid_025', 'wx_unionid_025', '冯强', 'https://thirdwx.qlogo.cn/mmopen/025.jpg', '13800138025', 1, '上海', '上海市', '中国', '2025-09-13 08:15:00', '2025-09-28 08:00:00', 'active'),
('user_026', 'wx_openid_026', 'wx_unionid_026', '于萍', 'https://thirdwx.qlogo.cn/mmopen/026.jpg', '13800138026', 2, '上海', '上海市', '中国', '2025-09-13 09:00:00', '2025-09-30 09:30:00', 'active'),
('user_027', 'wx_openid_027', 'wx_unionid_027', '董伟', 'https://thirdwx.qlogo.cn/mmopen/027.jpg', '13800138027', 1, '上海', '上海市', '中国', '2025-09-14 09:45:00', '2025-09-29 10:15:00', 'active'),
('user_028', 'wx_openid_028', 'wx_unionid_028', '潘静', 'https://thirdwx.qlogo.cn/mmopen/028.jpg', '13800138028', 2, '上海', '上海市', '中国', '2025-09-14 10:30:00', '2025-09-28 11:00:00', 'active'),
('user_029', 'wx_openid_029', 'wx_unionid_029', '袁刚', 'https://thirdwx.qlogo.cn/mmopen/029.jpg', '13800138029', 1, '上海', '上海市', '中国', '2025-09-15 08:00:00', '2025-09-30 12:30:00', 'active'),
('user_030', 'wx_openid_030', 'wx_unionid_030', '蔡芳', 'https://thirdwx.qlogo.cn/mmopen/030.jpg', '13800138030', 2, '上海', '上海市', '中国', '2025-09-15 08:45:00', '2025-09-29 13:15:00', 'active'),
('user_031', 'wx_openid_031', 'wx_unionid_031', '蒋涛', 'https://thirdwx.qlogo.cn/mmopen/031.jpg', '13800138031', 1, '上海', '上海市', '中国', '2025-09-16 09:30:00', '2025-09-28 14:00:00', 'active'),
('user_032', 'wx_openid_032', 'wx_unionid_032', '余娜', 'https://thirdwx.qlogo.cn/mmopen/032.jpg', '13800138032', 2, '上海', '上海市', '中国', '2025-09-16 10:15:00', '2025-09-30 14:45:00', 'active'),
('user_033', 'wx_openid_033', 'wx_unionid_033', '段军', 'https://thirdwx.qlogo.cn/mmopen/033.jpg', '13800138033', 1, '上海', '上海市', '中国', '2025-09-17 08:20:00', '2025-09-29 15:30:00', 'active'),
('user_034', 'wx_openid_034', 'wx_unionid_034', '薛敏', 'https://thirdwx.qlogo.cn/mmopen/034.jpg', '13800138034', 2, '上海', '上海市', '中国', '2025-09-17 09:05:00', '2025-09-28 16:15:00', 'active'),
('user_035', 'wx_openid_035', 'wx_unionid_035', '吕峰', 'https://thirdwx.qlogo.cn/mmopen/035.jpg', '13800138035', 1, '上海', '上海市', '中国', '2025-09-18 09:50:00', '2025-09-30 17:00:00', 'active'),
('user_036', 'wx_openid_036', 'wx_unionid_036', '丁玲', 'https://thirdwx.qlogo.cn/mmopen/036.jpg', '13800138036', 2, '上海', '上海市', '中国', '2025-09-18 10:35:00', '2025-09-29 08:30:00', 'active'),
('user_037', 'wx_openid_037', 'wx_unionid_037', '任鹏', 'https://thirdwx.qlogo.cn/mmopen/037.jpg', '13800138037', 1, '上海', '上海市', '中国', '2025-09-19 08:10:00', '2025-09-28 09:15:00', 'active'),
('user_038', 'wx_openid_038', 'wx_unionid_038', '姜慧', 'https://thirdwx.qlogo.cn/mmopen/038.jpg', '13800138038', 2, '上海', '上海市', '中国', '2025-09-19 08:55:00', '2025-09-30 10:00:00', 'active'),
('user_039', 'wx_openid_039', 'wx_unionid_039', '崔斌', 'https://thirdwx.qlogo.cn/mmopen/039.jpg', '13800138039', 1, '上海', '上海市', '中国', '2025-09-20 09:40:00', '2025-09-29 10:45:00', 'active'),
('user_040', 'wx_openid_040', 'wx_unionid_040', '钟艳', 'https://thirdwx.qlogo.cn/mmopen/040.jpg', '13800138040', 2, '上海', '上海市', '中国', '2025-09-20 10:25:00', '2025-09-28 11:30:00', 'active'),

-- 用户 41-60 (广州地区)
('user_041', 'wx_openid_041', 'wx_unionid_041', '谭杰', 'https://thirdwx.qlogo.cn/mmopen/041.jpg', '13800138041', 1, '广州', '广东省', '中国', '2025-09-21 08:00:00', '2025-09-30 12:15:00', 'active'),
('user_042', 'wx_openid_042', 'wx_unionid_042', '陆红', 'https://thirdwx.qlogo.cn/mmopen/042.jpg', '13800138042', 2, '广州', '广东省', '中国', '2025-09-21 08:45:00', '2025-09-29 13:00:00', 'active'),
('user_043', 'wx_openid_043', 'wx_unionid_043', '范浩', 'https://thirdwx.qlogo.cn/mmopen/043.jpg', '13800138043', 1, '广州', '广东省', '中国', '2025-09-22 09:30:00', '2025-09-28 13:45:00', 'active'),
('user_044', 'wx_openid_044', 'wx_unionid_044', '汪丽', 'https://thirdwx.qlogo.cn/mmopen/044.jpg', '13800138044', 2, '广州', '广东省', '中国', '2025-09-22 10:15:00', '2025-09-30 14:30:00', 'active'),
('user_045', 'wx_openid_045', 'wx_unionid_045', '金磊', 'https://thirdwx.qlogo.cn/mmopen/045.jpg', '13800138045', 1, '广州', '广东省', '中国', '2025-09-23 08:20:00', '2025-09-29 15:15:00', 'active'),
('user_046', 'wx_openid_046', 'wx_unionid_046', '石萍', 'https://thirdwx.qlogo.cn/mmopen/046.jpg', '13800138046', 2, '广州', '广东省', '中国', '2025-09-23 09:05:00', '2025-09-28 16:00:00', 'active'),
('user_047', 'wx_openid_047', 'wx_unionid_047', '廖强', 'https://thirdwx.qlogo.cn/mmopen/047.jpg', '13800138047', 1, '广州', '广东省', '中国', '2025-09-24 09:50:00', '2025-09-30 16:45:00', 'active'),
('user_048', 'wx_openid_048', 'wx_unionid_048', '贾娜', 'https://thirdwx.qlogo.cn/mmopen/048.jpg', '13800138048', 2, '广州', '广东省', '中国', '2025-09-24 10:35:00', '2025-09-29 08:00:00', 'active'),
('user_049', 'wx_openid_049', 'wx_unionid_049', '夏军', 'https://thirdwx.qlogo.cn/mmopen/049.jpg', '13800138049', 1, '广州', '广东省', '中国', '2025-09-25 08:10:00', '2025-09-28 08:45:00', 'active'),
('user_050', 'wx_openid_050', 'wx_unionid_050', '方敏', 'https://thirdwx.qlogo.cn/mmopen/050.jpg', '13800138050', 2, '广州', '广东省', '中国', '2025-09-25 08:55:00', '2025-09-30 09:30:00', 'active'),
('user_051', 'wx_openid_051', 'wx_unionid_051', '白峰', 'https://thirdwx.qlogo.cn/mmopen/051.jpg', '13800138051', 1, '广州', '广东省', '中国', '2025-09-26 09:40:00', '2025-09-29 10:15:00', 'active'),
('user_052', 'wx_openid_052', 'wx_unionid_052', '邹玲', 'https://thirdwx.qlogo.cn/mmopen/052.jpg', '13800138052', 2, '广州', '广东省', '中国', '2025-09-26 10:25:00', '2025-09-28 11:00:00', 'active'),
('user_053', 'wx_openid_053', 'wx_unionid_053', '孟鹏', 'https://thirdwx.qlogo.cn/mmopen/053.jpg', '13800138053', 1, '广州', '广东省', '中国', '2025-09-27 08:05:00', '2025-09-30 11:45:00', 'active'),
('user_054', 'wx_openid_054', 'wx_unionid_054', '龚慧', 'https://thirdwx.qlogo.cn/mmopen/054.jpg', '13800138054', 2, '广州', '广东省', '中国', '2025-09-27 08:50:00', '2025-09-29 12:30:00', 'active'),
('user_055', 'wx_openid_055', 'wx_unionid_055', '万斌', 'https://thirdwx.qlogo.cn/mmopen/055.jpg', '13800138055', 1, '广州', '广东省', '中国', '2025-09-27 09:35:00', '2025-09-28 13:15:00', 'active'),
('user_056', 'wx_openid_056', 'wx_unionid_056', '熊艳', 'https://thirdwx.qlogo.cn/mmopen/056.jpg', '13800138056', 2, '广州', '广东省', '中国', '2025-09-27 10:20:00', '2025-09-30 14:00:00', 'active'),
('user_057', 'wx_openid_057', 'wx_unionid_057', '秦杰', 'https://thirdwx.qlogo.cn/mmopen/057.jpg', '13800138057', 1, '广州', '广东省', '中国', '2025-09-28 08:00:00', '2025-09-29 14:45:00', 'active'),
('user_058', 'wx_openid_058', 'wx_unionid_058', '毛红', 'https://thirdwx.qlogo.cn/mmopen/058.jpg', '13800138058', 2, '广州', '广东省', '中国', '2025-09-28 08:45:00', '2025-09-28 15:30:00', 'active'),
('user_059', 'wx_openid_059', 'wx_unionid_059', '江浩', 'https://thirdwx.qlogo.cn/mmopen/059.jpg', '13800138059', 1, '广州', '广东省', '中国', '2025-09-28 09:30:00', '2025-09-30 16:15:00', 'active'),
('user_060', 'wx_openid_060', 'wx_unionid_060', '童丽', 'https://thirdwx.qlogo.cn/mmopen/060.jpg', '13800138060', 2, '广州', '广东省', '中国', '2025-09-28 10:15:00', '2025-09-29 17:00:00', 'active'),

-- 用户 61-80 (深圳地区)
('user_061', 'wx_openid_061', 'wx_unionid_061', '史磊', 'https://thirdwx.qlogo.cn/mmopen/061.jpg', '13800138061', 1, '深圳', '广东省', '中国', '2025-09-21 11:00:00', '2025-09-28 08:15:00', 'active'),
('user_062', 'wx_openid_062', 'wx_unionid_062', '龙萍', 'https://thirdwx.qlogo.cn/mmopen/062.jpg', '13800138062', 2, '深圳', '广东省', '中国', '2025-09-21 11:45:00', '2025-09-30 09:00:00', 'active'),
('user_063', 'wx_openid_063', 'wx_unionid_063', '黎强', 'https://thirdwx.qlogo.cn/mmopen/063.jpg', '13800138063', 1, '深圳', '广东省', '中国', '2025-09-22 08:30:00', '2025-09-29 09:45:00', 'active'),
('user_064', 'wx_openid_064', 'wx_unionid_064', '易娜', 'https://thirdwx.qlogo.cn/mmopen/064.jpg', '13800138064', 2, '深圳', '广东省', '中国', '2025-09-22 09:15:00', '2025-09-28 10:30:00', 'active'),
('user_065', 'wx_openid_065', 'wx_unionid_065', '常军', 'https://thirdwx.qlogo.cn/mmopen/065.jpg', '13800138065', 1, '深圳', '广东省', '中国', '2025-09-23 10:00:00', '2025-09-30 11:15:00', 'active'),
('user_066', 'wx_openid_066', 'wx_unionid_066', '武敏', 'https://thirdwx.qlogo.cn/mmopen/066.jpg', '13800138066', 2, '深圳', '广东省', '中国', '2025-09-23 10:45:00', '2025-09-29 12:00:00', 'active'),
('user_067', 'wx_openid_067', 'wx_unionid_067', '乔峰', 'https://thirdwx.qlogo.cn/mmopen/067.jpg', '13800138067', 1, '深圳', '广东省', '中国', '2025-09-24 08:20:00', '2025-09-28 12:45:00', 'active'),
('user_068', 'wx_openid_068', 'wx_unionid_068', '赖玲', 'https://thirdwx.qlogo.cn/mmopen/068.jpg', '13800138068', 2, '深圳', '广东省', '中国', '2025-09-24 09:05:00', '2025-09-30 13:30:00', 'active'),
('user_069', 'wx_openid_069', 'wx_unionid_069', '文鹏', 'https://thirdwx.qlogo.cn/mmopen/069.jpg', '13800138069', 1, '深圳', '广东省', '中国', '2025-09-25 09:50:00', '2025-09-29 14:15:00', 'active'),
('user_070', 'wx_openid_070', 'wx_unionid_070', '左慧', 'https://thirdwx.qlogo.cn/mmopen/070.jpg', '13800138070', 2, '深圳', '广东省', '中国', '2025-09-25 10:35:00', '2025-09-28 15:00:00', 'active'),
('user_071', 'wx_openid_071', 'wx_unionid_071', '井斌', 'https://thirdwx.qlogo.cn/mmopen/071.jpg', '13800138071', 1, '深圳', '广东省', '中国', '2025-09-26 08:10:00', '2025-09-30 15:45:00', 'active'),
('user_072', 'wx_openid_072', 'wx_unionid_072', '牛艳', 'https://thirdwx.qlogo.cn/mmopen/072.jpg', '13800138072', 2, '深圳', '广东省', '中国', '2025-09-26 08:55:00', '2025-09-29 16:30:00', 'active'),
('user_073', 'wx_openid_073', 'wx_unionid_073', '单杰', 'https://thirdwx.qlogo.cn/mmopen/073.jpg', '13800138073', 1, '深圳', '广东省', '中国', '2025-09-26 09:40:00', '2025-09-28 08:00:00', 'active'),
('user_074', 'wx_openid_074', 'wx_unionid_074', '洪红', 'https://thirdwx.qlogo.cn/mmopen/074.jpg', '13800138074', 2, '深圳', '广东省', '中国', '2025-09-26 10:25:00', '2025-09-30 08:45:00', 'active'),
('user_075', 'wx_openid_075', 'wx_unionid_075', '包浩', 'https://thirdwx.qlogo.cn/mmopen/075.jpg', '13800138075', 1, '深圳', '广东省', '中国', '2025-09-27 08:05:00', '2025-09-29 09:30:00', 'active'),
('user_076', 'wx_openid_076', 'wx_unionid_076', '鲍丽', 'https://thirdwx.qlogo.cn/mmopen/076.jpg', '13800138076', 2, '深圳', '广东省', '中国', '2025-09-27 08:50:00', '2025-09-28 10:15:00', 'active'),
('user_077', 'wx_openid_077', 'wx_unionid_077', '舒磊', 'https://thirdwx.qlogo.cn/mmopen/077.jpg', '13800138077', 1, '深圳', '广东省', '中国', '2025-09-27 09:35:00', '2025-09-30 11:00:00', 'active'),
('user_078', 'wx_openid_078', 'wx_unionid_078', '焦萍', 'https://thirdwx.qlogo.cn/mmopen/078.jpg', '13800138078', 2, '深圳', '广东省', '中国', '2025-09-27 10:20:00', '2025-09-29 11:45:00', 'active'),
('user_079', 'wx_openid_079', 'wx_unionid_079', '柴强', 'https://thirdwx.qlogo.cn/mmopen/079.jpg', '13800138079', 1, '深圳', '广东省', '中国', '2025-09-28 08:00:00', '2025-09-28 12:30:00', 'active'),
('user_080', 'wx_openid_080', 'wx_unionid_080', '曲娜', 'https://thirdwx.qlogo.cn/mmopen/080.jpg', '13800138080', 2, '深圳', '广东省', '中国', '2025-09-28 08:45:00', '2025-09-30 13:15:00', 'active'),

-- 用户 81-100 (杭州地区)
('user_081', 'wx_openid_081', 'wx_unionid_081', '严军', 'https://thirdwx.qlogo.cn/mmopen/081.jpg', '13800138081', 1, '杭州', '浙江省', '中国', '2025-09-20 11:00:00', '2025-09-29 14:00:00', 'active'),
('user_082', 'wx_openid_082', 'wx_unionid_082', '牟敏', 'https://thirdwx.qlogo.cn/mmopen/082.jpg', '13800138082', 2, '杭州', '浙江省', '中国', '2025-09-20 11:45:00', '2025-09-28 14:45:00', 'active'),
('user_083', 'wx_openid_083', 'wx_unionid_083', '纪峰', 'https://thirdwx.qlogo.cn/mmopen/083.jpg', '13800138083', 1, '杭州', '浙江省', '中国', '2025-09-21 08:30:00', '2025-09-30 15:30:00', 'active'),
('user_084', 'wx_openid_084', 'wx_unionid_084', '车玲', 'https://thirdwx.qlogo.cn/mmopen/084.jpg', '13800138084', 2, '杭州', '浙江省', '中国', '2025-09-21 09:15:00', '2025-09-29 16:15:00', 'active'),
('user_085', 'wx_openid_085', 'wx_unionid_085', '侯鹏', 'https://thirdwx.qlogo.cn/mmopen/085.jpg', '13800138085', 1, '杭州', '浙江省', '中国', '2025-09-22 10:00:00', '2025-09-28 17:00:00', 'active'),
('user_086', 'wx_openid_086', 'wx_unionid_086', '宫慧', 'https://thirdwx.qlogo.cn/mmopen/086.jpg', '13800138086', 2, '杭州', '浙江省', '中国', '2025-09-22 10:45:00', '2025-09-30 08:15:00', 'active'),
('user_087', 'wx_openid_087', 'wx_unionid_087', '宁斌', 'https://thirdwx.qlogo.cn/mmopen/087.jpg', '13800138087', 1, '杭州', '浙江省', '中国', '2025-09-23 08:20:00', '2025-09-29 09:00:00', 'active'),
('user_088', 'wx_openid_088', 'wx_unionid_088', '甄艳', 'https://thirdwx.qlogo.cn/mmopen/088.jpg', '13800138088', 2, '杭州', '浙江省', '中国', '2025-09-23 09:05:00', '2025-09-28 09:45:00', 'active'),
('user_089', 'wx_openid_089', 'wx_unionid_089', '凌杰', 'https://thirdwx.qlogo.cn/mmopen/089.jpg', '13800138089', 1, '杭州', '浙江省', '中国', '2025-09-24 09:50:00', '2025-09-30 10:30:00', 'active'),
('user_090', 'wx_openid_090', 'wx_unionid_090', '霍红', 'https://thirdwx.qlogo.cn/mmopen/090.jpg', '13800138090', 2, '杭州', '浙江省', '中国', '2025-09-24 10:35:00', '2025-09-29 11:15:00', 'active'),
('user_091', 'wx_openid_091', 'wx_unionid_091', '虞浩', 'https://thirdwx.qlogo.cn/mmopen/091.jpg', '13800138091', 1, '杭州', '浙江省', '中国', '2025-09-25 08:10:00', '2025-09-28 12:00:00', 'active'),
('user_092', 'wx_openid_092', 'wx_unionid_092', '齐丽', 'https://thirdwx.qlogo.cn/mmopen/092.jpg', '13800138092', 2, '杭州', '浙江省', '中国', '2025-09-25 08:55:00', '2025-09-30 12:45:00', 'active'),
('user_093', 'wx_openid_093', 'wx_unionid_093', '伍磊', 'https://thirdwx.qlogo.cn/mmopen/093.jpg', '13800138093', 1, '杭州', '浙江省', '中国', '2025-09-26 09:40:00', '2025-09-29 13:30:00', 'active'),
('user_094', 'wx_openid_094', 'wx_unionid_094', '余萍', 'https://thirdwx.qlogo.cn/mmopen/094.jpg', '13800138094', 2, '杭州', '浙江省', '中国', '2025-09-26 10:25:00', '2025-09-28 14:15:00', 'active'),
('user_095', 'wx_openid_095', 'wx_unionid_095', '元强', 'https://thirdwx.qlogo.cn/mmopen/095.jpg', '13800138095', 1, '杭州', '浙江省', '中国', '2025-09-27 08:05:00', '2025-09-30 15:00:00', 'active'),
('user_096', 'wx_openid_096', 'wx_unionid_096', '卜娜', 'https://thirdwx.qlogo.cn/mmopen/096.jpg', '13800138096', 2, '杭州', '浙江省', '中国', '2025-09-27 08:50:00', '2025-09-29 15:45:00', 'active'),
('user_097', 'wx_openid_097', 'wx_unionid_097', '顾军', 'https://thirdwx.qlogo.cn/mmopen/097.jpg', '13800138097', 1, '杭州', '浙江省', '中国', '2025-09-27 09:35:00', '2025-09-28 16:30:00', 'active'),
('user_098', 'wx_openid_098', 'wx_unionid_098', '孟敏', 'https://thirdwx.qlogo.cn/mmopen/098.jpg', '13800138098', 2, '杭州', '浙江省', '中国', '2025-09-27 10:20:00', '2025-09-30 17:15:00', 'active'),
('user_099', 'wx_openid_099', 'wx_unionid_099', '平峰', 'https://thirdwx.qlogo.cn/mmopen/099.jpg', '13800138099', 1, '杭州', '浙江省', '中国', '2025-09-28 08:00:00', '2025-09-29 08:30:00', 'active'),
('user_100', 'wx_openid_100', 'wx_unionid_100', '黄玲', 'https://thirdwx.qlogo.cn/mmopen/100.jpg', '13800138100', 2, '杭州', '浙江省', '中国', '2025-09-28 08:45:00', '2025-09-28 09:15:00', 'active');

-- 生成100个用户完成
SELECT '✅ 已插入100个用户数据' AS status;
