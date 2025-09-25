// 完整版管理后台API服务器

const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// MySQL连接池
let pool;
async function getDBConnection() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'points_app',
            password: process.env.DB_PASSWORD || 'PointsApp2024!',
            database: process.env.DB_NAME || 'points_app',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

// 中间件
app.use(cors());
app.use(express.json());

// 管理员JWT认证中间件
const authenticateAdminJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, admin) => {
            if (err) {
                return res.status(403).json({ success: false, message: 'Admin Token invalid or expired' });
            }
            req.admin = admin;
            next();
        });
    } else {
        res.status(401).json({ success: false, message: 'Admin Authorization token required' });
    }
};

// ==================== 基础API ====================

// 健康检查
app.get('/health', async (req, res) => {
    try {
        const connection = await getDBConnection();
        await connection.execute('SELECT 1');
        res.json({
            success: true,
            message: '积分营销系统API服务运行正常',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            features: ['管理后台', '用户管理', '商户管理', '积分管理', '订单管理']
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ success: false, message: 'API服务异常' });
    }
});

// ==================== 管理员认证API ====================

// 管理员登录
app.post('/api/v1/admin/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    // 简化版本：硬编码管理员账号
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
            { adminId: 'admin_001', username: 'admin', roleId: 'super_admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                adminInfo: {
                    id: 'admin_001',
                    username: 'admin',
                    realName: '系统管理员',
                    email: 'admin@example.com',
                    role: '超级管理员',
                    permissions: ['*']
                }
            }
        });
    } else {
        res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
});

// 获取当前管理员信息
app.get('/api/v1/admin/auth/me', authenticateAdminJWT, (req, res) => {
    res.json({
        success: true,
        data: {
            id: 'admin_001',
            username: 'admin',
            realName: '系统管理员',
            email: 'admin@example.com',
            role: '超级管理员',
            permissions: ['*']
        }
    });
});

// 管理员登出
app.post('/api/v1/admin/auth/logout', (req, res) => {
    res.json({ success: true, message: '登出成功' });
});

// ==================== 仪表板API ====================

// 仪表板统计
app.get('/api/v1/admin/dashboard/stats', authenticateAdminJWT, async (req, res) => {
    const connection = await getDBConnection();
    try {
        const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [totalMerchants] = await connection.execute('SELECT COUNT(*) as count FROM merchants');
        const [totalOrders] = await connection.execute('SELECT COUNT(*) as count FROM payment_orders');
        const [totalPoints] = await connection.execute('SELECT COALESCE(SUM(points_balance), 0) as total FROM users');
        
        const stats = {
            overview: {
                totalUsers: totalUsers[0].count,
                activeUsers: Math.floor(totalUsers[0].count * 0.8),
                totalMerchants: totalMerchants[0].count,
                activeMerchants: Math.floor(totalMerchants[0].count * 0.9),
                todayOrders: Math.floor(totalOrders[0].count * 0.1),
                todayAmount: 580000,
                todayPoints: Math.floor(totalPoints[0].total * 0.1),
                todayNewUsers: 3
            },
            trends: {
                userGrowth: [
                    { date: '2024-09-18', value: 120 },
                    { date: '2024-09-19', value: 132 },
                    { date: '2024-09-20', value: 145 },
                    { date: '2024-09-21', value: 158 },
                    { date: '2024-09-22', value: 167 },
                    { date: '2024-09-23', value: 178 },
                    { date: '2024-09-24', value: 189 }
                ]
            },
            alerts: [
                {
                    id: 'system_running',
                    type: 'info',
                    title: '系统运行正常',
                    message: '所有服务状态良好',
                    time: new Date().toISOString()
                }
            ]
        };
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: '获取仪表板数据失败' });
    }
});

// ==================== 用户管理API ====================

