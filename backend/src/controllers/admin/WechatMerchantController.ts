/**
 * 微信商户管理控制器
 * 用于管理微信支付商户数据和二维码生成
 */

import { Request, Response } from 'express';
import { realWechatApiService } from '../../services/RealWechatApiService';
import { mockWechatApiService } from '../../services/MockWechatApiService';

export class WechatMerchantController {
  /**
   * 获取微信商户列表 - 优先使用真实API，失败时降级到模拟数据
   */
  async getMerchantList(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, offset, status } = req.query;

      console.log('🚀 开始调用真实微信API获取商户列表...');
      
      // 首先尝试真实API
      const realResult = await realWechatApiService.getMerchantList({
        limit: parseInt(limit as string),
        offset: offset as string,
        applyment_state: status === 'completed' ? 'APPLYMENT_STATE_FINISHED' : undefined
      });

      if (realResult.success && realResult.data) {
        res.json({
          success: true,
          data: {
            merchants: realResult.data,
            total: realResult.data.length,
            limit: parseInt(limit as string),
            offset: offset || '0',
            source: realResult.source
          },
          message: '✅ 成功获取真实微信商户数据'
        });
        
        console.log(`✅ 返回 ${realResult.data.length} 个真实商户数据给前端`);
        return;
      }

      // 真实API失败，降级到模拟数据
      console.log('⚠️ 真实微信API不可用，降级使用模拟数据...');
      
      const mockResult = await mockWechatApiService.getMerchantList();
      
      if (mockResult.success && mockResult.data) {
        res.json({
          success: true,
          data: {
            merchants: mockResult.data,
            total: mockResult.data.length,
            limit: parseInt(limit as string),
            offset: offset || '0',
            source: mockResult.source
          },
          message: '⚠️ 微信API暂不可用，返回模拟数据（与页面显示一致）',
          note: '数据结构与真实API完全相同，仅为演示目的'
        });
        
        console.log(`📋 返回 ${mockResult.data.length} 个模拟商户数据给前端`);
      } else {
        res.status(503).json({
          success: false,
          message: '微信API和备用服务均不可用',
          error_type: 'all_services_unavailable'
        });
      }
      
    } catch (error: any) {
      console.error('❌ 获取微信商户列表异常:', error);
      res.status(500).json({
        success: false,
        message: `服务器内部错误: ${error.message}`,
        error_type: 'server_error'
      });
    }
  }

  /**
   * 获取单个商户详情
   */
  async getMerchantDetail(req: Request, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params;

      if (!merchantId) {
        res.status(400).json({
          success: false,
          message: '商户ID不能为空'
        });
        return;
      }

      console.log(`🔍 调用真实微信API获取商户详情: ${merchantId}`);
      const result = await realWechatApiService.getMerchantDetail(merchantId);

      if (result.success && result.data) {
        res.json({
          success: true,
          data: result.data[0],
          source: result.source,
          message: '✅ 成功获取真实商户详情'
        });
      } else {
        res.status(503).json({
          success: false,
          message: `微信API获取商户详情失败: ${result.message}`,
          error_type: 'wechat_api_unavailable'
        });
      }
    } catch (error: any) {
      console.error('获取商户详情错误:', error);
      res.status(500).json({
        success: false,
        message: `服务器错误: ${error.message}`
      });
    }
  }

  /**
   * 同步微信商户数据
   */
  async syncMerchants(req: Request, res: Response): Promise<void> {
    try {
      // 暂时禁用同步功能，专注真实API调用
      const result = { success: false, synced: 0, message: '同步功能暂时禁用，请使用真实API获取数据' };

      if (result.success) {
        res.json({
          success: true,
          data: {
            syncedCount: result.synced
          },
          message: result.message || `成功同步 ${result.synced} 个商户`
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || '同步商户数据失败'
        });
      }
    } catch (error: any) {
      console.error('同步商户数据错误:', error);
      res.status(500).json({
        success: false,
        message: `服务器错误: ${error.message}`
      });
    }
  }

  /**
   * 为微信商户批量生成二维码
   */
  async batchGenerateQRCodes(req: Request, res: Response): Promise<void> {
    try {
      const { merchantIds, qrType = 'miniprogram', fixedAmount } = req.body;

      if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
        res.status(400).json({
          success: false,
          message: '商户ID列表不能为空'
        });
        return;
      }

      // 获取商户列表
      const merchantListResult = await this.wechatMerchantService.queryMerchantApplications();
      
      if (!merchantListResult.success || !merchantListResult.data) {
        res.status(500).json({
          success: false,
          message: '获取商户列表失败'
        });
        return;
      }

      const merchants = merchantListResult.data;
      const qrCodeResults: any[] = [];
      let successCount = 0;
      let failureCount = 0;

      // 为每个商户生成二维码
      for (const merchantId of merchantIds) {
        try {
          const merchant = merchants.find(m => m.merchantId === merchantId);
          
          if (!merchant) {
            qrCodeResults.push({
              merchantId,
              success: false,
              message: '商户不存在'
            });
            failureCount++;
            continue;
          }

          // 这里应该调用二维码生成服务
          // 由于我们已经有了QRCode服务，我们可以生成一个二维码
          const qrCodeData = {
            qrCodeUrl: `https://8.156.84.226/miniprogram/payment?merchantId=${merchantId}&amount=${fixedAmount || 50}`,
            qrCodeData: `pages/payment/index?merchantId=${merchantId}&amount=${fixedAmount || 50}&timestamp=${Date.now()}`,
            qrType,
            merchantInfo: {
              id: merchant.merchantId,
              name: merchant.merchantName,
              applymentId: merchant.applymentId
            },
            fixedAmount: fixedAmount || 50,
            createdAt: new Date().toISOString()
          };

          qrCodeResults.push({
            merchantId,
            success: true,
            data: qrCodeData,
            merchantName: merchant.merchantName
          });
          successCount++;

        } catch (error: any) {
          qrCodeResults.push({
            merchantId,
            success: false,
            message: error.message
          });
          failureCount++;
        }
      }

      res.json({
        success: true,
        data: {
          results: qrCodeResults,
          summary: {
            total: merchantIds.length,
            success: successCount,
            failure: failureCount
          }
        },
        message: `批量生成完成: 成功 ${successCount} 个，失败 ${failureCount} 个`
      });

    } catch (error: any) {
      console.error('批量生成二维码错误:', error);
      res.status(500).json({
        success: false,
        message: `服务器错误: ${error.message}`
      });
    }
  }

  /**
   * 获取商户统计信息
   */
  async getMerchantStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.wechatMerchantService.queryMerchantApplications();

      if (!result.success || !result.data) {
        res.status(500).json({
          success: false,
          message: '获取商户数据失败'
        });
        return;
      }

      const merchants = result.data;
      const stats = {
        total: merchants.length,
        completed: merchants.filter(m => m.status === '已完成').length,
        auditing: merchants.filter(m => m.status === '审核中').length,
        rejected: merchants.filter(m => m.status === '已驳回').length,
        others: merchants.filter(m => !['已完成', '审核中', '已驳回'].includes(m.status)).length,
        recentlyCreated: merchants.filter(m => {
          if (!m.createdAt) return false;
          const createdDate = new Date(m.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdDate > sevenDaysAgo;
        }).length
      };

      res.json({
        success: true,
        data: stats,
        message: '获取商户统计成功'
      });

    } catch (error: any) {
      console.error('获取商户统计错误:', error);
      res.status(500).json({
        success: false,
        message: `服务器错误: ${error.message}`
      });
    }
  }
}

// 导出控制器实例
export const wechatMerchantController = new WechatMerchantController();
