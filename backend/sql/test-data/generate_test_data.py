#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信支付积分系统 - 测试数据生成脚本
生成100组真实关联的测试数据
"""

import random
import datetime

# 配置
NUM_USERS = 100
NUM_MERCHANTS = 20
NUM_ORDERS = 200  # 平均每个用户2单

# 真实的商户类型和名称
MERCHANT_TYPES = {
    '餐饮': ['星巴克咖啡', '肯德基', '麦当劳', '海底捞火锅', '西贝莜面村', '外婆家', '绿茶餐厅', '呷哺呷哺'],
    '超市': ['沃尔玛超市', '家乐福', '永辉超市', '华润万家', '物美超市'],
    '服装': ['优衣库', 'ZARA', 'H&M', '太平鸟', '波司登'],
    '娱乐': ['万达影城', '横店影城', 'K歌之王KTV', '大玩家游戏厅'],
    '美容': ['屈臣氏', '丝芙兰', '悦诗风吟'],
    '数码': ['苹果专卖店', '小米之家', '华为体验店']
}

# 城市和地区
CITIES = {
    '北京': '北京市',
    '上海': '上海市',
    '广州': '广东省',
    '深圳': '广东省',
    '杭州': '浙江省'
}

# 生成SQL文件
def generate_merchants_sql():
    """生成20个商户数据"""
    merchants = []
    merchant_id = 1
    
    for category, names in MERCHANT_TYPES.items():
        for name in names:
            if merchant_id > NUM_MERCHANTS:
                break
            
            # 随机选择城市
            city = random.choice(list(CITIES.keys()))
            province = CITIES[city]
            
            # 随机生成商户编号
            mch_id = f"156{random.randint(100000, 999999)}"
            
            sql = f"""('mch_{merchant_id:03d}', '{name}', '{mch_id}', '{category}', '{city}{random.choice(['市中心店', '万达店', '购物中心店', '旗舰店'])}', '{city}', '{province}', '中国', '{random.randint(10, 50)}%', 'active', '2025-09-{random.randint(1, 28):02d} {random.randint(8, 18):02d}:00:00', '2025-09-30 12:00:00')"""
            merchants.append(sql)
            merchant_id += 1
            
            if merchant_id > NUM_MERCHANTS:
                break
    
    return merchants

def generate_orders_and_points_sql():
    """生成200个订单和对应的积分记录"""
    orders = []
    point_records = []
    user_points = {}
    
    # 支付金额范围（分）
    amounts = [
        (500, 2000, 0.5),    # 5-20元，50%概率
        (2000, 5000, 0.3),   # 20-50元，30%概率
        (5000, 10000, 0.15), # 50-100元，15%概率
        (10000, 50000, 0.05) # 100-500元，5%概率
    ]
    
    for i in range(1, NUM_ORDERS + 1):
        # 随机选择用户
        user_id = f"user_{random.randint(1, NUM_USERS):03d}"
        
        # 随机选择商户
        merchant_id = f"mch_{random.randint(1, NUM_MERCHANTS):03d}"
        
        # 根据概率选择金额
        rand = random.random()
        cumulative = 0
        amount = 0
        for min_amt, max_amt, prob in amounts:
            cumulative += prob
            if rand < cumulative:
                amount = random.randint(min_amt, max_amt)
                break
        
        if amount == 0:
            amount = random.randint(500, 2000)
        
        # 1元=1积分
        points = amount // 100
        
        # 随机生成订单时间（2025年9月）
        day = random.randint(1, 30)
        hour = random.randint(8, 22)
        minute = random.randint(0, 59)
        order_time = f"2025-09-{day:02d} {hour:02d}:{minute:02d}:00"
        
        # 订单状态（95%已完成，5%待支付）
        status = 'completed' if random.random() < 0.95 else 'pending'
        
        # 生成订单SQL
        order_sql = f"""('order_{i:06d}', '{user_id}', '{merchant_id}', {amount}, {points}, '{status}', 'wxpay', NULL, '{order_time}', '{order_time}')"""
        orders.append(order_sql)
        
        # 如果订单已完成，生成积分记录
        if status == 'completed':
            point_record_sql = f"""('point_{i:06d}', '{user_id}', 'earn', {points}, 'order_{i:06d}', '支付订单获得积分', '{order_time}')"""
            point_records.append(point_record_sql)
            
            # 累计用户积分
            if user_id not in user_points:
                user_points[user_id] = {'earned': 0, 'spent': 0}
            user_points[user_id]['earned'] += points
    
    # 生成用户积分汇总
    user_points_sql = []
    for user_id, points_data in user_points.items():
        available = points_data['earned'] - points_data['spent']
        total_earned = points_data['earned']
        total_spent = points_data['spent']
        
        # 计算本月积分（假设本月是9月）
        monthly_earned = int(total_earned * random.uniform(0.2, 0.5))  # 本月占20-50%
        
        updated_time = f"2025-09-{random.randint(20, 30):02d} {random.randint(8, 22):02d}:{random.randint(0, 59):02d}:00"
        
        points_sql = f"""('{user_id}', {available}, {total_earned}, {total_spent}, {monthly_earned}, '{updated_time}')"""
        user_points_sql.append(points_sql)
    
    return orders, point_records, user_points_sql

# 生成完整的SQL文件
def generate_full_sql():
    print("🚀 开始生成测试数据SQL...")
    
    # 生成商户
    print("📦 生成20个商户...")
    merchants = generate_merchants_sql()
    
    # 生成订单和积分
    print("💰 生成200个订单和积分记录...")
    orders, point_records, user_points = generate_orders_and_points_sql()
    
    # 写入SQL文件
    sql_content = """-- ==========================================