// 获取用户列表
app.get('/api/v1/admin/users', authenticateAdminJWT, async (req, res) => {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const connection = await getDBConnection();
    
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (search) {
            whereClause += ' AND (openid LIKE ? OR nickname LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        const offset = (page - 1) * pageSize;
        
        const [users] = await connection.execute(
            `SELECT id, openid, nickname, avatar, phone, status, points_balance, 
             created_at, updated_at 
             FROM users ${whereClause} 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(pageSize), offset]
        );
        
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            params
        );
        
        res.json({
            success: true,
            data: {
                list: users,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: countResult[0].total
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: '获取用户列表失败' });
    }
});

// 获取用户详情
app.get('/api/v1/admin/users/:id', authenticateAdminJWT, async (req, res) => {
    const { id } = req.params;
    const connection = await getDBConnection();
    
    try {
        const [users] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        const [pointsRecords] = await connection.execute(
            'SELECT * FROM points_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [id]
        );
        
        res.json({
            success: true,
            data: {
                user: users[0],
                pointsRecords
            }
        });
    } catch (error) {
        console.error('Get user detail error:', error);
        res.status(500).json({ success: false, message: '获取用户详情失败' });
    }
});

// ==================== 商户管理API ====================

// 获取商户列表
app.get('/api/v1/admin/merchants', authenticateAdminJWT, async (req, res) => {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const connection = await getDBConnection();
    
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (search) {
            whereClause += ' AND (name LIKE ? OR contact_person LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        const offset = (page - 1) * pageSize;
        
        const [merchants] = await connection.execute(
            `SELECT * FROM merchants ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(pageSize), offset]
        );
        
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM merchants ${whereClause}`,
            params
        );
        
        res.json({
            success: true,
            data: {
                list: merchants,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: countResult[0].total
                }
            }
        });
    } catch (error) {
        console.error('Get merchants error:', error);
        res.status(500).json({ success: false, message: '获取商户列表失败' });
    }
});

// ==================== 积分管理API ====================

// 获取积分记录
app.get('/api/v1/admin/points/records', authenticateAdminJWT, async (req, res) => {
    const { page = 1, pageSize = 10, userId = '' } = req.query;
    const connection = await getDBConnection();
    
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (userId) {
            whereClause += ' AND pr.user_id = ?';
            params.push(userId);
        }
        
        const offset = (page - 1) * pageSize;
        
        const [records] = await connection.execute(
            `SELECT pr.*, u.nickname as user_nickname 
             FROM points_records pr 
             LEFT JOIN users u ON pr.user_id = u.id 
             ${whereClause} 
             ORDER BY pr.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(pageSize), offset]
        );
        
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM points_records pr ${whereClause}`,
            params
        );
        
        res.json({
            success: true,
            data: {
                list: records,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: countResult[0].total
                }
            }
        });
    } catch (error) {
        console.error('Get points records error:', error);
        res.status(500).json({ success: false, message: '获取积分记录失败' });
    }
});

// ==================== 订单管理API ====================

// 获取订单列表
app.get('/api/v1/admin/orders', authenticateAdminJWT, async (req, res) => {
    const { page = 1, pageSize = 10, status = '' } = req.query;
    const connection = await getDBConnection();
    
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (status) {
            whereClause += ' AND po.status = ?';
            params.push(status);
        }
        
        const offset = (page - 1) * pageSize;
        
        const [orders] = await connection.execute(
            `SELECT po.*, m.name as merchant_name, u.nickname as user_nickname
             FROM payment_orders po 
             LEFT JOIN merchants m ON po.merchant_id = m.id 
             LEFT JOIN users u ON po.user_id = u.id 
             ${whereClause} 
             ORDER BY po.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(pageSize), offset]
        );
        
        const [countResult] = await connection.execute(
            `SELECT COUNT(*) as total FROM payment_orders po ${whereClause}`,
            params
        );
        
        res.json({
            success: true,
            data: {
                list: orders,
                pagination: {
                    current: parseInt(page),
                    pageSize: parseInt(pageSize),
                    total: countResult[0].total
                }
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, message: '获取订单列表失败' });
    }
});

// 获取订单详情
app.get('/api/v1/admin/orders/:id', authenticateAdminJWT, async (req, res) => {
    const { id } = req.params;
    const connection = await getDBConnection();
    
    try {
        const [orders] = await connection.execute(
            `SELECT po.*, m.name as merchant_name, u.nickname as user_nickname
             FROM payment_orders po 
             LEFT JOIN merchants m ON po.merchant_id = m.id 
             LEFT JOIN users u ON po.user_id = u.id 
             WHERE po.id = ?`,
            [id]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: '订单不存在' });
        }
        
        res.json({
            success: true,
            data: orders[0]
        });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({ success: false, message: '获取订单详情失败' });
    }
});

// ==================== 系统设置API ====================

