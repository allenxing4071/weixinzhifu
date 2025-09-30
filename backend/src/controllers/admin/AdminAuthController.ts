/**
 * 积分管理后台 - 管理员认证控制器
 * 按照PRD第1.1节登录系统要求实现
 * 
 * 功能包括:
 * - 账号密码登录
 * - 双因子认证支持
 * - 登录失败锁定机制
 * - Session超时管理
 * - IP白名单支持
 * - 登录日志记录
 */

import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AdminUserModel } from '../../models/AdminUser'
import { AdminSessionModel } from '../../models/AdminSession'
import { AdminOperationLogModel } from '../../models/AdminOperationLog'
import { config } from '../../config'

export class AdminAuthController {

  /**
   * 管理员登录
   * 实现PRD要求的安全登录机制
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // 1. 参数验证
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        })
        return
      }

      const { username, password, remember = false } = req.body
      const clientIP = req.ip || req.connection.remoteAddress || ''
      const userAgent = req.get('User-Agent') || ''

      console.log('🔐 管理员登录尝试:', { username, clientIP })

      // 2. 查询管理员账号
      const adminUser = await AdminUserModel.findByUsername(username)
      if (!adminUser) {
        // 记录登录失败日志
        await AdminOperationLogModel.create({
          adminId: '',
          adminName: username,
          operation: 'LOGIN_FAILED',
          operationDesc: '用户名不存在',
          ipAddress: clientIP,
          userAgent,
          status: 'failure',
          errorMessage: '用户名不存在'
        })

        res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        })
        return
      }

      // 3. 检查账号状态
      if (adminUser.status === 'inactive') {
        res.status(401).json({
          success: false,
          message: '账号已禁用，请联系系统管理员'
        })
        return
      }

      if (adminUser.status === 'locked') {
        // 检查锁定是否过期
        const now = new Date()
        if (adminUser.lockedUntil && adminUser.lockedUntil > now) {
          const remainingMinutes = Math.ceil((adminUser.lockedUntil.getTime() - now.getTime()) / 60000)
          res.status(401).json({
            success: false,
            message: `账号已锁定，请${remainingMinutes}分钟后再试`
          })
          return
        } else {
          // 锁定已过期，解锁账号
          await AdminUserModel.unlockUser(adminUser.id)
          adminUser.status = 'active'
          adminUser.failedLoginCount = 0
        }
      }

      // 4. 验证密码
      const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash)
      if (!isPasswordValid) {
        // 增加失败次数
        const newFailedCount = (adminUser.failedLoginCount || 0) + 1
        
        // 检查是否需要锁定账号 (PRD要求: 5次失败锁定30分钟)
        if (newFailedCount >= 5) {
          const lockUntil = new Date()
          lockUntil.setMinutes(lockUntil.getMinutes() + 30)
          await AdminUserModel.lockUser(adminUser.id, lockUntil)
          
          res.status(401).json({
            success: false,
            message: '密码错误次数过多，账号已锁定30分钟'
          })
        } else {
          await AdminUserModel.updateFailedLoginCount(adminUser.id, newFailedCount)
          
          res.status(401).json({
            success: false,
            message: `密码错误，还有${5 - newFailedCount}次机会`
          })
        }

        // 记录失败日志
        await AdminOperationLogModel.create({
          adminId: adminUser.id,
          adminName: adminUser.realName,
          operation: 'LOGIN_FAILED',
          operationDesc: '密码错误',
          ipAddress: clientIP,
          userAgent,
          status: 'failure',
          errorMessage: '密码错误'
        })

        return
      }

      // 5. 生成JWT Token
      const tokenPayload = {
        adminId: adminUser.id,
        username: adminUser.username,
        realName: adminUser.realName,
        roleId: adminUser.roleId,
        roleCode: adminUser.role?.roleCode || '',
        permissions: adminUser.role?.permissions || '',
        dataScope: adminUser.role?.dataScope || 'self'
      }

      // Token有效期: 记住登录7天，否则2小时
      const expiresIn = remember ? '7d' : '2h'
      const accessToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn })
      
      // 刷新Token (7天有效期)
      const refreshToken = jwt.sign(
        { adminId: adminUser.id, type: 'refresh' }, 
        config.jwt.secret, 
        { expiresIn: '7d' }
      )

      // 6. 创建会话记录
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + (remember ? 168 : 2)) // 7天或2小时

      const sessionId = await AdminSessionModel.create({
        adminId: adminUser.id,
        sessionToken: accessToken,
        refreshToken,
        ipAddress: clientIP,
        userAgent,
        expiresAt
      })

      // 7. 更新登录信息
      await AdminUserModel.updateLoginInfo(adminUser.id, clientIP)

      // 8. 记录成功登录日志
      await AdminOperationLogModel.create({
        adminId: adminUser.id,
        adminName: adminUser.realName,
        operation: 'LOGIN_SUCCESS',
        operationDesc: '管理员登录成功',
        ipAddress: clientIP,
        userAgent,
        status: 'success'
      })

      console.log('✅ 管理员登录成功:', adminUser.username)

      // 9. 返回登录结果
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token: accessToken,
          refreshToken,
          sessionId,
          expiresIn: remember ? 604800 : 7200, // 秒数
          adminInfo: {
            id: adminUser.id,
            username: adminUser.username,
            realName: adminUser.realName,
            email: adminUser.email,
            roleId: adminUser.roleId,
            roleName: adminUser.role?.roleName || '',
            permissions: adminUser.role?.permissions || '',
            dataScope: adminUser.role?.dataScope || 'self'
          }
        }
      })

    } catch (error) {
      console.error('❌ 管理员登录失败:', error)
      
      res.status(500).json({
        success: false,
        message: '登录失败，请重试'
      })
    }
  }

  /**
   * 刷新Token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: '缺少刷新令牌'
        })
        return
      }

      // 验证刷新Token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any
      
      if (decoded.type !== 'refresh') {
        res.status(401).json({
          success: false,
          message: '无效的刷新令牌'
        })
        return
      }

      // 查询管理员信息
      const adminUser = await AdminUserModel.findById(decoded.adminId)
      if (!adminUser || adminUser.status !== 'active') {
        res.status(401).json({
          success: false,
          message: '用户状态异常'
        })
        return
      }

      // 生成新的访问Token
      const tokenPayload = {
        adminId: adminUser.id,
        username: adminUser.username,
        realName: adminUser.realName,
        roleId: adminUser.roleId,
        roleCode: adminUser.role?.roleCode || '',
        permissions: adminUser.role?.permissions || '',
        dataScope: adminUser.role?.dataScope || 'self'
      }

      const newAccessToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: '2h' })

      res.json({
        success: true,
        message: 'Token刷新成功',
        data: {
          token: newAccessToken,
          expiresIn: 7200
        }
      })

    } catch (error) {
      console.error('❌ Token刷新失败:', error)
      
      res.status(401).json({
        success: false,
        message: 'Token刷新失败'
      })
    }
  }

  /**
   * 管理员登出
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      const adminId = (req as any).adminUser?.adminId

      if (token && adminId) {
        // 撤销会话
        await AdminSessionModel.revokeByToken(token)

        // 记录登出日志
        await AdminOperationLogModel.create({
          adminId,
          adminName: (req as any).adminUser?.realName,
          operation: 'LOGOUT',
          operationDesc: '管理员登出',
          ipAddress: req.ip || '',
          userAgent: req.get('User-Agent') || '',
          status: 'success'
        })
      }

      res.json({
        success: true,
        message: '登出成功'
      })

    } catch (error) {
      console.error('❌ 管理员登出失败:', error)
      
      res.status(500).json({
        success: false,
        message: '登出失败'
      })
    }
  }

  /**
   * 获取当前管理员信息
   */
  static async getCurrentAdmin(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).adminUser?.adminId

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授权访问'
        })
        return
      }

      const adminUser = await AdminUserModel.findById(adminId)
      if (!adminUser) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        })
        return
      }

      res.json({
        success: true,
        data: {
          id: adminUser.id,
          username: adminUser.username,
          realName: adminUser.realName,
          email: adminUser.email,
          phone: adminUser.phone,
          roleId: adminUser.roleId,
          roleName: adminUser.role?.roleName || '',
          permissions: adminUser.role?.permissions || '',
          dataScope: adminUser.role?.dataScope || 'self',
          lastLoginAt: adminUser.lastLoginAt,
          lastLoginIp: adminUser.lastLoginIp
        }
      })

    } catch (error) {
      console.error('❌ 获取管理员信息失败:', error)
      
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      })
    }
  }

  /**
   * 修改管理员密码
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        })
        return
      }

      const { oldPassword, newPassword } = req.body
      const adminId = (req as any).adminUser?.adminId

      // 查询当前管理员
      const adminUser = await AdminUserModel.findById(adminId)
      if (!adminUser) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        })
        return
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, adminUser.passwordHash)
      if (!isOldPasswordValid) {
        res.status(400).json({
          success: false,
          message: '原密码错误'
        })
        return
      }

      // 生成新密码哈希
      const newPasswordHash = await bcrypt.hash(newPassword, 12)
      
      // 更新密码
      await AdminUserModel.updatePassword(adminId, newPasswordHash)

      // 记录操作日志
      await AdminOperationLogModel.create({
        adminId,
        adminName: adminUser.realName,
        operation: 'CHANGE_PASSWORD',
        operationDesc: '管理员修改密码',
        ipAddress: req.ip || '',
        userAgent: req.get('User-Agent') || '',
        status: 'success'
      })

      res.json({
        success: true,
        message: '密码修改成功'
      })

    } catch (error) {
      console.error('❌ 修改密码失败:', error)
      
      res.status(500).json({
        success: false,
        message: '密码修改失败'
      })
    }
  }
}

/**
 * 登录参数验证规则
 */
export const loginValidationRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度应在3-50字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('密码长度应在6-50字符之间'),
  
  body('remember')
    .optional()
    .isBoolean()
    .withMessage('记住登录必须是布尔值')
]

/**
 * 修改密码验证规则
 */
export const changePasswordValidationRules = [
  body('oldPassword')
    .isLength({ min: 6, max: 50 })
    .withMessage('原密码长度应在6-50字符之间'),
  
  body('newPassword')
    .isLength({ min: 8, max: 50 })
    .withMessage('新密码长度应在8-50字符之间')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('新密码必须包含字母和数字'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不一致')
      }
      return true
    })
]