import { PointsService } from '../../services/PointsService'
import { UserModel } from '../../models/User'
import { PointsRecordModel } from '../../models/PointsRecord'

// Mock依赖
jest.mock('../../models/User')
jest.mock('../../models/PointsRecord')
jest.mock('../../config/database')

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>
const mockPointsRecordModel = PointsRecordModel as jest.Mocked<typeof PointsRecordModel>

describe('PointsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('awardPoints', () => {
    it('应该成功发放积分', async () => {
      // Arrange
      const userId = 'test_user_001'
      const points = 100
      const currentBalance = 50
      const newBalance = 150

      mockUserModel.findById.mockResolvedValue({
        id: userId,
        pointsBalance: currentBalance
      } as any)
      
      mockUserModel.updatePointsBalance.mockResolvedValue(true)
      mockPointsRecordModel.create.mockResolvedValue({} as any)

      // Act
      await PointsService.awardPoints(
        userId,
        points,
        'payment_reward',
        '测试积分发放'
      )

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId)
      expect(mockUserModel.updatePointsBalance).toHaveBeenCalledWith(userId, newBalance)
      expect(mockPointsRecordModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          pointsChange: points,
          pointsBalance: newBalance,
          source: 'payment_reward',
          description: '测试积分发放'
        })
      )
    })

    it('应该拒绝发放零积分或负积分', async () => {
      // Act & Assert
      await expect(
        PointsService.awardPoints('test_user', 0, 'payment_reward', '测试')
      ).rejects.toThrow('积分数量必须大于0')
      
      await expect(
        PointsService.awardPoints('test_user', -10, 'payment_reward', '测试')
      ).rejects.toThrow('积分数量必须大于0')
    })

    it('应该在用户不存在时抛出错误', async () => {
      // Arrange
      mockUserModel.findById.mockResolvedValue(null)

      // Act & Assert
      await expect(
        PointsService.awardPoints('invalid_user', 100, 'payment_reward', '测试')
      ).rejects.toThrow('用户不存在')
    })
  })

  describe('getUserPointsBalance', () => {
    it('应该返回正确的积分余额信息', async () => {
      // Arrange
      const userId = 'test_user_001'
      const mockUser = {
        id: userId,
        pointsBalance: 500
      }

      mockUserModel.findById.mockResolvedValue(mockUser as any)

      // Mock数据库查询结果
      const mockConnection = {
        execute: jest.fn()
          .mockResolvedValueOnce([[{ totalEarned: 1000 }]]) // 总获得
          .mockResolvedValueOnce([[{ totalSpent: 500 }]])   // 总消费
          .mockResolvedValueOnce([[{ expiringPoints: 100 }]]) // 即将过期
      }

      const { getDBConnection } = require('../../config/database')
      getDBConnection.mockResolvedValue(mockConnection)

      // Act
      const result = await PointsService.getUserPointsBalance(userId)

      // Assert
      expect(result).toEqual({
        balance: 500,
        totalEarned: 1000,
        totalSpent: 500,
        expiringPoints: 100
      })
    })
  })

  describe('consumePoints', () => {
    it('应该成功消费积分', async () => {
      // Arrange
      const userId = 'test_user_001'
      const pointsToConsume = 50
      const currentBalance = 100
      const newBalance = 50

      mockUserModel.findById.mockResolvedValue({
        id: userId,
        pointsBalance: currentBalance
      } as any)
      
      mockUserModel.updatePointsBalance.mockResolvedValue(true)
      mockPointsRecordModel.create.mockResolvedValue({} as any)

      // Act
      await PointsService.consumePoints(
        userId,
        pointsToConsume,
        '测试积分消费'
      )

      // Assert
      expect(mockUserModel.updatePointsBalance).toHaveBeenCalledWith(userId, newBalance)
      expect(mockPointsRecordModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          pointsChange: -pointsToConsume,
          pointsBalance: newBalance,
          source: 'mall_consumption'
        })
      )
    })

    it('应该在余额不足时拒绝消费', async () => {
      // Arrange
      mockUserModel.findById.mockResolvedValue({
        id: 'test_user',
        pointsBalance: 30
      } as any)

      // Act & Assert
      await expect(
        PointsService.consumePoints('test_user', 50, '测试消费')
      ).rejects.toThrow('积分余额不足')
    })
  })
})
