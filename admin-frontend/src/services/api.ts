// 积分管理后台 - API服务层

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { 
  ApiResponse, 
  DashboardStats, 
  User, 
  UserListParams,
  UserPointsStats,
  Merchant,
  MerchantListParams,
  MerchantStats,
  PaymentOrder,
  OrderListParams,
  PointsRecord,
  PointsRecordParams,
  PointsConfig,
  Admin,
  AdminLoginRequest,
  AdminLoginResponse,
  AdminLog,
  LogListParams,
  SystemConfig,
  SystemMonitor,
  AdjustPointsForm,
  MerchantApprovalForm,
  PaginationParams,
  CreateAdminForm
} from '../types'

// API基础配置
class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: '/api/v1',  // 使用相对路径，通过Nginx代理到后端
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器 - 添加认证token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器 - 统一错误处理
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response
        
        // API返回success:false时的错误处理
        if (!data.success) {
          message.error(data.message || 'API请求失败')
          return Promise.reject(new Error(data.message))
        }
        
        return response
      },
      (error) => {
        // 网络错误或HTTP状态错误
        if (error.response) {
          const status = error.response.status
          const message_text = error.response.data?.message || '请求失败'
          
          switch (status) {
            case 401:
              message.error('登录已过期，请重新登录')
              localStorage.removeItem('admin_token')
              window.location.href = '/login'
              break
            case 403:
              message.error('权限不足，无法执行此操作')
              break
            case 404:
              message.error('请求的接口不存在')
              break
            case 500:
              message.error('服务器内部错误，请联系技术支持')
              break
            default:
              message.error(message_text)
          }
        } else if (error.request) {
          message.error('网络连接失败，请检查网络状态')
        } else {
          message.error('请求配置错误')
        }
        
        return Promise.reject(error)
      }
    )
  }

  // 通用请求方法
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.request<ApiResponse<T>>(config)
    return response.data.data as T
  }

  // GET请求
  async get<T>(url: string, params?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url, params })
  }

  // POST请求
  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url, data })
  }

  // PUT请求
  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data })
  }

  // DELETE请求
  async delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url })
  }
}

// 创建API客户端实例
const apiClient = new ApiClient()

// ============= 认证相关API =============

export const authApi = {
  // 管理员登录
  login: (data: AdminLoginRequest): Promise<AdminLoginResponse> =>
    apiClient.post('/admin/auth/login', data),

  // 获取当前管理员信息
  getCurrentAdmin: (): Promise<Admin> =>
    apiClient.get('/admin/auth/me'),

  // 管理员登出
  logout: (): Promise<void> =>
    apiClient.post('/admin/auth/logout'),

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }): Promise<void> =>
    apiClient.post('/admin/auth/change-password', data)
}

// ============= 仪表板相关API =============

export const dashboardApi = {
  // 获取仪表板统计数据
  getStats: (): Promise<DashboardStats> =>
    apiClient.get('/admin/dashboard/stats'),

  // 获取实时监控数据
  getMonitor: (): Promise<SystemMonitor> =>
    apiClient.get('/admin/dashboard/monitor'),

  // 获取待处理事项
  getTodos: (): Promise<any[]> =>
    apiClient.get('/admin/dashboard/todos')
}

// ============= 用户管理API =============

export const userApi = {
  // 获取用户列表
  getUsers: (params: UserListParams): Promise<{ list: User[]; total: number }> =>
    apiClient.get('/admin/users', params),

  // 获取用户详情
  getUserDetail: (id: string): Promise<User> =>
    apiClient.get(`/admin/users/${id}`),

  // 获取用户积分统计
  getUserPointsStats: (id: string): Promise<UserPointsStats> =>
    apiClient.get(`/admin/users/${id}/points/stats`),

  // 调整用户积分
  adjustUserPoints: (id: string, data: AdjustPointsForm): Promise<void> =>
    apiClient.post(`/admin/users/${id}/points/adjust`, data),

  // 更新用户状态
  updateUserStatus: (id: string, status: string): Promise<void> =>
    apiClient.put(`/admin/users/${id}/status`, { status }),

  // 获取用户积分记录
  getUserPointsHistory: (id: string, params: PointsRecordParams): Promise<{ list: PointsRecord[]; total: number }> =>
    apiClient.get(`/admin/users/${id}/points/history`, params),

  // 导出用户数据
  exportUsers: (params: UserListParams): Promise<Blob> =>
    apiClient.get('/admin/users/export', params)
}

// ============= 商户管理API (新版本 - 连接到专门的商户后端) =============

