// 管理员用户模型 - 完整版本
export interface AdminUser {
  id: string
  username: string
  email?: string
  phone?: string
  realName?: string
  status: 'active' | 'inactive' | 'locked'
  roleId?: string
  roleName?: string
  role?: string
  roleCode?: string
  permissions?: string[]
  dataScope?: string
  passwordHash?: string
  password?: string
  failedLoginCount?: number
  lockedUntil?: Date
  lastLoginAt?: Date
  lastLoginIp?: string
  createdAt: Date
  updatedAt: Date
}

export class AdminUserModel {
  static async findByUsername(username: string): Promise<AdminUser | null> {
    // 临时返回模拟数据用于测试
    if (username === 'admin') {
      return {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@example.com',
        realName: '系统管理员',
        status: 'active',
        roleId: 'role-admin',
        roleName: '超级管理员',
        role: 'admin',
        passwordHash: '$2a$12$hashedPassword',
        failedLoginCount: 0,
        permissions: ['user:read', 'user:write', 'merchant:read', 'merchant:write', 'order:read', 'order:write'],
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    return null
  }

  static async findById(id: string): Promise<AdminUser | null> {
    if (id === 'admin-1') {
      return await this.findByUsername('admin')
    }
    return null
  }

  static async validatePassword(username: string, password: string): Promise<boolean> {
    // 临时简单验证
    return username === 'admin' && password === 'admin123'
  }

  static async updateFailedLoginCount(username: string, count: number): Promise<void> {
    console.log(`更新失败登录次数: ${username} = ${count}`)
  }

  static async lockUser(username: string, until: Date): Promise<void> {
    console.log(`锁定用户: ${username} 直到 ${until}`)
  }

  static async unlockUser(username: string): Promise<void> {
    console.log(`解锁用户: ${username}`)
  }

  static async updateLoginInfo(username: string, info: any): Promise<void> {
    console.log(`更新登录信息: ${username}`, info)
  }

  static async updatePassword(id: string, passwordHash: string): Promise<void> {
    console.log(`更新密码: ${id}`)
  }
}