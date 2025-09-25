import { Request, Response } from 'express'
import { MerchantModel } from '../../models/Merchant'
import { MerchantQRCodeService } from '../../services/MerchantQRCodeService'

/**
 * 管理后台 - 商户二维码管理控制器 - 生产版本
 * 修复QR码生成问题，确保返回真实数据
 */
export class MerchantQRCodeController {
  
  /**
   * 为商户生成支付二维码 - 主要API
   */
  static async generateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params
      const { fixedAmount } = req.body
      
      console.log(`🎯 QR码生成请求: merchantId=${merchantId}, fixedAmount=${fixedAmount}`)
      
      // 1. 验证商户是否存在
      const merchant = await MerchantModel.findById(merchantId)
      
      if (!merchant) {
        console.log(`❌ 商户不存在: ${merchantId}`)
        res.status(404).json({
          success: false,
          message: '商户不存在或已禁用'
        })
        return
      }
      
      // 2. 生成二维码 - 使用新的简化服务
      const qrResult = await MerchantQRCodeService.generateQRCode(
        merchantId,
        fixedAmount ? Math.round(fixedAmount * 100) : undefined
      )
      
      // 3. 验证生成的数据格式
      if (!MerchantQRCodeService.validateQRCodeData(qrResult.qrCodeData)) {
        throw new Error('生成的QR码数据格式不正确')
      }
      
      console.log(`✅ QR码生成成功: ${qrResult.qrCodeData.substring(0, 50)}...`)
      
      // 4. 返回完整的QR码信息
      res.json({
        success: true,
        data: {
          qrCodeData: qrResult.qrCodeData,   // 完整的base64图片数据
          qrCodeUrl: qrResult.qrCodeUrl,     // 扫码后跳转URL
          merchantInfo: {
            id: merchant.id,
            name: merchant.merchantName,
            subMchId: merchant.subMchId
          },
          amount: fixedAmount,
          createdAt: new Date().toISOString()
        },
        message: '二维码生成成功'
      })
      
    } catch (error) {
      console.error('❌ 生成商户二维码失败:', error)
      res.status(500).json({
        success: false,
        message: `二维码生成失败: ${error.message}`
      })
    }
  }
  
  /**
   * 批量为多个商户生成二维码
   */
  static async batchGenerateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { merchantIds, fixedAmount } = req.body
      
      console.log(`🎯 批量QR码生成: ${merchantIds?.length || 0} 个商户`)
      
      if (!Array.isArray(merchantIds) || merchantIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的商户ID列表'
        })
        return
      }
      
      if (merchantIds.length > 20) {
        res.status(400).json({
          success: false,
          message: '单次最多支持20个商户'
        })
        return
      }
      
      // 使用新的批量生成服务
      const result = await MerchantQRCodeService.generateBatchQRCodes(
        merchantIds,
        fixedAmount ? Math.round(fixedAmount * 100) : undefined
      )
      
      console.log(`✅ 批量生成完成: 成功${result.success.length}个，失败${result.failed.length}个`)
      
      res.json({
        success: true,
        data: {
          successful: result.success,
          failed: result.failed,
          summary: {
            total: merchantIds.length,
            successful: result.success.length,
            failed: result.failed.length
          }
        },
        message: `批量生成完成：成功${result.success.length}个，失败${result.failed.length}个`
      })
      
    } catch (error) {
      console.error('❌ 批量生成二维码失败:', error)
      res.status(500).json({
        success: false,
        message: `批量生成失败: ${error.message}`
      })
    }
  }
  
  /**
   * 验证二维码数据格式
   */
  static async validateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { qrCodeData } = req.body
      
      const isValid = MerchantQRCodeService.validateQRCodeData(qrCodeData)
      
      res.json({
        success: true,
        data: {
          valid: isValid,
          format: isValid ? 'base64 PNG image' : 'invalid format'
        },
        message: isValid ? '二维码格式正确' : '二维码格式错误'
      })
      
    } catch (error) {
      console.error('❌ 验证二维码失败:', error)
      res.status(500).json({
        success: false,
        message: `验证失败: ${error.message}`
      })
    }
  }
}