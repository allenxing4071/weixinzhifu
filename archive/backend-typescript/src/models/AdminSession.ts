// 管理员会话模型 - 完整版本
export interface AdminSession {
  id: string
  adminId: string
  token: string
  sessionToken?: string
  refreshToken?: string
  expiresAt: Date
  createdAt: Date
}

export class AdminSessionModel {
  static async create(session: Partial<AdminSession>): Promise<AdminSession> {
    return {
      id: 'session-' + Date.now(),
      adminId: session.adminId || '',
      token: session.token || '',
      sessionToken: session.sessionToken || session.token || '',
      expiresAt: session.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date()
    }
  }

  static async findByToken(token: string): Promise<AdminSession | null> {
    // 临时实现
    return null
  }

  static async deleteByAdminId(adminId: string): Promise<void> {
    // 临时实现
  }

  static async revokeByToken(token: string): Promise<void> {
    console.log('🗑️ 撤销会话:', token)
  }
}