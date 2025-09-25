import { Request, Response } from 'express'
import { MerchantModel } from '../../models/Merchant'
import { MerchantQRCodeService } from '../../services/MerchantQRCodeService'

/**
 * 管理后台 - 商户二维码管理控制器
 */
export class MerchantQRCodeController {
  
  /**
   * 为商户生成支付二维码
   */
  static async generateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      const { fixedAmount, qrType = 'miniprogram' } = req.body
      
      // 1. 验证商户是否存在
      const merchant = await MerchantModel.findById(merchantId)
      
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: '商户不存在或已禁用'
        })
        return
      }
      
      // 2. 检查商户是否配置了特约商户号
      if (!merchant.subMchId) {
        res.status(400).json({
          success: false,
          message: '商户未配置微信支付特约商户号，请先完成配置'
        })
        return
      }
      
      let qrCodeResult: any
      
      // 3. 根据类型生成不同的二维码
      if (qrType === 'miniprogram') {
        // 生成小程序扫码二维码
        qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
          merchantId,
          merchant.subMchId,
          fixedAmount ? Math.round(fixedAmount * 100) : undefined
        )
      } else if (qrType === 'wechat_native') {
        // 生成微信Native扫码支付二维码
        if (!fixedAmount) {
          res.status(400).json({
            success: false,
            message: '微信Native支付二维码需要指定固定金额'
          })
          return
        }
        
        qrCodeResult = await MerchantQRCodeService.generateWechatNativeQRCode(
          merchantId,
          merchant.subMchId,
          Math.round(fixedAmount * 100),
          `${merchant.merchantName}收款`
        )
      } else {
        res.status(400).json({
          success: false,
          message: '不支持的二维码类型'
        })
        return
      }
      
      // 4. 返回二维码（Base64格式）
      const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64')
      
      res.json({
        success: true,
        data: {
          qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
          qrCodeUrl: qrCodeResult.qrCodeUrl || qrCodeResult.codeUrl,
          qrCodeData: qrCodeResult.qrCodeData || qrCodeResult.orderNo,
          qrType,
          merchantInfo: {
            id: merchant.id,
            name: merchant.merchantName,
            subMchId: merchant.subMchId
          },
          fixedAmount,
          expiresAt: qrCodeResult.expiresAt,
          createdAt: new Date()
        },
        message: '二维码生成成功'
      })
      
    } catch (error) {
      console.error('生成商户二维码失败:', error)
      res.status(500).json({
        success: false,
        message: '二维码生成失败，请重试'
      })
    }
  }
  
  /**
   * 获取商户的二维码历史记录
   */
  static async getQRCodeHistory(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      const { page = 1, pageSize = 20 } = req.query
      
      // 验证商户是否存在
      const merchant = await MerchantModel.findById(merchantId)
      
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: '商户不存在'
        })
        return
      }
      
      // TODO: 如果需要存储二维码历史记录，可以添加QRCodeRecord表
      // 目前返回商户基本信息
      res.json({
        success: true,
        data: {
          merchant: {
            id: merchant.id,
            name: merchant.merchantName,
            subMchId: merchant.subMchId,
            status: merchant.status
          },
          records: [], // 暂时为空，后续可扩展
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total: 0
          }
        }
      })
      
    } catch (error) {
      console.error('获取二维码历史失败:', error)
      res.status(500).json({
        success: false,
        message: '获取历史记录失败'
      })
    }
  }
  
  /**
   * 批量为多个商户生成二维码
   */
  static async batchGenerateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { merchantIds, qrType = 'miniprogram', fixedAmount } = req.body
      
      if (!Array.isArray(merchantIds) || merchantIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的商户ID列表'
        })
        return
      }
      
      if (merchantIds.length > 50) {
        res.status(400).json({
          success: false,
          message: '单次最多支持50个商户'
        })
        return
      }
      
      // 获取商户信息
      const merchant = await MerchantModel.findById(merchantId)
      const merchants = await merchantRepo.find({
        where: { 
          id: merchantIds as any,
          status: 'active'
        }
      })
      
      const results = []
      const errors = []
      
      // 为每个商户生成二维码
      for (const merchant of merchants) {
        try {
          if (!merchant.subMchId) {
            errors.push({
              merchantId: merchant.id,
              merchantName: merchant.merchantName,
              error: '未配置特约商户号'
            })
            continue
          }
          
          let qrCodeResult: any
          
          if (qrType === 'miniprogram') {
            qrCodeResult = await MerchantQRCodeService.generateMerchantQRCode(
              merchant.id,
              merchant.subMchId,
              fixedAmount ? Math.round(fixedAmount * 100) : undefined
            )
          } else if (qrType === 'wechat_native') {
            if (!fixedAmount) {
              errors.push({
                merchantId: merchant.id,
                merchantName: merchant.merchantName,
                error: '微信Native支付需要指定固定金额'
              })
              continue
            }
            
            qrCodeResult = await MerchantQRCodeService.generateWechatNativeQRCode(
              merchant.id,
              merchant.subMchId,
              Math.round(fixedAmount * 100),
              `${merchant.merchantName}收款`
            )
          }
          
          const qrCodeBase64 = qrCodeResult.qrCodeBuffer.toString('base64')
          
          results.push({
            merchantId: merchant.id,
            merchantName: merchant.merchantName,
            qrCodeImage: `data:image/png;base64,${qrCodeBase64}`,
            qrCodeUrl: qrCodeResult.qrCodeUrl || qrCodeResult.codeUrl,
            expiresAt: qrCodeResult.expiresAt
          })
          
        } catch (error) {
          errors.push({
            merchantId: merchant.id,
            merchantName: merchant.merchantName,
            error: error instanceof Error ? error.message : '生成失败'
          })
        }
      }
      
      res.json({
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: merchantIds.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: `批量生成完成：成功${results.length}个，失败${errors.length}个`
      })
      
    } catch (error) {
      console.error('批量生成二维码失败:', error)
      res.status(500).json({
        success: false,
        message: '批量生成失败，请重试'
      })
    }
  }
  
  /**
   * 验证二维码有效性
   */
  static async verifyQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId, subMchId, sign, fixedAmount } = req.body
      
      // 验证签名
      const isValid = MerchantQRCodeService.verifyQRCodeSign(
        merchantId,
        subMchId,
        sign,
        fixedAmount ? Math.round(fixedAmount * 100) : undefined
      )
      
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: '二维码签名验证失败'
        })
        return
      }
      
      // 验证商户状态
      const merchant = await MerchantModel.findById(merchantId)
      const merchant = await merchantRepo.findOne({
        where: { id: merchantId, status: 'active' }
      })
      
      if (!merchant) {
        res.status(404).json({
          success: false,
          message: '商户不存在或已禁用'
        })
        return
      }
      
      res.json({
        success: true,
        data: {
          valid: true,
          merchant: {
            id: merchant.id,
            name: merchant.merchantName,
            subMchId: merchant.subMchId
          }
        },
        message: '二维码验证通过'
      })
      
    } catch (error) {
      console.error('验证二维码失败:', error)
      res.status(500).json({
        success: false,
        message: '验证失败，请重试'
      })
    }
  }
}
