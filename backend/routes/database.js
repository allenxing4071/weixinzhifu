// 数据库管理API路由
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../utils/jwt');

// 所有接口需要管理员权限
router.use(requireAdmin);

// ==================== 获取所有数据库表列表 ====================
router.get('/tables', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(503).json({ success: false, message: '数据库未连接' });
    }

    const [tables] = await pool.query(`
      SELECT 
        TABLE_NAME as tableName,
        TABLE_ROWS as rowCount,
        DATA_LENGTH as dataSize,
        CREATE_TIME as createdAt,
        UPDATE_TIME as updatedAt,
        TABLE_COMMENT as comment
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    res.json({
      success: true,
      data: {
        database: process.env.DB_NAME || 'weixin_payment',
        tables: tables.map(table => ({
          name: table.tableName,
          rowCount: table.rowCount || 0,
          size: formatBytes(table.dataSize || 0),
          comment: table.comment || '',
          createdAt: table.createdAt,
          updatedAt: table.updatedAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取表结构 ====================
router.get('/tables/:tableName/schema', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    const { tableName } = req.params;

    // 获取列信息
    const [columns] = await pool.query(`
      SELECT 
        COLUMN_NAME as name,
        COLUMN_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_KEY as \`key\`,
        COLUMN_DEFAULT as defaultValue,
        EXTRA as extra,
        COLUMN_COMMENT as comment
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    // 获取索引信息
    const [indexes] = await pool.query(`
      SHOW INDEX FROM \`${tableName}\`
    `);

    res.json({
      success: true,
      data: {
        tableName,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable === 'YES',
          key: col.key,
          default: col.defaultValue,
          extra: col.extra,
          comment: col.comment || ''
        })),
        indexes: indexes.map(idx => ({
          name: idx.Key_name,
          column: idx.Column_name,
          unique: idx.Non_unique === 0,
          type: idx.Index_type
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取表数据 ====================
router.get('/tables/:tableName/data', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    const { tableName } = req.params;
    const { page = 1, pageSize = 20, sortBy, sortOrder = 'DESC' } = req.query;

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 安全检查表名
    const [tableCheck] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    `, [tableName]);

    if (tableCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '表不存在' 
      });
    }

    // 构建排序条件
    let orderClause = '';
    if (sortBy) {
      // 验证列名存在
      const [columnCheck] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ? 
          AND COLUMN_NAME = ?
      `, [tableName, sortBy]);
      
      if (columnCheck.length > 0) {
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        orderClause = `ORDER BY \`${sortBy}\` ${order}`;
      }
    }

    // 获取总数
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total FROM \`${tableName}\`
    `);
    const total = countResult[0].total;

    // 获取数据
    const [rows] = await pool.query(`
      SELECT * FROM \`${tableName}\`
      ${orderClause}
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json({
      success: true,
      data: {
        tableName,
        rows,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 获取数据库统计信息 ====================
router.get('/stats', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;

    // 数据库大小
    const [dbSize] = await pool.query(`
      SELECT 
        SUM(DATA_LENGTH + INDEX_LENGTH) as size
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    // 表数量
    const [tableCount] = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    // 总行数
    const [rowCount] = await pool.query(`
      SELECT SUM(TABLE_ROWS) as total
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    res.json({
      success: true,
      data: {
        database: process.env.DB_NAME || 'weixin_payment',
        tableCount: tableCount[0].count,
        totalRows: rowCount[0].total || 0,
        size: formatBytes(dbSize[0].size || 0),
        sizeBytes: dbSize[0].size || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== 执行SQL查询 (只读) ====================
router.post('/query', async (req, res, next) => {
  try {
    const pool = req.app.locals.pool;
    const { sql } = req.body;

    if (!sql) {
      return res.status(400).json({ 
        success: false, 
        message: 'SQL语句不能为空' 
      });
    }

    // 安全检查：只允许SELECT查询
    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && 
        !trimmedSql.startsWith('SHOW') && 
        !trimmedSql.startsWith('DESCRIBE') &&
        !trimmedSql.startsWith('DESC')) {
      return res.status(403).json({ 
        success: false, 
        message: '只允许执行SELECT、SHOW、DESCRIBE查询' 
      });
    }

    const startTime = Date.now();
    const [rows] = await pool.query(sql);
    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        rows,
        rowCount: rows.length,
        executionTime: `${executionTime}ms`
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 辅助函数：格式化字节
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = router;

