// 管理员数据模型

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { AdminRole } from './AdminRole'

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true, length: 50 })
  username!: string

  @Column()
  password!: string

  @Column({ length: 50 })
  realName!: string

  @Column({ nullable: true, length: 100 })
  email?: string

  @Column({ nullable: true, length: 20 })
  phone?: string

  @Column('uuid')
  roleId!: string

  @Column({ 
    type: 'enum', 
    enum: ['active', 'inactive', 'locked'],
    default: 'active'
  })
  status!: 'active' | 'inactive' | 'locked'

  @Column({ nullable: true })
  lastLoginAt?: Date

  @Column({ nullable: true, length: 45 })
  lastLoginIp?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // 关联关系
  @ManyToOne(() => AdminRole, { eager: false })
  @JoinColumn({ name: 'roleId' })
  role!: AdminRole
}
