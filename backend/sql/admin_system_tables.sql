-- 积分管理后台 - 管理员系统数据库表
-- 按照PRD第1.2节权限管理要求设计

USE points_app_dev;

-- 1. 管理员用户表
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL COMMENT '登录用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    real_name VARCHAR(100) NOT NULL COMMENT '真实姓名',
    email VARCHAR(200) COMMENT '邮箱地址',
    phone VARCHAR(20) COMMENT '手机号码',
    role_id VARCHAR(50) NOT NULL COMMENT '角色ID',
    status ENUM('active','inactive','locked') DEFAULT 'active' COMMENT '账号状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(45) COMMENT '最后登录IP',
    failed_login_count INT DEFAULT 0 COMMENT '登录失败次数',
    locked_until TIMESTAMP NULL COMMENT '锁定到期时间',
    created_by VARCHAR(50) COMMENT '创建人',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role_id (role_id),
    INDEX idx_status (status)
) COMMENT '管理员用户表';

-- 2. 角色定义表
CREATE TABLE IF NOT EXISTS admin_roles (
    id VARCHAR(50) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) UNIQUE NOT NULL COMMENT '角色代码',
    description TEXT COMMENT '角色描述',
    permissions JSON COMMENT '权限列表',
    data_scope ENUM('all','department','self') DEFAULT 'self' COMMENT '数据权限范围',
    status ENUM('active','inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role_code (role_code),
    INDEX idx_status (status)
) COMMENT '管理员角色表';

-- 3. 权限定义表 
CREATE TABLE IF NOT EXISTS admin_permissions (
    id VARCHAR(50) PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    permission_code VARCHAR(100) UNIQUE NOT NULL COMMENT '权限代码',
    permission_type ENUM('menu','button','api') DEFAULT 'menu' COMMENT '权限类型',
    parent_id VARCHAR(50) COMMENT '父权限ID',
    resource_url VARCHAR(200) COMMENT '资源路径',
    method VARCHAR(10) COMMENT 'HTTP方法',
    description TEXT COMMENT '权限描述',
    sort_order INT DEFAULT 0,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_permission_code (permission_code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_type (permission_type)
) COMMENT '权限定义表';

-- 4. 操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id VARCHAR(50) PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL COMMENT '操作人ID',
    admin_name VARCHAR(100) COMMENT '操作人姓名',
    operation_type VARCHAR(100) NOT NULL COMMENT '操作类型',
    operation_desc TEXT COMMENT '操作描述',
    target_type VARCHAR(100) COMMENT '操作对象类型',
    target_id VARCHAR(50) COMMENT '操作对象ID',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url VARCHAR(500) COMMENT '请求URL',
    request_params JSON COMMENT '请求参数',
    response_result JSON COMMENT '响应结果',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    execution_time INT COMMENT '执行时间(ms)',
    status ENUM('success','failure') DEFAULT 'success',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
) COMMENT '管理员操作日志表';

-- 5. 会话管理表
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(50) PRIMARY KEY,
    admin_id VARCHAR(50) NOT NULL COMMENT '管理员ID',
    session_token VARCHAR(255) UNIQUE NOT NULL COMMENT '会话令牌',
    refresh_token VARCHAR(255) COMMENT '刷新令牌',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
    status ENUM('active','expired','revoked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_token (session_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_status (status)
) COMMENT '管理员会话表';

-- 插入默认角色数据
INSERT IGNORE INTO admin_roles (id, role_name, role_code, description, permissions, data_scope) VALUES
('role_super_admin', '超级管理员', 'SUPER_ADMIN', '系统最高权限，全局管理', 
 JSON_ARRAY('*'), 'all'),
('role_operation_admin', '运营管理员', 'OPERATION_ADMIN', '业务运营权限', 
 JSON_ARRAY('dashboard:view', 'users:*', 'merchants:view', 'points:*', 'activities:*'), 'all'),
('role_merchant_admin', '商户管理员', 'MERCHANT_ADMIN', '商户自身数据权限', 
 JSON_ARRAY('dashboard:view', 'merchants:view:self', 'orders:view:self', 'qrcode:*'), 'self'),
