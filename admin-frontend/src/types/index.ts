// 积分管理后台 - TypeScript类型定义

// ============= 基础类型 =============

export interface ApiResponse<T = any> {
  success: boolean
  code?: string
  message: string
  data?: T
  timestamp?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface SearchParams {
  keyword?: string
  startDate?: string
  endDate?: string
  status?: string
  [key: string]: any
}

// ============= 用户相关类型 =============

export interface User {
  id: string
  wechatId: string
  openid: string
  unionid?: string
  nickname: string
  avatar?: string
  phone?: string
  pointsBalance: number
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  updatedAt: string
}

export interface UserListParams extends PaginationParams {
  keyword?: string
  status?: string
  pointsMin?: number
  pointsMax?: number
  startDate?: string
  endDate?: string
}

export interface UserPointsStats {
  balance: number
  totalEarned: number
  totalSpent: number
  expiringPoints: number
}

// ============= 商户相关类型 =============

export interface Merchant {
  id: string
  merchantName: string
  merchantNo: string
  contactPerson: string
  contactPhone: string
  businessLicense: string
  status: 'active' | 'inactive' | 'pending'
  qrCode?: string
  totalAmount: number
  totalOrders: number
  createdAt: string
  updatedAt: string
}

export interface MerchantListParams extends PaginationParams {
  keyword?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface MerchantStats {
  totalAmount: number
  totalOrders: number
  todayAmount: number
  todayOrders: number
  avgOrderAmount: number
  customerCount: number
}

// ============= 订单相关类型 =============

export interface PaymentOrder {
  id: string
  orderNo: string
  userId: string
  merchantId: string
  amount: number
  pointsAwarded: number
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded'
  paymentMethod: 'wechat'
  transactionId?: string
  description: string
  paidAt?: string
  expiredAt: string
  createdAt: string
  updatedAt: string
  user?: User
  merchant?: Merchant
}

export interface OrderListParams extends PaginationParams {
  keyword?: string
  status?: string
  paymentMethod?: string
  merchantId?: string
  amountMin?: number
  amountMax?: number
  startDate?: string
  endDate?: string
}

// ============= 积分相关类型 =============

export interface PointsRecord {
  id: string
  userId: string
  orderId?: string
  pointsChange: number
  pointsBalance: number
  source: 'payment_reward' | 'mall_consumption' | 'admin_adjust' | 'expired_deduct'
  description: string
  expiresAt?: string
  createdAt: string
  user?: User
  order?: PaymentOrder
}

export interface PointsRecordParams extends PaginationParams {
  userId?: string
  source?: string
  startDate?: string
  endDate?: string
  pointsMin?: number
  pointsMax?: number
}

export interface PointsConfig {
  ratio: number
  expiryDays: number
  maxDaily: number
  maxAdjust: number
  expireNotifyDays: number
  autoCleanExpired: boolean
  freezeDetection: boolean
}

// ============= 管理员相关类型 =============

export interface Admin {
  id: string
  username: string
  realName: string
  email?: string
  phone?: string
  roleId: string
  roleName: string
  status: 'active' | 'inactive' | 'locked'
  lastLoginAt?: string
  lastLoginIp?: string
  createdAt: string
  updatedAt: string
}

export interface AdminRole {
  id: string
  roleName: string
  roleCode: string
  description?: string
  permissions: Permission[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export enum Permission {
  // 用户管理
  USER_VIEW = 'user:view',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_POINTS_ADJUST = 'user:points:adjust',
  
  // 商户管理
  MERCHANT_VIEW = 'merchant:view',
  MERCHANT_APPROVE = 'merchant:approve',
  MERCHANT_EDIT = 'merchant:edit',
  MERCHANT_DELETE = 'merchant:delete',
  
  // 积分管理
  POINTS_VIEW = 'points:view',
  POINTS_ADJUST = 'points:adjust',
  POINTS_CONFIG = 'points:config',
  POINTS_STATS = 'points:stats',
  
  // 订单管理
  ORDER_VIEW = 'order:view',
  ORDER_REFUND = 'order:refund',
  ORDER_EDIT = 'order:edit',
  
  // 财务管理
  FINANCE_VIEW = 'finance:view',
  FINANCE_EXPORT = 'finance:export',
  FINANCE_STATS = 'finance:stats',
  
  // 系统管理
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_MONITOR = 'system:monitor',
  SYSTEM_BACKUP = 'system:backup',
  
  // 权限管理
  ADMIN_VIEW = 'admin:view',
  ADMIN_CREATE = 'admin:create',
  ADMIN_EDIT = 'admin:edit',
  ADMIN_DELETE = 'admin:delete',
  ROLE_MANAGE = 'role:manage'
}

export interface AdminLoginRequest {
  username: string
  password: string
  captcha?: string
}

export interface AdminLoginResponse {
  token: string
  adminInfo: {
    id: string
    username: string
    realName: string
    role: string
    permissions: Permission[]
  }
}

// ============= 统计数据类型 =============

export interface DashboardStats {
  overview: {
    totalUsers: number
    activeUsers: number
    totalMerchants: number
    activeMerchants: number
    todayOrders: number
    todayAmount: number
    todayPoints: number
    todayNewUsers: number
  }
  trends: {
    userGrowth: TrendData[]
    paymentTrend: TrendData[]
    pointsTrend: TrendData[]
  }
  alerts: AlertItem[]
}

export interface TrendData {
  date: string
  value: number
  label?: string
}

export interface AlertItem {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  value?: string | number
  time: string
  handled: boolean
}

// ============= 图表数据类型 =============

export interface ChartData {
  xAxis: string[]
  series: ChartSeries[]
}

export interface ChartSeries {
  name: string
  data: number[]
  color?: string
  type?: 'line' | 'bar' | 'area'
}

export interface PieChartData {
  name: string
  value: number
  color?: string
}

// ============= 系统配置类型 =============

export interface SystemConfig {
  systemName: string
  systemVersion: string
  maintenanceMode: boolean
  debugMode: boolean
  wechatAppId: string
  wechatMchId: string
  notifyUrl: string
}

export interface SystemMonitor {
  server: {
    cpu: number
    memory: number
    disk: number
    network: string
  }
  application: {
    responseTime: number
    errorRate: number
    concurrentUsers: number
    apiCalls: number
  }
  database: {
    connections: number
    queryTime: number
    storage: number
  }
}

// ============= 操作日志类型 =============

export interface AdminLog {
  id: string
  adminId: string
  adminName: string
  action: string
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface LogListParams extends PaginationParams {
  adminId?: string
  action?: string
  startDate?: string
  endDate?: string
  ipAddress?: string
}

// ============= 表单类型 =============

export interface AdjustPointsForm {
  points: number
  type: 'add' | 'subtract'
  reason: string
  notify: boolean
}

export interface MerchantApprovalForm {
  approved: boolean
  comment: string
  notifyMerchant: boolean
}

export interface CreateAdminForm {
  username: string
  password: string
  confirmPassword: string
  realName: string
  email?: string
  phone?: string
  roleId: string
}

// ============= 通用组件Props类型 =============

export interface TableColumn<T = any> {
  key: string
  title: string
  dataIndex: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sorter?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
  filters?: { text: string; value: any }[]
}

export interface StatsCardProps {
  title: string
  value: number | string
  trend?: {
    value: number
    type: 'up' | 'down'
    period: string
  }
  icon?: React.ReactNode
  color?: string
  loading?: boolean
  precision?: number
  prefix?: string
  suffix?: string
}

export interface ChartContainerProps {
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: ChartData | PieChartData[]
  height?: number
  loading?: boolean
  refreshInterval?: number
  onRefresh?: () => void
  showLegend?: boolean
  showToolbox?: boolean
}

// ============= 路由和菜单类型 =============

export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  permissions?: Permission[]
  hidden?: boolean
}

export interface BreadcrumbItem {
  title: string
  path?: string
}

// ============= 通用工具类型 =============

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface AsyncState<T> {
  data: T | null
  loading: LoadingState
  error: string | null
  lastFetch?: number
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