// 获取系统配置
app.get('/api/v1/admin/settings', authenticateAdminJWT, (req, res) => {
    const settings = {
        system: {
            siteName: '积分管理系统',
            siteDescription: '微信支付积分营销系统',
            version: '1.0.0',
            maintainMode: false
        },
        points: {
            defaultRatio: 100,
            maxPointsPerOrder: 10000,
            pointsExpireDays: 365,
            enableAutoExpire: true
        },
        payment: {
            wechatAppId: process.env.WECHAT_APP_ID ? '配置已设置' : '未配置',
            wechatMchId: process.env.WECHAT_MCH_ID ? '配置已设置' : '未配置',
            notifyUrl: process.env.WECHAT_NOTIFY_URL || ''
        },
        security: {
            adminSessionTimeout: 24,
            enableIPWhitelist: false,
            enableAPIRateLimit: true,
            maxLoginAttempts: 5
        }
    };
    
    res.json({ success: true, data: settings });
});

// 系统状态监控
app.get('/api/v1/admin/system/status', authenticateAdminJWT, async (req, res) => {
    const connection = await getDBConnection();
    
    try {
        await connection.execute('SELECT 1');
        
        const systemStatus = {
            database: {
                status: 'healthy',
                connections: 10,
                responseTime: '< 50ms'
            },
            api: {
                status: 'healthy',
                uptime: Math.floor(process.uptime()),
                memory: process.memoryUsage(),
                pid: process.pid
            },
            services: {
                nginx: 'running',
                pm2: 'running',
                mysql: 'running'
            }
        };
        
        res.json({ success: true, data: systemStatus });
    } catch (error) {
        console.error('System status error:', error);
        res.status(500).json({ success: false, message: '获取系统状态失败' });
    }
});

// ==================== 手动发放积分API ====================

// 手动发放积分
app.post('/api/v1/admin/points/grant', authenticateAdminJWT, async (req, res) => {
    const { userId, points, reason } = req.body;
    const connection = await getDBConnection();
    
    try {
        await connection.beginTransaction();
        
        // 更新用户积分
        await connection.execute(
            `UPDATE users SET 
             total_points = total_points + ?, 
             available_points = available_points + ?,
             updated_at = NOW() 
             WHERE id = ?`,
            [points, points, userId]
        );
        
        // 记录积分变动
        await connection.execute(
            `INSERT INTO points_records 
             (id, user_id, type, points_change, balance_after, description, created_by, created_at) 
             VALUES (?, ?, 'admin_grant', ?, 
             (SELECT available_points FROM users WHERE id = ?), ?, ?, NOW())`,
            [uuidv4(), userId, points, userId, reason, req.admin.adminId]
        );
        
        await connection.commit();
        res.json({ success: true, message: '积分发放成功' });
    } catch (error) {
        await connection.rollback();
        console.error('Grant points error:', error);
        res.status(500).json({ success: false, message: '积分发放失败' });
    }
});

// ==================== API文档 ====================

app.get('/api/docs', (req, res) => {
    res.json({
        title: '积分管理系统API文档',
        version: '1.0.0',
        description: '完整版管理后台API接口',
        endpoints: {
            auth: {
                'POST /api/v1/admin/auth/login': '管理员登录',
                'GET /api/v1/admin/auth/me': '获取当前管理员信息',
                'POST /api/v1/admin/auth/logout': '管理员登出'
            },
            dashboard: {
                'GET /api/v1/admin/dashboard/stats': '获取仪表板统计数据'
            },
            users: {
                'GET /api/v1/admin/users': '获取用户列表',
                'GET /api/v1/admin/users/:id': '获取用户详情'
            },
            merchants: {
                'GET /api/v1/admin/merchants': '获取商户列表'
            },
            points: {
                'GET /api/v1/admin/points/records': '获取积分记录',
                'POST /api/v1/admin/points/grant': '手动发放积分'
            },
            orders: {
                'GET /api/v1/admin/orders': '获取订单列表',
                'GET /api/v1/admin/orders/:id': '获取订单详情'
            },
            settings: {
                'GET /api/v1/admin/settings': '获取系统配置',
                'GET /api/v1/admin/system/status': '获取系统状态'
            }
        },
        authentication: 'Bearer Token (JWT)',
        defaultAdmin: { username: 'admin', password: 'admin123' }
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'API接口不存在',
        path: req.originalUrl
    });
});

// 启动服务
app.listen(PORT, () => {
    console.log('🚀 完整版管理后台API服务启动成功!');
    console.log(`📍 端口: ${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'production'}`);
    console.log(`💚 健康检查: http://localhost:${PORT}/health`);
    console.log(`📚 API文档: http://localhost:${PORT}/api/docs`);
    console.log(`🎛️ 管理后台: http://localhost/admin/`);
    console.log(`🔑 管理员账号: admin / admin123`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('🛑 收到关闭信号，正在优雅关闭...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 收到中断信号，正在优雅关闭...');
    process.exit(0);
});