export const merchantApi = {
  // 获取商户统计数据
  getMerchantStats: (): Promise<any> =>
    apiClient.get('/admin/merchants/stats'),

  // 获取商户列表 (新API结构)
  getMerchants: (params: any = {}): Promise<{ merchants: Merchant[]; pagination: any }> =>
    apiClient.get('/admin/merchants', params),

  // 获取商户详情
  getMerchantDetail: (id: string): Promise<{ merchant: Merchant; qrCodeEligibility: any }> =>
    apiClient.get(`/admin/merchants/${id}`),

  // 创建新商户
  createMerchant: (data: any): Promise<{ merchant: Merchant }> =>
    apiClient.post('/admin/merchants', data),

  // 更新商户信息
  updateMerchant: (id: string, data: any): Promise<{ merchant: Merchant }> =>
    apiClient.put(`/admin/merchants/${id}`, data),

  // 删除商户 (软删除)
  deleteMerchant: (id: string): Promise<void> =>
    apiClient.delete(`/admin/merchants/${id}`),

  // 检查二维码生成资格
  checkQRCodeEligibility: (id: string): Promise<any> =>
    apiClient.get(`/admin/merchants/${id}/qr-eligibility`),

  // 生成商户二维码 (保留原有接口)
  generateQRCode: (id: string): Promise<{ qrCode: string }> =>
    apiClient.post(`/admin/merchants/${id}/qrcode`),

  // 更新商户状态 (通过updateMerchant实现)
  updateMerchantStatus: (id: string, status: string): Promise<{ merchant: Merchant }> =>
    merchantApi.updateMerchant(id, { status }),

  // 导出商户数据 (暂时保留接口)
  exportMerchants: (params: any): Promise<Blob> =>
    apiClient.get('/admin/merchants/export', params)
}

// ============= 订单管理API =============

export const orderApi = {
  // 获取订单列表
  getOrders: (params: OrderListParams): Promise<{ list: PaymentOrder[]; total: number }> =>
    apiClient.get('/admin/orders', params),

  // 获取订单详情
  getOrderDetail: (id: string): Promise<PaymentOrder> =>
    apiClient.get(`/admin/orders/${id}`),

  // 处理退款
  processRefund: (id: string, data: { reason: string; amount?: number }): Promise<void> =>
    apiClient.post(`/admin/orders/${id}/refund`, data),

  // 更新订单状态
  updateOrderStatus: (id: string, status: string): Promise<void> =>
    apiClient.put(`/admin/orders/${id}/status`, { status }),

  // 导出订单数据
  exportOrders: (params: OrderListParams): Promise<Blob> =>
    apiClient.get('/admin/orders/export', params)
}

// ============= 积分管理API =============

export const pointsApi = {
  // 获取积分统计
  getPointsStats: (params?: { startDate?: string; endDate?: string }): Promise<any> =>
    apiClient.get('/admin/points/stats', params),

  // 获取积分记录
  getPointsRecords: (params: PointsRecordParams): Promise<{ list: PointsRecord[]; total: number }> =>
    apiClient.get('/admin/points/records', params),

  // 获取积分配置
  getPointsConfig: (): Promise<PointsConfig> =>
    apiClient.get('/admin/points/config'),

  // 更新积分配置
  updatePointsConfig: (data: PointsConfig): Promise<void> =>
    apiClient.put('/admin/points/config', data),

  // 批量调整积分
  batchAdjustPoints: (data: { userIds: string[]; points: number; reason: string }): Promise<void> =>
    apiClient.post('/admin/points/batch-adjust', data),

  // 导出积分记录
  exportPointsRecords: (params: PointsRecordParams): Promise<Blob> =>
    apiClient.get('/admin/points/records/export', params)
}

// ============= 系统管理API =============

export const systemApi = {
  // 获取系统配置
  getSystemConfig: (): Promise<SystemConfig> =>
    apiClient.get('/admin/system/config'),

  // 更新系统配置
  updateSystemConfig: (data: Partial<SystemConfig>): Promise<void> =>
    apiClient.put('/admin/system/config', data),

  // 获取系统监控数据
  getSystemMonitor: (): Promise<SystemMonitor> =>
    apiClient.get('/admin/system/monitor'),

  // 获取操作日志
  getAdminLogs: (params: LogListParams): Promise<{ list: AdminLog[]; total: number }> =>
    apiClient.get('/admin/system/logs', params),

  // 数据库备份
  backupDatabase: (): Promise<{ backupFile: string }> =>
    apiClient.post('/admin/system/backup'),

  // 清理日志
  cleanLogs: (data: { days: number }): Promise<void> =>
    apiClient.post('/admin/system/clean-logs', data)
}

// ============= 管理员管理API =============

export const adminApi = {
  // 获取管理员列表
  getAdmins: (params: PaginationParams): Promise<{ list: Admin[]; total: number }> =>
    apiClient.get('/admin/admins', params),

  // 创建管理员
  createAdmin: (data: CreateAdminForm): Promise<void> =>
    apiClient.post('/admin/admins', data),

  // 更新管理员信息
  updateAdmin: (id: string, data: Partial<Admin>): Promise<void> =>
    apiClient.put(`/admin/admins/${id}`, data),

  // 删除管理员
  deleteAdmin: (id: string): Promise<void> =>
    apiClient.delete(`/admin/admins/${id}`),

  // 重置管理员密码
  resetAdminPassword: (id: string, password: string): Promise<void> =>
    apiClient.post(`/admin/admins/${id}/reset-password`, { password })
}

// 导出默认API客户端
export default apiClient
