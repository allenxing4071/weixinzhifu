# 📊 测试数据生成脚本

> 为微信支付积分系统生成100组真实关联的测试数据

---

## 🎯 数据概览

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| **用户** | 100个 | 分布在北京、上海、广州、深圳、杭州5个城市 |
| **商户** | 20个 | 涵盖餐饮、超市、服装、娱乐、美容、数码6大类 |
| **支付订单** | 200个 | 平均每个用户2单，95%已完成 |
| **积分记录** | ~186条 | 对应已完成的订单 |
| **用户积分** | ~89个 | 有过交易的用户积分汇总 |

---

## 📁 文件说明

### 1. `insert_test_data.sql`
**内容**：100个用户数据  
**大小**：~21KB  
**用途**：插入用户基础信息

**包含字段**：
- 用户ID、微信openid、unionid
- 昵称、头像、手机号
- 性别、城市、省份、国家
- 创建时间、更新时间、状态

### 2. `insert_merchants_orders_points.sql`
**内容**：商户、订单、积分数据  
**大小**：~54KB  
**用途**：插入商户、订单和积分记录

**包含数据**：
- 20个商户（餐饮、超市、服装、娱乐、美容、数码）
- 200个支付订单（金额5-500元）
- ~186条积分记录（1元=1积分）
- ~89个用户积分汇总

### 3. `generate_test_data.py`
**内容**：Python数据生成脚本  
**用途**：自动生成SQL脚本

---

## 🚀 使用方法

### 方法一：直接导入SQL（推荐）

```bash
# 1. 连接到数据库
mysql -u root -p weixin_payment

# 2. 导入用户数据
source insert_test_data.sql;

# 3. 导入商户、订单、积分数据
source insert_merchants_orders_points.sql;

# 4. 查看统计信息
SELECT 
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM merchants) AS merchants,
    (SELECT COUNT(*) FROM payment_orders) AS orders,
    (SELECT COUNT(*) FROM point_records) AS points,
    (SELECT COUNT(*) FROM user_points) AS user_points;
```

### 方法二：重新生成数据

```bash
# 运行Python脚本重新生成
python3 generate_test_data.py

# 生成的文件会覆盖旧文件
# - insert_merchants_orders_points.sql
```

---

## 📊 数据特点

### 真实性
- ✅ 真实的中文姓名（100个常见姓氏组合）
- ✅ 真实的手机号格式（138001380XX）
- ✅ 真实的商户名称（星巴克、肯德基、沃尔玛等）
- ✅ 真实的城市分布（一线城市）
- ✅ 真实的金额分布（符合实际消费习惯）

### 关联性
- ✅ 用户 → 订单（一对多）
- ✅ 商户 → 订单（一对多）
- ✅ 订单 → 积分记录（一对一）
- ✅ 用户 → 积分汇总（一对一）

### 合理性
- ✅ 金额分布：5-20元（50%）、20-50元（30%）、50-100元（15%）、100-500元（5%）
- ✅ 订单状态：95%已完成、5%待支付
- ✅ 时间分布：2025年9月1日-30日
- ✅ 积分规则：1元 = 1积分

---

## 🏙️ 城市分布

| 城市 | 用户数量 | 省份 |
|------|---------|------|
| 北京 | 20人 | 北京市 |
| 上海 | 20人 | 上海市 |
| 广州 | 20人 | 广东省 |
| 深圳 | 20人 | 广东省 |
| 杭州 | 20人 | 浙江省 |

---

## 🏪 商户分类

| 类别 | 商户示例 | 数量 |
|------|---------|------|
| 餐饮 | 星巴克、肯德基、海底捞 | 8家 |
| 超市 | 沃尔玛、家乐福、永辉 | 5家 |
| 服装 | 优衣库、ZARA、H&M | 5家 |
| 娱乐 | 万达影城、KTV | 4家 |
| 美容 | 屈臣氏、丝芙兰 | 3家 |
| 数码 | 苹果、小米、华为 | 3家 |

---

## 💰 金额分布

