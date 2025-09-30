// 管理员操作日志模型 - 完整版本
export interface AdminOperationLog {
  id: string
  adminId: string
  adminName?: string
  operation: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

export class AdminOperationLogModel {
  static async create(log: Partial<AdminOperationLog>): Promise<void> {
    // 临时实现 - 只打印日志
    console.log('Admin Operation:', log)
  }
}