('role_finance_admin', '财务管理员', 'FINANCE_ADMIN', '财务数据权限', 
 JSON_ARRAY('dashboard:view', 'finance:*', 'orders:view', 'reports:finance'), 'all');

-- 插入默认权限数据
INSERT IGNORE INTO admin_permissions (id, permission_name, permission_code, permission_type, resource_url, description) VALUES
-- 仪表板权限
('perm_dashboard_view', '仪表板查看', 'dashboard:view', 'menu', '/dashboard', '查看仪表板数据'),

-- 用户管理权限
('perm_users_menu', '用户管理', 'users:menu', 'menu', '/users', '用户管理菜单'),
('perm_users_view', '用户查看', 'users:view', 'button', '/api/v1/admin/users', '查看用户列表'),
('perm_users_create', '用户创建', 'users:create', 'button', '/api/v1/admin/users', '创建用户'),
('perm_users_update', '用户编辑', 'users:update', 'button', '/api/v1/admin/users/*', '编辑用户信息'),
('perm_users_delete', '用户删除', 'users:delete', 'button', '/api/v1/admin/users/*', '删除用户'),
('perm_users_points', '积分调整', 'users:points', 'button', '/api/v1/admin/users/*/points', '调整用户积分'),

-- 商户管理权限
('perm_merchants_menu', '商户管理', 'merchants:menu', 'menu', '/merchants', '商户管理菜单'),
('perm_merchants_view', '商户查看', 'merchants:view', 'button', '/api/v1/admin/merchants', '查看商户列表'),
('perm_merchants_create', '商户创建', 'merchants:create', 'button', '/api/v1/admin/merchants', '创建商户'),
('perm_merchants_update', '商户编辑', 'merchants:update', 'button', '/api/v1/admin/merchants/*', '编辑商户信息'),
('perm_merchants_delete', '商户删除', 'merchants:delete', 'button', '/api/v1/admin/merchants/*', '删除商户'),
('perm_merchants_qrcode', 'QR码管理', 'merchants:qrcode', 'button', '/api/v1/admin/merchants/*/qrcode', '生成商户QR码'),

-- 积分管理权限
('perm_points_menu', '积分管理', 'points:menu', 'menu', '/points', '积分管理菜单'),
('perm_points_view', '积分查看', 'points:view', 'button', '/api/v1/admin/points', '查看积分数据'),
('perm_points_config', '积分配置', 'points:config', 'button', '/api/v1/admin/points/config', '配置积分规则'),
('perm_points_adjust', '积分调整', 'points:adjust', 'button', '/api/v1/admin/points/adjust', '手动调整积分'),

-- 财务管理权限
('perm_finance_menu', '财务管理', 'finance:menu', 'menu', '/finance', '财务管理菜单'),
('perm_finance_view', '财务查看', 'finance:view', 'button', '/api/v1/admin/finance', '查看财务数据'),
('perm_finance_reports', '财务报表', 'finance:reports', 'button', '/api/v1/admin/finance/reports', '生成财务报表'),

-- 系统管理权限
('perm_system_menu', '系统管理', 'system:menu', 'menu', '/system', '系统管理菜单'),
('perm_system_users', '管理员管理', 'system:users', 'button', '/api/v1/admin/system/users', '管理员账号管理'),
('perm_system_roles', '角色管理', 'system:roles', 'button', '/api/v1/admin/system/roles', '角色权限管理'),
('perm_system_logs', '日志查看', 'system:logs', 'button', '/api/v1/admin/system/logs', '查看操作日志'),
('perm_system_config', '系统配置', 'system:config', 'button', '/api/v1/admin/system/config', '系统参数配置');

-- 插入默认超级管理员
INSERT IGNORE INTO admin_users (id, username, password_hash, real_name, email, role_id, status, created_by) VALUES
('admin_super_001', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBw/UoZXFzpSA2', 
 '超级管理员', 'admin@example.com', 'role_super_admin', 'active', 'system'),
('admin_operation_001', 'operation', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBw/UoZXFzpSA2', 
 '运营管理员', 'operation@example.com', 'role_operation_admin', 'active', 'system');

-- 注意：默认密码为 "admin123"，实际使用时应立即修改
