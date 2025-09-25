// 管理员认证中间件

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '../../config/database'
import { Admin } from '../../models/Admin'
import { Permission } from '../../models/AdminRole'

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      adminId?: string
      admin?: Admin
      adminPermissions?: Permission[]
    }
  }
}

// JWT token验证中间件
export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // 验证管理员是否存在且状态正常
      const adminRepo = AppDataSource.getRepository(Admin)
      const admin = await adminRepo.findOne({
        where: { id: decoded.adminId },
        relations: ['role']
      })

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: '管理员不存在'
        })
      }

      if (admin.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '账号已被禁用'
        })
      }

      // 将管理员信息添加到请求对象
      req.adminId = admin.id
      req.admin = admin
      req.adminPermissions = admin.role?.permissions || []

      next()
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期'
      })
    }

  } catch (error) {
    console.error('Admin auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误'
    })
  }
}

// 权限检查中间件工厂
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const adminPermissions = req.adminPermissions || []
    
    if (!adminPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作'
      })
    }
    
    next()
  }
}

// 多权限检查中间件工厂（需要任一权限）
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const adminPermissions = req.adminPermissions || []
    
    const hasPermission = permissions.some(permission => 
      adminPermissions.includes(permission)
    )
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作'
      })
    }
    
    next()
  }
}

// 多权限检查中间件工厂（需要所有权限）
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const adminPermissions = req.adminPermissions || []
    
    const hasAllPermissions = permissions.every(permission => 
      adminPermissions.includes(permission)
    )
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作'
      })
    }
    
    next()
  }
}

// 超级管理员检查中间件
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const admin = req.admin
  
  if (!admin || admin.role?.roleCode !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '仅超级管理员可执行此操作'
    })
  }
  
  next()
}

// 操作日志记录中间件
export const logAdminAction = (action: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // 记录管理员操作日志
    try {
      const adminId = req.adminId
      const ipAddress = req.ip
      const userAgent = req.get('User-Agent')
      
      // TODO: 实现操作日志记录逻辑
      console.log('Admin action log:', {
        adminId,
        action,
        ipAddress,
        userAgent,
        timestamp: new Date()
      })
      
    } catch (error) {
      console.error('Log admin action error:', error)
    }
    
    next()
  }
}
