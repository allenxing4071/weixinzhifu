// 管理员认证控制器

import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { AppDataSource } from '../../config/database'
import { Admin } from '../../models/Admin'

export class AdminAuthController {
  // 管理员登录
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // 验证输入
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '请求参数错误',
          errors: errors.array()
        })
      }

      const { username, password } = req.body

      // 查找管理员
      const adminRepo = AppDataSource.getRepository(Admin)
      const admin = await adminRepo.findOne({
        where: { username },
        relations: ['role']
      })

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        })
      }

      // 检查管理员状态
      if (admin.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '账号已被禁用，请联系系统管理员'
        })
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, admin.password)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        })
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          adminId: admin.id,
          username: admin.username,
          roleId: admin.roleId
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      )

      // 更新最后登录信息
      await adminRepo.update(admin.id, {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip
      })

      // 返回登录成功信息
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          adminInfo: {
            id: admin.id,
            username: admin.username,
            realName: admin.realName,
            email: admin.email,
            role: admin.role?.roleName,
            permissions: admin.role?.permissions || []
          }
        }
      })

    } catch (error) {
      console.error('Admin login error:', error)
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试'
      })
    }
  }

  // 获取当前管理员信息
  static async getCurrentAdmin(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).adminId

      const adminRepo = AppDataSource.getRepository(Admin)
      const admin = await adminRepo.findOne({
        where: { id: adminId },
        relations: ['role']
      })

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在'
        })
      }

      res.json({
        success: true,
        data: {
          id: admin.id,
          username: admin.username,
          realName: admin.realName,
          email: admin.email,
          phone: admin.phone,
          roleId: admin.roleId,
          roleName: admin.role?.roleName,
          status: admin.status,
          lastLoginAt: admin.lastLoginAt,
          lastLoginIp: admin.lastLoginIp,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt
        }
      })

    } catch (error) {
      console.error('Get current admin error:', error)
      res.status(500).json({
        success: false,
        message: '获取管理员信息失败'
      })
    }
  }

  // 管理员登出
  static async logout(_req: Request, res: Response): Promise<void> {
    try {
      // 在实际生产环境中，可以将token加入黑名单
      // 这里简单返回成功，客户端清除token
      res.json({
        success: true,
        message: '登出成功'
      })
    } catch (error) {
      console.error('Admin logout error:', error)
      res.status(500).json({
        success: false,
        message: '登出失败'
      })
    }
  }

  // 修改密码
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '请求参数错误',
          errors: errors.array()
        })
      }

      const adminId = (req as any).adminId
      const { oldPassword, newPassword } = req.body

      const adminRepo = AppDataSource.getRepository(Admin)
      const admin = await adminRepo.findOne({ where: { id: adminId } })

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在'
        })
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, admin.password)
      if (!isOldPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '当前密码错误'
        })
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      // 更新密码
      await adminRepo.update(adminId, {
        password: hashedNewPassword,
        updatedAt: new Date()
      })

      res.json({
        success: true,
        message: '密码修改成功'
      })

    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({
        success: false,
        message: '密码修改失败'
      })
    }
  }
}

// 登录验证规则
export const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度应在3-50个字符之间'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6, max: 128 })
    .withMessage('密码长度应在6-128个字符之间')
]

// 修改密码验证规则
export const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('新密码长度应在6-128个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密码必须包含大小写字母和数字')
]
