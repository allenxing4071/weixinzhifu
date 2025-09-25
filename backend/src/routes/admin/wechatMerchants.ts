/**
 * 微信商户管理路由
 */

import { Router } from 'express';
import { wechatMerchantController } from '../../controllers/admin/WechatMerchantController';
import { authenticateAdminJWT } from '../../middleware/admin/adminAuth';

const router = Router();

// 获取微信商户列表
router.get('/', authenticateAdminJWT, async (req, res) => {
  await wechatMerchantController.getMerchantList(req, res);
});

// 获取商户统计信息
router.get('/stats', authenticateAdminJWT, async (req, res) => {
  await wechatMerchantController.getMerchantStats(req, res);
});

// 同步微信商户数据
router.post('/sync', authenticateAdminJWT, async (req, res) => {
  await wechatMerchantController.syncMerchants(req, res);
});

// 批量生成商户二维码
router.post('/qrcode/batch', authenticateAdminJWT, async (req, res) => {
  await wechatMerchantController.batchGenerateQRCodes(req, res);
});

// 获取单个商户详情
router.get('/:merchantId', authenticateAdminJWT, async (req, res) => {
  await wechatMerchantController.getMerchantDetail(req, res);
});

export default router;
