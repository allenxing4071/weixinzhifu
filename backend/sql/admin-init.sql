-- 管理后台初始化数据

-- 创建管理员角色表
CREATE TABLE IF NOT EXISTS `admin_roles` (
  `id` varchar(36) NOT NULL,
  `roleName` varchar(50) NOT NULL,
  `roleCode` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `permissions` JSON NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `createdAt` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_role_name` (`roleName`),
  UNIQUE KEY `UQ_role_code` (`roleCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建管理员表
CREATE TABLE IF NOT EXISTS `admins` (
  `id` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `realName` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `roleId` varchar(36) NOT NULL,
  `status` enum('active','inactive','locked') DEFAULT 'active',
  `lastLoginAt` datetime DEFAULT NULL,
  `lastLoginIp` varchar(45) DEFAULT NULL,
  `createdAt` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_admin_username` (`username`),
  KEY `FK_admin_role` (`roleId`),
  CONSTRAINT `FK_admin_role` FOREIGN KEY (`roleId`) REFERENCES `admin_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认角色
INSERT IGNORE INTO `admin_roles` (`id`, `roleName`, `roleCode`, `description`, `permissions`, `status`) VALUES 
(
  UUID(),
  '超级管理员',
  'super_admin',
  '系统超级管理员，拥有所有权限',
  JSON_ARRAY(
    'user:view', 'user:edit', 'user:delete', 'user:points:adjust',
    'merchant:view', 'merchant:approve', 'merchant:edit', 'merchant:delete',
    'points:view', 'points:adjust', 'points:config', 'points:stats',
    'order:view', 'order:refund', 'order:edit',
    'finance:view', 'finance:export', 'finance:stats',
    'system:config', 'system:logs', 'system:monitor', 'system:backup',
    'admin:view', 'admin:create', 'admin:edit', 'admin:delete', 'role:manage'
  ),
  'active'
),
(
  UUID(),
  '运营管理员',
  'operator_admin',
  '运营管理员，负责日常运营管理',
  JSON_ARRAY(
    'user:view', 'user:edit', 'user:points:adjust',
    'merchant:view', 'merchant:approve', 'merchant:edit',
    'points:view', 'points:adjust', 'points:stats',
    'order:view', 'order:edit',
    'finance:view', 'finance:stats'
  ),
  'active'
),
(
  UUID(),
  '客服管理员',
  'service_admin',
  '客服管理员，负责用户服务和简单操作',
  JSON_ARRAY(
    'user:view', 'merchant:view', 'points:view', 'order:view'
  ),
  'active'
);

-- 插入默认管理员账号（密码：admin123）
-- 注意：这个密码hash是 bcryptjs.hash('admin123', 12) 的结果
SET @super_admin_role_id = (SELECT id FROM admin_roles WHERE roleCode = 'super_admin' LIMIT 1);

INSERT IGNORE INTO `admins` (`id`, `username`, `password`, `realName`, `email`, `roleId`, `status`) VALUES 
(
  UUID(),
  'admin',
  '$2b$12$rQx8VqG2qKlGYfF5yj.zFu5WyJ8Zz6QC0HKLZ9J7vXMOqJ7HFYQSG',
  '系统管理员',
  'admin@example.com',
  @super_admin_role_id,
  'active'
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` varchar(36) NOT NULL,
  `adminId` varchar(36) NOT NULL,
  `adminName` varchar(50) NOT NULL,
  `action` varchar(100) NOT NULL,
  `resource` varchar(100) DEFAULT NULL,
  `resourceId` varchar(36) DEFAULT NULL,
  `details` JSON DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `createdAt` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_admin_logs_admin` (`adminId`),
  KEY `IDX_admin_logs_action` (`action`),
  KEY `IDX_admin_logs_created` (`createdAt`),
  CONSTRAINT `FK_admin_logs_admin` FOREIGN KEY (`adminId`) REFERENCES `admins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