-- 商户、订单和积分数据
-- 自动生成于 2025-09-30
-- ==========================================

USE weixin_payment;

-- ==========================================
-- 2. 插入20个商户数据
-- ==========================================

INSERT INTO merchants (id, merchant_name, mch_id, category, store_name, city, province, country, points_ratio, status, created_at, updated_at) VALUES
"""
    
    sql_content += ',\n'.join(merchants) + ';\n\n'
    sql_content += "SELECT '✅ 已插入20个商户数据' AS status;\n\n"
    
    # 订单数据
    sql_content += """-- ==========================================
-- 3. 插入200个支付订单
-- ==========================================

INSERT INTO payment_orders (id, user_id, merchant_id, amount, points_earned, status, payment_method, transaction_id, created_at, updated_at) VALUES
"""
    
    sql_content += ',\n'.join(orders) + ';\n\n'
    sql_content += "SELECT '✅ 已插入200个支付订单' AS status;\n\n"
    
    # 积分记录
    sql_content += """-- ==========================================
-- 4. 插入积分记录
-- ==========================================

INSERT INTO point_records (id, user_id, type, points, order_id, description, created_at) VALUES
"""
    
    sql_content += ',\n'.join(point_records) + ';\n\n'
    sql_content += f"SELECT '✅ 已插入{len(point_records)}条积分记录' AS status;\n\n"
    
    # 用户积分汇总
    sql_content += """-- ==========================================
-- 5. 插入用户积分汇总
-- ==========================================

INSERT INTO user_points (user_id, available_points, total_earned, total_spent, monthly_earned, updated_at) VALUES
"""
    
    sql_content += ',\n'.join(user_points) + ';\n\n'
    sql_content += f"SELECT '✅ 已插入{len(user_points)}个用户的积分汇总' AS status;\n\n"
    
    # 生成统计信息
    sql_content += """-- ==========================================
-- 6. 数据统计信息
-- ==========================================

SELECT 
    '数据生成完成' AS message,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM merchants) AS total_merchants,
    (SELECT COUNT(*) FROM payment_orders) AS total_orders,
    (SELECT COUNT(*) FROM point_records) AS total_point_records,
    (SELECT COUNT(*) FROM user_points) AS total_user_points,
    (SELECT SUM(amount)/100 FROM payment_orders WHERE status='completed') AS total_revenue_yuan,
    (SELECT SUM(points_earned) FROM payment_orders WHERE status='completed') AS total_points_issued;
"""
    
    # 保存文件
    with open('insert_merchants_orders_points.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✅ SQL文件已生成：insert_merchants_orders_points.sql")
    print(f"📊 商户数量：{len(merchants)}")
    print(f"📊 订单数量：{len(orders)}")
    print(f"📊 积分记录：{len(point_records)}")
    print(f"📊 用户积分：{len(user_points)}")

if __name__ == '__main__':
    generate_full_sql()
