/**
 * 管理员认证中间件
 * 实现JWT Token验证和权限控制
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AdminUserModel } from '../models/AdminUser'
import { AdminSessionModel } from '../models/AdminSession'
import { AdminOperationLogModel } from '../models/AdminOperationLog'
import { config } from '../config'

// 扩展Request接口，添加管理员信息
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        adminId: string
        username: string
        realName: string
        roleId: string
        roleCode: string
        permissions: string
        dataScope: string
      }
    }
  }
}

/**
 * JWT Token验证中间件
 */
export const authenticateAdminJWT = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // 1. 获取Token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
      return
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀

    // 2. 验证Token
    let decoded: any
    try {
      decoded = jwt.verify(token, config.jwt.secret)
    } catch (error) {
      res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期'
      })
      return
    }

    // 3. 验证会话
    const isSessionValid = await AdminSessionModel.isSessionValid(token)
    if (!isSessionValid) {
      res.status(401).json({
        success: false,
        message: '会话已过期，请重新登录'
      })
      return
    }

    // 4. 查询管理员信息
    const adminUser = await AdminUserModel.findById(decoded.adminId)
    if (!adminUser || adminUser.status !== 'active') {
      res.status(401).json({
        success: false,
        message: '用户状态异常，请重新登录'
      })
      return
    }

    // 5. 设置请求中的管理员信息
    req.adminUser = {
      adminId: adminUser.id,
      username: adminUser.username,
      realName: adminUser.realName,
      roleId: adminUser.roleId,
      roleCode: adminUser.role?.roleCode || '',
      permissions: adminUser.role?.permissions || '',
      dataScope: adminUser.role?.dataScope || 'self'
    }

    next()

  } catch (error) {
    console.error('❌ 认证中间件错误:', error)
    
    res.status(500).json({
      success: false,
      message: '认证服务异常'
    })
  }
}

/**
 * 权限验证中间件工厂
 * @param requiredPermissions 需要的权限列表
 * @param requireAll 是否需要所有权限（true）还是任一权限（false）
 */
export const requirePermissions = (
  requiredPermissions: string[], 
  requireAll: boolean = false
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const adminUser = req.adminUser
      
      if (!adminUser) {
        res.status(401).json({
          success: false,
          message: '未认证用户'
        })
        return
      }

      // 超级管理员拥有所有权限
      if (adminUser.roleCode === 'SUPER_ADMIN' || adminUser.permissions === 'all') {
        next()
        return
      }

      // 解析用户权限
      const userPermissions = adminUser.permissions.split(',').map(p => p.trim())
      
      // 检查权限
      const hasPermission = requireAll 
        ? requiredPermissions.every(perm => userPermissions.includes(perm))
        : requiredPermissions.some(perm => userPermissions.includes(perm))

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: '权限不足'
        })
        return
      }

      next()

    } catch (error) {
      console.error('❌ 权限验证错误:', error)
      
      res.status(500).json({
        success: false,
        message: '权限验证异常'
      })
    }
  }
}

/**
 * 数据权限过滤中间件
 * 根据管理员的数据范围过滤查询条件
 */
export const applyDataScope = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const adminUser = req.adminUser
    
    if (!adminUser) {
      next()
      return
    }

    // 超级管理员可以访问所有数据
    if (adminUser.roleCode === 'SUPER_ADMIN' || adminUser.dataScope === 'all') {
      next()
      return
    }

    // 根据数据范围添加查询条件
    if (adminUser.dataScope === 'self') {
      // 只能查看自己创建的数据
      req.query.createdBy = adminUser.adminId
    } else if (adminUser.dataScope === 'department') {
      // 可以查看部门数据（暂未实现部门功能）
      req.query.departmentId = 'dept_placeholder'
    }

    next()

  } catch (error) {
    console.error('❌ 数据权限过滤错误:', error)
    next()
  }
}

/**
 * 操作日志记录中间件
 */
export const logOperation = (operationType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now()
    
    // 保存原始的res.json方法
    const originalJson = res.json.bind(res)
    
    // 重写res.json方法以记录响应结果
    res.json = (body: any) => {
      const endTime = Date.now()
      const executionTime = endTime - startTime
      
      // 异步记录操作日志
      setImmediate(async () => {
        try {
          const adminUser = req.adminUser
          
          if (adminUser) {
            await AdminOperationLogModel.create({
              adminId: adminUser.adminId,
              adminName: adminUser.realName,
              operationType,
              operationDesc: `${req.method} ${req.path}`,
              targetType: req.params.id ? 'resource' : 'collection',
              targetId: req.params.id,
              requestMethod: req.method,
              requestUrl: req.originalUrl,
              requestParams: {
                params: req.params,
                query: req.query,
                body: req.method !== 'GET' ? req.body : undefined
              },
              responseResult: {
                statusCode: res.statusCode,
                success: body.success,
                message: body.message
              },
              ipAddress: req.ip || req.connection.remoteAddress || '',
              userAgent: req.get('User-Agent'),
              executionTime,
              status: body.success ? 'success' : 'failure',
              errorMessage: body.success ? undefined : body.message
            })
          }
        } catch (error) {
          console.error('❌ 记录操作日志失败:', error)
        }
      })
      
      // 调用原始的json方法
      return originalJson(body)
    }
    
    next()
  }
}

/**
 * IP白名单验证中间件
 */
export const validateIPWhitelist = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 如果没有配置白名单，则跳过验证
    if (allowedIPs.length === 0) {
      next()
      return
    }

    const clientIP = req.ip || req.connection.remoteAddress || ''
    
    // 检查IP是否在白名单中
    const isAllowed = allowedIPs.some(allowedIP => {
      // 支持CIDR格式的IP段匹配（简单实现）
      if (allowedIP.includes('/')) {
        // TODO: 实现CIDR匹配逻辑
        return false
      }
      return clientIP === allowedIP
    })

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        message: 'IP地址不在允许访问的范围内'
      })
      return
    }

    next()
  }
}

/**
 * 管理员权限枚举
 */
export const AdminPermissions = {
  // 仪表板
  DASHBOARD_VIEW: 'dashboard:view',
  
  // 用户管理
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_POINTS: 'users:points',
  
  // 商户管理
  MERCHANTS_VIEW: 'merchants:view',
  MERCHANTS_CREATE: 'merchants:create',
  MERCHANTS_UPDATE: 'merchants:update',
  MERCHANTS_DELETE: 'merchants:delete',
  MERCHANTS_QRCODE: 'merchants:qrcode',
  
  // 积分管理
  POINTS_VIEW: 'points:view',
  POINTS_CONFIG: 'points:config',
  POINTS_ADJUST: 'points:adjust',
  
  // 财务管理
  FINANCE_VIEW: 'finance:view',
  FINANCE_REPORTS: 'finance:reports',
  
  // 系统管理
  SYSTEM_USERS: 'system:users',
  SYSTEM_ROLES: 'system:roles',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_CONFIG: 'system:config'
} as const
