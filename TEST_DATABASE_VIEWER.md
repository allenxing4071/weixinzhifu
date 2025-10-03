# 🧪 数据库管理系统测试指南

## 快速测试步骤

### 1️⃣ 启动本地Dashboard服务

```bash
cd /Users/xinghailong/Documents/soft/weixinzhifu
./start-dashboard.sh
```

等待看到: `✅ 已启动,访问: http://localhost:8080/dashboard.html`

---

### 2️⃣ 登录管理后台获取Token

在浏览器中访问: https://www.guandongfang.cn/admin/

**登录信息**:
- 用户名: `admin`
- 密码: `admin123`

登录成功后,浏览器会在localStorage中保存`admin_token`。

---

### 3️⃣ 打开数据库管理界面

**方法一 (推荐)**: 通过Dashboard
1. 访问: http://localhost:8080/dashboard.html
2. 找到"数据库管理"模块卡片(🗄️图标)
3. 点击卡片,自动打开数据库查看器

**方法二**: 直接访问
- 访问: http://localhost:8080/database-viewer.html

---

### 4️⃣ 功能测试清单

#### 基础功能
- [ ] 页面正常加载,无JavaScript错误
- [ ] 数据库统计卡片显示正常(表数量、总记录数、大小)
- [ ] 左侧表列表加载完整
- [ ] 点击表名能够切换当前表

#### 表结构查看
- [ ] "表结构"Tab显示字段列表
- [ ] 字段类型、可空性、键信息正确
- [ ] 索引信息显示正确

#### 表数据查看
- [ ] "表数据"Tab显示数据行
- [ ] 分页控件正常工作
- [ ] 排序功能正常(选择字段+排序方向)
- [ ] 每页条数切换正常

#### 表信息查看
- [ ] "表信息"Tab显示元数据
- [ ] 创建时间、更新时间显示正确
- [ ] 记录数、大小信息准确

#### SQL查询控制台
- [ ] 输入SELECT查询能正常执行
- [ ] 查询结果正常显示
- [ ] 非SELECT查询被拒绝(测试安全性)
- [ ] 执行时间显示正确

#### 自动刷新
- [ ] 30秒后自动刷新统计信息
- [ ] 手动刷新按钮正常工作
- [ ] "上次更新"时间正确更新

---

### 5️⃣ API直接测试

如果界面有问题,可以直接测试API:

#### 获取Token
```bash
# 登录获取Token
curl -X POST https://www.guandongfang.cn/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 输出示例: {"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}}
```

将返回的token保存到环境变量:
```bash
export TOKEN="your_token_here"
```

#### 测试数据库统计API
```bash
curl -H "Authorization: Bearer $TOKEN" \
     https://www.guandongfang.cn/api/v1/admin/database/stats
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "database": "points_app_dev",
    "tableCount": 6,
    "totalRows": 123,
    "size": "2.45 MB"
  }
}
```

#### 测试表列表API
```bash
curl -H "Authorization: Bearer $TOKEN" \
     https://www.guandongfang.cn/api/v1/admin/database/tables
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "name": "users",
        "rowCount": 25,
        "size": "64.00 KB",
        "createdAt": "2024-09-30T...",
        "updatedAt": "2024-10-02T...",
        "comment": ""
      },
      ...
    ]
  }
}
```

#### 测试表结构API
```bash
curl -H "Authorization: Bearer $TOKEN" \
     https://www.guandongfang.cn/api/v1/admin/database/tables/users/schema
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "tableName": "users",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "key": "PRI",
        "default": null,
        "extra": "auto_increment",
        "comment": ""
      },
      ...
    ],
    "indexes": [...]
  }
}
```

#### 测试表数据API
```bash
curl -H "Authorization: Bearer $TOKEN" \
     "https://www.guandongfang.cn/api/v1/admin/database/tables/users/data?page=1&pageSize=5"
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "rows": [...],
    "pagination": {
      "page": 1,
      "pageSize": 5,
      "total": 25,
      "totalPages": 5
    }
  }
}
```

