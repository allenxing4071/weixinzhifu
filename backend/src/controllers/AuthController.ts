import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UserModel } from '@/models/User'
import { WechatService } from '@/services/WechatService'
import config from '@/config'

export class AuthController {
  /**
   * 微信小程序登录
   */
  static async wechatLogin(req: Request, res: Response): Promise<void> {
    try {
      const { code, userInfo } = req.body
      
      if (!code) {
        res.status(400).json({
          success: false,
          code: 'MISSING_CODE',
          message: '缺少微信授权码'
        })
        return
      }
      
      // 1. 通过code获取openid
      const wechatData = await WechatService.getOpenidByCode(code)
      
      // 2. 查找或创建用户
      let user = await UserModel.findByOpenid(wechatData.openid)
      
      if (!user) {
        // 创建新用户
        const userData = {
          wechatId: wechatData.openid,
          openid: wechatData.openid,
          unionid: wechatData.unionid,
          nickname: userInfo?.nickName || '微信用户',
          avatar: userInfo?.avatarUrl
        }
        
        user = await UserModel.create(userData)
      } else {
        // 更新用户信息
        if (userInfo && userInfo.nickName) {
          await UserModel.update(user.id, {
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl
          })
          user.nickname = userInfo.nickName
          user.avatar = userInfo.avatarUrl
        }
      }
      
      // 3. 生成JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          openid: user.openid,
          type: 'user'
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
      )
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '登录成功',
        data: {
          token,
          userInfo: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            pointsBalance: user.pointsBalance
          }
        }
      })
      
    } catch (error) {
      console.error('微信登录失败:', error)
      res.status(500).json({
        success: false,
        code: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : '登录失败'
      })
    }
  }
  
  /**
   * 获取用户信息
   */
  static async getUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '用户未登录'
        })
        return
      }
      
      const user = await UserModel.findById(userId)
      if (!user) {
        res.status(404).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        })
        return
      }
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '获取成功',
        data: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          pointsBalance: user.pointsBalance,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt
        }
      })
      
    } catch (error) {
      console.error('获取用户信息失败:', error)
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '服务器内部错误'
      })
    }
  }
  
  /**
   * 更新用户信息
   */
  static async updateUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      const { nickname, phone } = req.body
      
      if (!userId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '用户未登录'
        })
        return
      }
      
      const updateData: any = {}
      if (nickname) updateData.nickname = nickname
      if (phone) updateData.phone = phone
      
      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          message: '没有需要更新的信息'
        })
        return
      }
      
      const updated = await UserModel.update(userId, updateData)
      
      if (!updated) {
        res.status(400).json({
          success: false,
          code: 'UPDATE_FAILED',
          message: '更新失败'
        })
        return
      }
      
      res.json({
        success: true,
        code: 'SUCCESS',
        message: '更新成功'
      })
      
    } catch (error) {
      console.error('更新用户信息失败:', error)
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '服务器内部错误'
      })
    }
  }
}
