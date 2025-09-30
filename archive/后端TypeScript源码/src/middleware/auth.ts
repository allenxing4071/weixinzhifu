import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config/index'

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        openid: string
        type: 'user' | 'merchant' | 'admin'
      }
    }
  }
}

/**
 * JWT身份验证中间件
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: '缺少访问令牌'
      })
      return
    }
    
    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any
      req.user = {
        userId: decoded.userId,
        openid: decoded.openid,
        type: decoded.type || 'user'
      }
      
      next()
      
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: '访问令牌已过期'
        })
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          code: 'INVALID_TOKEN',
          message: '访问令牌无效'
        })
      } else {
        res.status(401).json({
          success: false,
          code: 'AUTH_FAILED',
          message: '身份验证失败'
        })
      }
    }
    
  } catch (error) {
    console.error('身份验证中间件异常:', error)
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: '服务器内部错误'
    })
  }
}

/**
 * 可选身份验证中间件
 */
export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next()
    return
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any
    req.user = {
      userId: decoded.userId,
      openid: decoded.openid,
      type: decoded.type || 'user'
    }
  } catch (error) {
    // 可选验证失败不影响继续执行
    console.warn('可选身份验证失败:', error)
  }
  
  next()
}