#### 测试SQL查询API
```bash
curl -X POST https://www.guandongfang.cn/api/v1/admin/database/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT * FROM users LIMIT 3"}'
```

**预期输出**:
```json
{
  "success": true,
  "data": {
    "rows": [...],
    "rowCount": 3,
    "executionTime": "12ms"
  }
}
```

#### 测试安全限制(应该失败)
```bash
curl -X POST https://www.guandongfang.cn/api/v1/admin/database/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql":"DELETE FROM users WHERE id=1"}'
```

**预期输出**:
```json
{
  "success": false,
  "message": "仅允许SELECT、SHOW、DESCRIBE查询,不允许修改数据"
}
```

---

### 6️⃣ 常见问题排查

#### 问题: 左侧表列表一直显示"加载中..."

**原因**: API请求失败

**排查步骤**:
1. 打开浏览器开发者工具(F12) -> Network标签
2. 刷新页面,查看API请求
3. 检查`/api/v1/admin/database/tables`请求状态
   - 200: 成功,检查响应数据
   - 401/403: Token无效,重新登录
   - 404: 路由未注册,检查后端代码
   - 500: 服务器错误,查看服务器日志

**解决方法**:
```bash
# 检查服务器日志
ssh -i config/ssh/weixinpay.pem root@8.156.84.226 'pm2 logs payment-api-v2 --lines 30'

# 重启服务
ssh -i config/ssh/weixinpay.pem root@8.156.84.226 'pm2 restart payment-api-v2'
```

#### 问题: 点击表名后没有反应

**原因**: JavaScript错误或CSS选择器问题

**排查步骤**:
1. 打开浏览器开发者工具(F12) -> Console标签
2. 查看是否有JavaScript错误
3. 检查Network标签,看API是否被调用

#### 问题: SQL查询一直返回错误

**可能原因**:
- SQL语法错误
- 使用了非SELECT语句
- 表名或字段名错误

**解决方法**:
1. 检查SQL语法
2. 确保只使用SELECT/SHOW/DESCRIBE
3. 参考"表结构"Tab确认字段名

---

### 7️⃣ 性能测试

#### 测试大表加载
```bash
# 创建测试数据(在服务器上执行)
ssh -i config/ssh/weixinpay.pem root@8.156.84.226
mysql -u root -p points_app_dev

INSERT INTO users (openid, nickname, phone, status, created_at, updated_at)
SELECT 
  CONCAT('wx_test_', LPAD(n, 6, '0')),
  CONCAT('测试用户', n),
  CONCAT('1', LPAD(n, 10, '0')),
  'active',
  NOW(),
  NOW()
FROM (
  SELECT @row := @row + 1 AS n
  FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) t1,
       (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) t2,
       (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) t3,
       (SELECT @row := 0) r
  LIMIT 1000
) nums;
```

然后在界面测试:
- [ ] 表列表能否正常加载
- [ ] 分页是否流畅
- [ ] 排序是否正常工作

---

### 8️⃣ 测试结果记录

#### 环境信息
- 测试时间: ________________
- 浏览器: ________________
- 操作系统: ________________
- Dashboard服务: ________________

#### 测试结果
- API连通性: ☐ 通过 ☐ 失败
- 界面加载: ☐ 通过 ☐ 失败
- 表结构显示: ☐ 通过 ☐ 失败
- 表数据显示: ☐ 通过 ☐ 失败
- 分页功能: ☐ 通过 ☐ 失败
- SQL查询: ☐ 通过 ☐ 失败
- 自动刷新: ☐ 通过 ☐ 失败

#### 发现的问题
1. _____________________________________
2. _____________________________________
3. _____________________________________

---

## 📧 反馈

测试完成后,请将结果反馈给开发团队。

**测试完成时间**: ________________  
**测试人员**: ________________

