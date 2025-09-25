/**
 * 真实微信支付API服务
 * 专门用于调用真实的微信支付接口，不包含任何模拟数据
 */

import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config/index';

export interface WechatMerchantInfo {
  applymentId: string;
  merchantName: string;
  merchantId: string;
  status: string;
  contactPerson?: string;
  contactPhone?: string;
  businessLicense?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WechatApiResponse {
  success: boolean;
  data?: WechatMerchantInfo[];
  message?: string;
  source: 'wechat_api' | 'api_error';
}

export class RealWechatApiService {
  private apiConfig: {
    appId: string;
    mchId: string;
    apiV3Key: string;
    privateKey: string;
    serialNo: string;
    apiBase: string;
  };

  constructor() {
    this.apiConfig = {
      appId: config.wechat.appId,
      mchId: config.wechat.mchId,
      apiV3Key: config.wechat.apiV3Key,
      privateKey: this.loadPrivateKey(),
      serialNo: '5720F14DB19CE57B8B7127DF3D93D586F0412433', // 新证书序列号
      apiBase: 'https://api.mch.weixin.qq.com'
    };
    
    console.log('🔧 初始化真实微信API服务...');
    console.log(`📱 AppID: ${this.apiConfig.appId}`);
    console.log(`🏪 商户号: ${this.apiConfig.mchId}`);
    console.log(`🔑 API密钥: ${this.apiConfig.apiV3Key?.substring(0, 8)}...`);
    console.log(`🔐 证书序列号: ${this.apiConfig.serialNo}`);
  }

  /**
   * 加载私钥文件
   */
  private loadPrivateKey(): string {
    try {
      // 优先使用新的私钥文件
      const newKeyPath = './backend/certs/wechat_private_key.pem';
      if (fs.existsSync(newKeyPath)) {
        return fs.readFileSync(newKeyPath, 'utf8');
      }
      
      // 备用：使用配置中的路径
      const keyPath = config.wechat.privateKey;
      if (keyPath?.startsWith('./')) {
        const fullPath = `${process.cwd()}/${keyPath}`;
        return fs.readFileSync(fullPath, 'utf8');
      }
      return keyPath || '';
    } catch (error) {
      console.error('❌ 加载私钥失败:', error);
      throw new Error('微信支付私钥加载失败，请检查证书文件');
    }
  }

  /**
   * 生成微信支付API签名
   */
  private generateSignature(
    method: string,
    url: string,
    timestamp: string,
    nonce: string,
    body: string = ''
  ): string {
    const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
    
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(message);
      return sign.sign(this.apiConfig.privateKey, 'base64');
    } catch (error) {
      console.error('❌ 签名生成失败:', error);
      throw new Error('微信支付签名生成失败');
    }
  }

  /**
   * 生成请求头
   */
  private generateHeaders(method: string, url: string, body: string = ''): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = this.generateSignature(method, url, timestamp, nonce, body);

    return {
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.apiConfig.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.apiConfig.serialNo}"`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'WeixinZhifu-PointsSystem/1.0.0'
    };
  }

  /**
   * 调用真实微信API获取商户列表
   */
  async getMerchantList(params: {
    limit?: number;
    offset?: string;
    applyment_state?: string;
  } = {}): Promise<WechatApiResponse> {
    try {
      const url = '/v3/applyment4sub/applyment';
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.applyment_state) queryParams.append('applyment_state', params.applyment_state);

      const queryString = queryParams.toString();
      const fullUrl = `${this.apiConfig.apiBase}${url}${queryString ? '?' + queryString : ''}`;
      const requestUrl = `${url}${queryString ? '?' + queryString : ''}`;
      
      console.log(`🚀 调用真实微信API: ${fullUrl}`);
      
      const headers = this.generateHeaders('GET', requestUrl);
      
      const response: AxiosResponse = await axios.get(fullUrl, {
        headers,
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      console.log(`📡 微信API响应状态: ${response.status}`);
      
      if (response.status === 200 && response.data) {
        const merchants = this.parseWechatResponse(response.data);
        
        console.log(`✅ 成功获取 ${merchants.length} 个真实商户数据`);
        
        return {
          success: true,
          data: merchants,
          source: 'wechat_api'
        };
      } else if (response.status === 401) {
        throw new Error('微信API认证失败，请检查证书和签名配置');
      } else if (response.status === 403) {
        throw new Error('微信API权限不足，请检查商户号权限');
      } else {
        throw new Error(`微信API返回错误状态: ${response.status}`);
      }

    } catch (error: any) {
      console.error('❌ 真实微信API调用失败:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: '无法连接到微信支付服务器，请检查网络连接',
          source: 'api_error'
        };
      } else if (error.response) {
        return {
          success: false,
          message: `微信API错误: ${error.response.status} - ${error.response.data?.message || error.message}`,
          source: 'api_error'
        };
      } else {
        return {
          success: false,
          message: `API调用异常: ${error.message}`,
          source: 'api_error'
        };
      }
    }
  }

  /**
   * 解析微信API响应数据
   */
  private parseWechatResponse(responseData: any): WechatMerchantInfo[] {
    if (!responseData.data || !Array.isArray(responseData.data)) {
      console.log('⚠️ 微信API返回数据格式异常');
      return [];
    }

    return responseData.data.map((item: any) => ({
      applymentId: item.applyment_id || '',
      merchantName: item.business_info?.merchant_name || '',
      merchantId: item.sub_mchid || '',
      status: this.translateStatus(item.applyment_state),
      contactPerson: item.contact_info?.contact_name || '',
      contactPhone: item.contact_info?.mobile_phone || '',
      businessLicense: item.business_info?.business_license_number || '',
      createdAt: item.create_time || '',
      updatedAt: item.update_time || ''
    }));
  }

  /**
   * 状态转换
   */
  private translateStatus(wechatStatus: string): string {
    const statusMap: Record<string, string> = {
      'APPLYMENT_STATE_EDITTING': '编辑中',
      'APPLYMENT_STATE_AUDITING': '审核中',
      'APPLYMENT_STATE_REJECTED': '已驳回',
      'APPLYMENT_STATE_TO_BE_CONFIRMED': '待确认',
      'APPLYMENT_STATE_TO_BE_SIGNED': '待签约',
      'APPLYMENT_STATE_SIGNING': '开通权限中',
      'APPLYMENT_STATE_FINISHED': '已完成',
      'APPLYMENT_STATE_CANCELED': '已作废'
    };

    return statusMap[wechatStatus] || wechatStatus;
  }

  /**
   * 获取单个商户详情
   */
  async getMerchantDetail(merchantId: string): Promise<WechatApiResponse> {
    try {
      const url = `/v3/applyment4sub/applyment/sub_mchid/${merchantId}`;
      const fullUrl = `${this.apiConfig.apiBase}${url}`;
      
      console.log(`🔍 查询商户详情: ${merchantId}`);
      
      const headers = this.generateHeaders('GET', url);
      
      const response = await axios.get(fullUrl, {
        headers,
        timeout: 10000
      });

      if (response.status === 200 && response.data) {
        const merchant = this.parseWechatResponse({ data: [response.data] })[0];
        
        return {
          success: true,
          data: [merchant],
          source: 'wechat_api'
        };
      }

      throw new Error('获取商户详情失败');

    } catch (error: any) {
      console.error(`❌ 获取商户 ${merchantId} 详情失败:`, error.message);
      
      return {
        success: false,
        message: `获取商户详情失败: ${error.message}`,
        source: 'api_error'
      };
    }
  }
}

export const realWechatApiService = new RealWechatApiService();
