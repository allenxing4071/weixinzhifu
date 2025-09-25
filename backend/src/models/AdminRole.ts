// 管理员角色数据模型

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Admin } from './Admin'

// 权限枚举
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

@Entity('admin_roles')
export class AdminRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true, length: 50 })
  roleName!: string

  @Column({ unique: true, length: 50 })
  roleCode!: string

  @Column({ nullable: true, length: 200 })
  description?: string

  @Column('simple-json')
  permissions!: Permission[]

  @Column({ 
    type: 'enum', 
    enum: ['active', 'inactive'],
    default: 'active'
  })
  status!: 'active' | 'inactive'

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // 关联关系
  @OneToMany(() => Admin, admin => admin.role)
  admins!: Admin[]
}