| 金额范围 | 概率 | 典型场景 |
|---------|------|----------|
| 5-20元 | 50% | 快餐、咖啡、超市 |
| 20-50元 | 30% | 正餐、服装、娱乐 |
| 50-100元 | 15% | 火锅、美容、数码配件 |
| 100-500元 | 5% | 高档餐饮、服装、数码产品 |

---

## 📈 数据示例

### 用户示例
```sql
('user_001', 'wx_openid_001', 'wx_unionid_001', '张伟', 
 'https://thirdwx.qlogo.cn/mmopen/001.jpg', '13800138001', 
 1, '北京', '北京市', '中国', '2025-09-01 08:30:00', 
 '2025-09-30 10:00:00', 'active')
```

### 商户示例
```sql
('mch_001', '星巴克咖啡', '156123456', '餐饮', 
 '北京万达店', '北京', '北京市', '中国', '20%', 
 'active', '2025-09-10 10:00:00', '2025-09-30 12:00:00')
```

### 订单示例
```sql
('order_000001', 'user_001', 'mch_001', 3500, 35, 
 'completed', 'wxpay', NULL, '2025-09-15 12:30:00', 
 '2025-09-15 12:30:00')
```

### 积分记录示例
```sql
('point_000001', 'user_001', 'earn', 35, 'order_000001', 
 '支付订单获得积分', '2025-09-15 12:30:00')
```

---

## ⚠️ 注意事项

### 1. 数据清空警告
执行SQL前会清空以下表的数据（保留结构）：
- `point_records`
- `user_points`
- `payment_orders`
- `merchants`
- `users`

**⚠️ 生产环境请勿执行此脚本！**

### 2. 外键约束
脚本会暂时禁用外键检查：
```sql
SET FOREIGN_KEY_CHECKS = 0;
-- 插入数据
SET FOREIGN_KEY_CHECKS = 1;
```

### 3. 管理员数据
**不会清空** `admin_users` 表，管理员账户保持不变

### 4. 数据量建议
- 开发环境：使用全部数据（100用户）
- 测试环境：可调整数量
- 生产环境：**禁止使用测试数据**

---

## 🔧 自定义数据

### 修改用户数量
编辑 `generate_test_data.py`：
```python
NUM_USERS = 100  # 改为你需要的数量
NUM_ORDERS = 200  # 平均每个用户2单
```

### 修改商户类型
编辑 `MERCHANT_TYPES` 字典：
```python
MERCHANT_TYPES = {
    '餐饮': ['新增商户名称'],
    # 添加新类别
}
```

### 修改金额分布
编辑 `amounts` 列表：
```python
amounts = [
    (500, 2000, 0.5),    # (最小值, 最大值, 概率)
    (2000, 5000, 0.3),
    # 添加新的金额范围
]
```

---

## 📊 验证数据

### 查看数据统计
```sql
-- 用户统计
SELECT city, COUNT(*) as count 
FROM users 
GROUP BY city;

-- 商户统计
SELECT category, COUNT(*) as count 
FROM merchants 
GROUP BY category;

-- 订单统计
SELECT 
    status, 
    COUNT(*) as count,
    SUM(amount)/100 as total_yuan,
    SUM(points_earned) as total_points
FROM payment_orders 
GROUP BY status;

-- 积分统计
SELECT 
    COUNT(*) as user_count,
    SUM(available_points) as total_points,
    AVG(available_points) as avg_points,
    MAX(available_points) as max_points
FROM user_points;
```

---

## 🎯 使用场景

### 1. 功能测试
- 用户管理功能测试
- 商户管理功能测试
- 订单查询功能测试
- 积分系统功能测试

### 2. 性能测试
- 大数据量查询性能
- 分页功能测试
- 统计功能测试

### 3. 界面展示
- 管理后台数据展示
- 小程序界面测试
- 报表图表展示

### 4. 接口测试
- API接口返回数据
- 数据关联查询
- 统计接口测试

---

## 📞 技术支持

如需调整数据生成逻辑，请：
1. 修改 `generate_test_data.py` 脚本
2. 运行脚本重新生成SQL
3. 导入新生成的SQL文件

---

**生成时间**：2025-09-30  
**适用版本**：v1.0.0  
**维护状态**：✅ 活跃维护
