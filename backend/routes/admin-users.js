// 管理员用户管理路由模块
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../utils/jwt');

// 所有管理员用户管理接口需要管理员权限
router.use(requireAdmin);

// ==================== 获取管理员列表（带统计） ====================
router.get('/', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // 从数据库获取管理员列表
    const [adminUsers] = await pool.query(`
      SELECT
        id,
        username,
        real_name as realName,
        email,
        phone,
        status,
        role,
        permissions,
        last_login_at as lastLoginAt,
        created_at as createdAt
      FROM admin_users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);

    // 获取总数
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM admin_users');

    // 统计数据
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as superAdmins,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM admin_users
    `);

    res.json({
      success: true,
      data: adminUsers.map(u => ({
        ...u,
        roleCode: u.role,
        roleName: u.role === 'super_admin' ? '超级管理员' : u.role === 'admin' ? '管理员' : '只读用户',
        permissions: u.permissions || {}
      })),
      stats: stats,
      pagination: {
        page,
        pageSize,
        total: total
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 创建管理员 ====================
router.post('/', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { username, password, realName, email, phone, role, permissions } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码为必填项' });
    }

    // 检查用户名是否已存在
    const [[existingUser]] = await pool.query('SELECT id FROM admin_users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    // 生成密码哈希
    const passwordHash = await bcrypt.hash(password, 12);

    // 确定角色
    const userRole = role || 'admin';

    const userId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 插入新管理员
    await pool.query(`
      INSERT INTO admin_users (id, username, password, real_name, email, phone, role, permissions, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 'system')
    `, [userId, username, passwordHash, realName || username, email, phone, userRole, permissions ? JSON.stringify(permissions) : null]);

    // 获取创建的用户信息
    const [[newUser]] = await pool.query(`
      SELECT
        id,
        username,
        real_name as realName,
        email,
        phone,
        status,
        role,
        created_at as createdAt
      FROM admin_users
      WHERE id = ?
    `, [userId]);

    res.json({ success: true, data: newUser, message: '管理员创建成功' });
  } catch (error) {
    next(error);
  }
});

// ==================== 更新管理员 ====================
router.put('/:id', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;
    const { realName, email, phone, role, status, permissions } = req.body;

    // 检查用户是否存在
    const [[existingUser]] = await pool.query('SELECT id, role FROM admin_users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    // 更新管理员信息
    await pool.query(`
      UPDATE admin_users
      SET real_name = ?, email = ?, phone = ?, role = ?, status = ?, permissions = ?
      WHERE id = ?
    `, [realName, email, phone, role || existingUser.role, status, permissions ? JSON.stringify(permissions) : null, id]);

    // 获取更新后的用户信息
    const [[updatedUser]] = await pool.query(`
      SELECT
        id,
        username,
        real_name as realName,
        email,
        phone,
        status,
        role,
        permissions,
        updated_at as updatedAt
      FROM admin_users
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...updatedUser,
        roleCode: updatedUser.role,
        roleName: updatedUser.role === 'super_admin' ? '超级管理员' : updatedUser.role === 'admin' ? '管理员' : '只读用户',
        permissions: updatedUser.permissions || {},
        role: updatedUser.role
      },
      message: '管理员信息更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 删除管理员 ====================
router.delete('/:id', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;

    // 检查用户是否存在
    const [[user]] = await pool.query('SELECT id, role FROM admin_users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    // 不允许删除超级管理员
    if (user.role === 'super_admin') {
      return res.status(403).json({ success: false, message: '不能删除超级管理员' });
    }

    // 删除管理员（硬删除）
    await pool.query('DELETE FROM admin_users WHERE id = ?', [id]);

    res.json({ success: true, message: '管理员删除成功' });
  } catch (error) {
    next(error);
  }
});

// ==================== 重置管理员密码 ====================
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: '新密码不能为空' });
    }

    // 检查用户是否存在
    const [[user]] = await pool.query('SELECT id FROM admin_users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    // 生成新的密码哈希
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await pool.query('UPDATE admin_users SET password = ? WHERE id = ?', [passwordHash, id]);

    res.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
