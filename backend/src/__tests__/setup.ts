/**
 * Jest测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.WECHAT_APP_ID = 'test-app-id'
process.env.WECHAT_APP_SECRET = 'test-app-secret'
process.env.WECHAT_MCH_ID = 'test-mch-id'
process.env.WECHAT_API_KEY = 'test-api-key'

// Mock数据库连接
jest.mock('../config/database', () => ({
  getDBConnection: jest.fn().mockResolvedValue({
    execute: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn()
  }),
  getRedisClient: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    ping: jest.fn()
  }),
  initDatabase: jest.fn()
}))

// 全局测试工具
(global as any).testUtils = {
  // 创建测试用户数据
  createTestUser: (overrides = {}) => ({
    id: 'test_user_001',
    wechatId: 'wx_test_001',
    openid: 'test_openid_001',
    nickname: '测试用户',
    avatar: 'https://example.com/avatar.jpg',
    pointsBalance: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // 创建测试订单数据
  createTestOrder: (overrides = {}) => ({
    id: 'test_order_001',
    orderNo: 'NO1234567890',
    userId: 'test_user_001',
    merchantId: 'test_merchant_001',
    amount: 10000, // 100元
    pointsAwarded: 0,
    status: 'pending',
    paymentMethod: 'wechat',
    description: '测试订单',
    expiredAt: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // 创建测试积分记录
  createTestPointsRecord: (overrides = {}) => ({
    id: 'test_points_001',
    userId: 'test_user_001',
    orderId: 'test_order_001',
    pointsChange: 100,
    pointsBalance: 100,
    source: 'payment_reward',
    description: '测试积分发放',
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    ...overrides
  })
}

// 全局清理
afterEach(() => {
  jest.clearAllMocks()
})
