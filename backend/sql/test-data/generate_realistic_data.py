#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成真实模拟数据 - 完全适配服务器表结构
数据库：points_app_dev
表：users, merchants, payment_orders, points_records, user_points
"""

import random
import string
from datetime import datetime, timedelta

# ==================== 配置 ====================
NUM_USERS = 100
NUM_MERCHANTS = 20
NUM_ORDERS_PER_USER = 2  # 平均每个用户2笔订单
POINTS_RATE = 0.1  # 积分比例：消费金额的10%

# ==================== 数据源 ====================

# 真实中文姓名
SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈']
GIVEN_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '华', '建华', '秀珍', '建国', '建军', '海燕', '雪梅', '丽娟', '海燕', '秀梅', '丽华', '桂兰', '秀芳', '桂芳', '丽丽', '秀云', '玉兰', '秀梅', '桂珍', '玉梅', '玉珍', '秀荣', '玉华', '桂荣', '玉芳', '秀玲', '桂玲']

# 商户名称
MERCHANT_TYPES = {
    '餐饮': ['川味小厨', '江南味道', '北京烤鸭店', '湘菜馆', '粤菜轩', '东北菜馆', '火锅店', '日式料理', '韩式烤肉', '西餐厅', '咖啡馆', '茶餐厅', '面馆', '饺子馆', '麻辣烫'],
    '零售': ['便利店', '超市', '水果店', '蛋糕店', '面包房', '烘焙坊', '奶茶店', '饮品店', '书店', '文具店', '花店', '服装店', '鞋店', '箱包店', '化妆品店'],
    '娱乐': ['电影院', 'KTV', '游戏厅', '网吧', '台球厅', '健身房', '瑜伽馆', '美容院', '美发店', '按摩店', '足浴店', '洗浴中心', '游泳馆', '羽毛球馆', '篮球馆'],
    '服务': ['快递站', '洗衣店', '修鞋店', '配钥匙', '手机维修', '电脑维修', '汽车美容', '洗车店', '停车场', '加油站', '药店', '诊所', '宠物店', '摄影店', '打印店'],
    '教育': ['培训机构', '早教中心', '舞蹈班', '音乐教室', '美术班', '英语培训', '数学辅导', '跆拳道馆', '游泳培训', '钢琴教室']
}

CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州', '重庆', '西安', '苏州', '武汉', '南京', '天津', '郑州', '长沙', '东莞', '沈阳', '青岛', '合肥', '佛山', '济南']

# ==================== 辅助函数 ====================

_id_counter = 0

def random_id(prefix=''):
    """生成随机ID（保证唯一性）"""
    global _id_counter
    _id_counter += 1
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.digits + string.ascii_lowercase, k=4))
    return f"{prefix}{timestamp}{_id_counter:06d}{random_str}"

def random_openid():
    """生成微信openid"""
    return 'o' + ''.join(random.choices(string.ascii_letters + string.digits, k=27))

def random_phone():
    """生成手机号"""
    prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                '150', '151', '152', '153', '155', '156', '157', '158', '159',
                '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
    return random.choice(prefixes) + ''.join(random.choices(string.digits, k=8))

def random_name():
    """生成中文姓名"""
    surname = random.choice(SURNAMES)
    given_name = random.choice(GIVEN_NAMES)
    return surname + given_name

def random_avatar():
    """生成头像URL"""
    avatar_id = random.randint(1, 100)
    return f"https://api.multiavatar.com/{avatar_id}.png"

def random_datetime(days_ago=90):
    """生成随机日期时间"""
    now = datetime.now()
    random_days = random.randint(0, days_ago)
    random_hours = random.randint(0, 23)
    random_minutes = random.randint(0, 59)
    random_seconds = random.randint(0, 59)
    
    dt = now - timedelta(days=random_days, hours=random_hours, minutes=random_minutes, seconds=random_seconds)
    return dt.strftime('%Y-%m-%d %H:%M:%S')

def random_merchant_no():
    """生成商户编号"""
    return 'MCH' + ''.join(random.choices(string.digits, k=12))

def random_business_license():
    """生成营业执照号"""
    return ''.join(random.choices(string.digits + string.ascii_uppercase, k=18))

def random_amount():
    """生成随机支付金额（分）"""
    amounts = [
        random.randint(500, 2000),      # 小额消费 5-20元
        random.randint(2000, 5000),     # 中额消费 20-50元
        random.randint(5000, 10000),    # 大额消费 50-100元
        random.randint(10000, 50000),   # 特大消费 100-500元
    ]
    weights = [0.5, 0.3, 0.15, 0.05]
    return random.choices(amounts, weights=weights)[0]

def calculate_points(amount):
    """计算积分：1元=1分，小数舍去"""
    # amount是以分为单位，除以100得到元，向下取整得到积分
    return int(amount / 100)

def sql_escape(text):
    """SQL字符串转义"""
    if text is None:
        return 'NULL'
    return f"'{str(text).replace(chr(39), chr(39)+chr(39))}'"

# ==================== 生成数据 ====================

def generate_users():
    """生成用户数据"""
    users = []
    print(f"📊 生成 {NUM_USERS} 个用户...")
    
    for i in range(NUM_USERS):
        user_id = f"user_{i+1:05d}"
        wechat_id = random_openid()
        nickname = random_name()
        avatar = random_avatar()
        phone = random_phone() if random.random() > 0.3 else None  # 70%有手机号
        created_at = random_datetime(180)  # 过去6个月注册
        
        users.append({
            'id': user_id,
            'wechat_id': wechat_id,
            'nickname': nickname,
            'avatar': avatar,
            'phone': phone,
            'created_at': created_at
        })
    
    print(f"✅ 生成 {len(users)} 个用户")
    return users

def generate_merchants():
    """生成商户数据"""
    merchants = []
    print(f"📊 生成 {NUM_MERCHANTS} 个商户...")
    
    merchant_list = []
    for category, names in MERCHANT_TYPES.items():
        for name in names:
            merchant_list.append((category, name))
    
    selected_merchants = random.sample(merchant_list, NUM_MERCHANTS)
    
    for i, (category, name) in enumerate(selected_merchants):
        merchant_id = f"mch_{i+1:05d}"
        city = random.choice(CITIES)
        merchant_name = f"{city}{name}"
        merchant_no = random_merchant_no()
        contact_person = random_name()
        contact_phone = random_phone()
        business_license = random_business_license()
        status = random.choice(['active', 'active', 'active', 'inactive'])  # 75%活跃
        created_at = random_datetime(365)  # 过去1年
        
        merchants.append({
            'id': merchant_id,
            'merchant_name': merchant_name,
            'merchant_no': merchant_no,
            'contact_person': contact_person,
            'contact_phone': contact_phone,
            'business_license': business_license,
            'status': status,
            'merchant_category': category,
            'created_at': created_at
        })
    
    print(f"✅ 生成 {len(merchants)} 个商户")
    return merchants

def generate_orders_and_points(users, merchants):
    """生成订单和积分数据"""
    orders = []
    points_records = []
    user_points_dict = {}
    
    total_orders = NUM_USERS * NUM_ORDERS_PER_USER
    print(f"📊 生成约 {total_orders} 笔订单...")
    
    # 只选择活跃商户
    active_merchants = [m for m in merchants if m['status'] == 'active']
    if not active_merchants:
        active_merchants = merchants[:10]  # 至少10个商户
    
    for user in users:
        user_id = user['id']
        
        # 初始化用户积分
        user_points_dict[user_id] = {
            'available_points': 0,
            'total_earned': 0,
            'total_spent': 0
        }
        
        # 每个用户生成1-4笔订单
        num_orders = random.randint(1, 4)
        
        for _ in range(num_orders):
            order_id = random_id('ord_')
            merchant = random.choice(active_merchants)
            merchant_id = merchant['id']
            merchant_name = merchant['merchant_name']
            merchant_category = merchant['merchant_category']
            amount = random_amount()
            points_awarded = calculate_points(amount)
            status = random.choice(['paid', 'paid', 'paid', 'cancelled'])  # 75%已支付
            wechat_order_id = '4200' + ''.join(random.choices(string.digits, k=24))
            
            order_time = random_datetime(60)  # 过去2个月
            paid_at = order_time if status == 'paid' else None
            
            orders.append({
                'id': order_id,
                'user_id': user_id,
                'merchant_id': merchant_id,
                'merchant_name': merchant_name,
                'merchant_category': merchant_category,
                'amount': amount,
                'points_awarded': points_awarded if status == 'paid' else 0,
                'payment_method': 'wechat_pay',
                'status': status,
                'wechat_order_id': wechat_order_id if status == 'paid' else None,
                'paid_at': paid_at,
                'created_at': order_time
            })
            
            # 如果订单已支付，生成积分记录
            if status == 'paid':
                points_records.append({
                    'id': random_id('pts_'),
                    'user_id': user_id,
                    'points_change': points_awarded,
                    'record_type': 'payment_reward',
                    'related_order_id': order_id,
                    'merchant_id': merchant_id,
                    'merchant_name': merchant_name,
                    'description': f"支付¥{amount/100:.2f}获得{points_awarded}积分",
                    'created_at': paid_at
                })
                
                # 更新用户积分
                user_points_dict[user_id]['available_points'] += points_awarded
                user_points_dict[user_id]['total_earned'] += points_awarded
    
    print(f"✅ 生成 {len(orders)} 笔订单")
    print(f"✅ 生成 {len(points_records)} 条积分记录")
    
    # 转换user_points_dict为列表
    user_points = []
    for user_id, points in user_points_dict.items():
        user_points.append({
            'user_id': user_id,
            'available_points': points['available_points'],
            'total_earned': points['total_earned'],
            'total_spent': points['total_spent']
        })
    
    print(f"✅ 生成 {len(user_points)} 个用户积分记录")
    
    return orders, points_records, user_points

# ==================== 生成SQL ====================

def generate_sql():
    """生成SQL文件"""
    print("\n" + "="*60)
    print("🚀 开始生成测试数据")
    print("="*60 + "\n")
    
    # 生成数据
    users = generate_users()
    merchants = generate_merchants()
    orders, points_records, user_points = generate_orders_and_points(users, merchants)
    
    # 生成SQL
    print(f"\n📝 生成SQL文件...")
    
    sql_parts = []
    
    # SQL头部
    sql_parts.append("-- ==========================================")
    sql_parts.append("-- 真实模拟数据 - 完全适配服务器表结构")
    sql_parts.append(f"-- 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sql_parts.append("-- 数据库: points_app_dev")
    sql_parts.append("-- ==========================================\n")
    
    sql_parts.append("USE points_app_dev;\n")
    
    sql_parts.append("-- 清空现有测试数据")
    sql_parts.append("SET FOREIGN_KEY_CHECKS = 0;")
    sql_parts.append("TRUNCATE TABLE points_records;")
    sql_parts.append("TRUNCATE TABLE user_points;")
    sql_parts.append("TRUNCATE TABLE payment_orders;")
    sql_parts.append("TRUNCATE TABLE merchants;")
    sql_parts.append("TRUNCATE TABLE users;")
    sql_parts.append("SET FOREIGN_KEY_CHECKS = 1;\n")
    
    # 插入用户
    sql_parts.append(f"-- 插入 {len(users)} 个用户")
    sql_parts.append("INSERT INTO users (id, wechat_id, nickname, avatar, phone, created_at) VALUES")
    
    user_values = []
    for user in users:
        values = f"({sql_escape(user['id'])}, {sql_escape(user['wechat_id'])}, {sql_escape(user['nickname'])}, {sql_escape(user['avatar'])}, {sql_escape(user['phone'])}, {sql_escape(user['created_at'])})"
        user_values.append(values)
    
    sql_parts.append(',\n'.join(user_values) + ';\n')
    
    # 插入商户
    sql_parts.append(f"-- 插入 {len(merchants)} 个商户")
    sql_parts.append("INSERT INTO merchants (id, merchant_name, merchant_no, contact_person, contact_phone, business_license, status, business_category, created_at) VALUES")
    
    merchant_values = []
    for m in merchants:
        values = f"({sql_escape(m['id'])}, {sql_escape(m['merchant_name'])}, {sql_escape(m['merchant_no'])}, {sql_escape(m['contact_person'])}, {sql_escape(m['contact_phone'])}, {sql_escape(m['business_license'])}, {sql_escape(m['status'])}, {sql_escape(m['merchant_category'])}, {sql_escape(m['created_at'])})"
        merchant_values.append(values)
    
    sql_parts.append(',\n'.join(merchant_values) + ';\n')
    
    # 插入订单
    sql_parts.append(f"-- 插入 {len(orders)} 笔订单")
    sql_parts.append("INSERT INTO payment_orders (id, user_id, merchant_id, merchant_name, merchant_category, amount, points_awarded, payment_method, status, wechat_order_id, paid_at, created_at) VALUES")
    
    order_values = []
    for o in orders:
        values = f"({sql_escape(o['id'])}, {sql_escape(o['user_id'])}, {sql_escape(o['merchant_id'])}, {sql_escape(o['merchant_name'])}, {sql_escape(o['merchant_category'])}, {o['amount']}, {o['points_awarded']}, {sql_escape(o['payment_method'])}, {sql_escape(o['status'])}, {sql_escape(o['wechat_order_id'])}, {sql_escape(o['paid_at'])}, {sql_escape(o['created_at'])})"
        order_values.append(values)
    
    sql_parts.append(',\n'.join(order_values) + ';\n')
    
    # 插入积分记录
    sql_parts.append(f"-- 插入 {len(points_records)} 条积分记录")
    sql_parts.append("INSERT INTO points_records (id, user_id, points_change, record_type, related_order_id, merchant_id, merchant_name, description, created_at) VALUES")
    
    points_values = []
    for p in points_records:
        values = f"({sql_escape(p['id'])}, {sql_escape(p['user_id'])}, {p['points_change']}, {sql_escape(p['record_type'])}, {sql_escape(p['related_order_id'])}, {sql_escape(p['merchant_id'])}, {sql_escape(p['merchant_name'])}, {sql_escape(p['description'])}, {sql_escape(p['created_at'])})"
        points_values.append(values)
    
    sql_parts.append(',\n'.join(points_values) + ';\n')
    
    # 插入用户积分
    sql_parts.append(f"-- 插入 {len(user_points)} 个用户积分")
    sql_parts.append("INSERT INTO user_points (user_id, available_points, total_earned, total_spent) VALUES")
    
    user_points_values = []
    for up in user_points:
        values = f"({sql_escape(up['user_id'])}, {up['available_points']}, {up['total_earned']}, {up['total_spent']})"
        user_points_values.append(values)
    
    sql_parts.append(',\n'.join(user_points_values) + ';\n')
    
    # SQL尾部
    sql_parts.append("\n-- ==========================================")
    sql_parts.append("-- 数据导入完成")
    sql_parts.append("-- ==========================================")
    
    sql_content = '\n'.join(sql_parts)
    
    # 写入文件
    filename = 'insert_realistic_data.sql'
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✅ SQL文件已生成: {filename}")
    
    # 统计信息
    print("\n" + "="*60)
    print("📊 数据统计")
    print("="*60)
    print(f"用户数量: {len(users)}")
    print(f"商户数量: {len(merchants)}")
    print(f"  - 活跃商户: {len([m for m in merchants if m['status'] == 'active'])}")
    print(f"  - 禁用商户: {len([m for m in merchants if m['status'] == 'inactive'])}")
    print(f"订单数量: {len(orders)}")
    print(f"  - 已支付: {len([o for o in orders if o['status'] == 'paid'])}")
    print(f"  - 已取消: {len([o for o in orders if o['status'] == 'cancelled'])}")
    print(f"积分记录: {len(points_records)}")
    print(f"用户积分: {len(user_points)}")
    
    # 金额统计
    total_amount = sum(o['amount'] for o in orders if o['status'] == 'paid')
    total_points = sum(p['points_change'] for p in points_records)
    
    print(f"\n总交易额: ¥{total_amount/100:.2f}")
    print(f"总积分: {total_points}分")
    print(f"平均每单: ¥{total_amount/len([o for o in orders if o['status'] == 'paid'])/100:.2f}")
    
    print("\n" + "="*60)
    print("✅ 完成！")
    print("="*60)

if __name__ == '__main__':
    generate_sql()
