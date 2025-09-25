// 管理后台主布局组件

import React, { useState, ReactNode } from 'react'
import { Layout as AntLayout, Menu, Dropdown, Avatar, Button, Badge, Breadcrumb } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store'
import { selectCurrentAdmin, logoutAsync } from '../../store/slices/authSlice'
import { MenuItem, Permission } from '../../types'
import './index.css'

const { Header, Sider, Content } = AntLayout

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const currentAdmin = useAppSelector(selectCurrentAdmin) || { username: 'admin', permissions: [], realName: '系统管理员' }

  // 菜单配置
  const menuItems: MenuItem[] = [
    {
      key: 'dashboard',
      label: '仪表板',
      icon: <DashboardOutlined />,
      path: '/dashboard',
      permissions: []
    },
    {
      key: 'users',
      label: '用户管理',
      icon: <UserOutlined />,
      path: '/users',
      permissions: []
    },
    {
      key: 'merchants',
      label: '商户管理',
      icon: <ShopOutlined />,
      path: '/merchants',
      permissions: []
    },
    {
      key: 'points',
      label: '积分管理',
      icon: <GiftOutlined />,
      children: [
        {
          key: 'points-overview',
          label: '积分概览',
          path: '/points',
          permissions: []
        },
        {
          key: 'points-records',
          label: '积分记录',
          path: '/points/records',
          permissions: []
        },
        {
          key: 'points-config',
          label: '积分配置',
          path: '/points/config',
          permissions: []
        }
      ]
    },
    {
      key: 'orders',
      label: '订单管理',
      icon: <ShoppingCartOutlined />,
      path: '/orders',
      permissions: []
    },
    {
      key: 'settings',
      label: '系统设置',
      icon: <SettingOutlined />,
      children: [
        {
          key: 'settings-system',
          label: '系统配置',
          path: '/settings/system',
          permissions: []
        },
        {
          key: 'settings-admins',
          label: '管理员',
          path: '/settings/admins',
          permissions: []
        },
        {
          key: 'settings-logs',
          label: '操作日志',
          path: '/settings/logs',
          permissions: []
        }
      ]
    }
  ]

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    const findMenuItem = (items: MenuItem[], targetKey: string): MenuItem | null => {
      for (const item of items) {
        if (item.key === targetKey) return item
        if (item.children) {
          const found = findMenuItem(item.children, targetKey)
          if (found) return found
        }
      }
      return null
    }

    const menuItem = findMenuItem(menuItems, key)
    if (menuItem?.path) {
      navigate(menuItem.path)
    }
  }

  // 用户下拉菜单
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        个人资料
      </Menu.Item>
      <Menu.Item key="change-password" icon={<SettingOutlined />}>
        修改密码
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item 
        key="logout" 
        icon={<LogoutOutlined />}
        onClick={() => dispatch(logoutAsync())}
      >
        退出登录
      </Menu.Item>
    </Menu>
  )

  // 获取当前选中的菜单key
  const getSelectedKey = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'dashboard'
    if (path.includes('/users')) return 'users'
    if (path.includes('/merchants')) return 'merchants'
    if (path.includes('/points/records')) return 'points-records'
    if (path.includes('/points/config')) return 'points-config'
    if (path.includes('/points')) return 'points-overview'
    if (path.includes('/orders')) return 'orders'
    if (path.includes('/settings/admins')) return 'settings-admins'
    if (path.includes('/settings/logs')) return 'settings-logs'
    if (path.includes('/settings')) return 'settings-system'
    return 'dashboard'
  }

  // 获取打开的菜单key
  const getOpenKeys = () => {
    const path = location.pathname
    const openKeys: string[] = []
    if (path.includes('/points')) openKeys.push('points')
    if (path.includes('/settings')) openKeys.push('settings')
    return openKeys
  }

  // 生成面包屑
  const getBreadcrumbs = () => {
    const path = location.pathname
    const breadcrumbs: Array<{ title: string; path?: string }> = [
      { title: '首页', path: '/admin/dashboard' }
    ]

    if (path.includes('/admin/dashboard')) {
      breadcrumbs.push({ title: '仪表板' })
    } else if (path.includes('/users')) {
      breadcrumbs.push({ title: '用户管理' })
    } else if (path.includes('/merchants')) {
      breadcrumbs.push({ title: '商户管理' })
    } else if (path.includes('/points')) {
      breadcrumbs.push({ title: '积分管理' })
      if (path.includes('/records')) breadcrumbs.push({ title: '积分记录' })
      if (path.includes('/config')) breadcrumbs.push({ title: '积分配置' })
    } else if (path.includes('/orders')) {
      breadcrumbs.push({ title: '订单管理' })
    } else if (path.includes('/settings')) {
      breadcrumbs.push({ title: '系统设置' })
      if (path.includes('/admins')) breadcrumbs.push({ title: '管理员管理' })
      if (path.includes('/logs')) breadcrumbs.push({ title: '操作日志' })
    }

    return breadcrumbs
  }

  return (
    <AntLayout className="admin-layout">
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={256}
        className="admin-sider"
      >
        {/* Logo区域 */}
        <div className="admin-logo">
          <GiftOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          {!collapsed && (
            <span className="admin-logo-text">积分管理系统</span>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={getOpenKeys()}
          onClick={handleMenuClick}
          className="admin-menu"
        >
          {menuItems.map(item => {
            if (item.children) {
              return (
                <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
                  {item.children.map(child => (
                    <Menu.Item key={child.key}>
                      {child.label}
                    </Menu.Item>
                  ))}
                </Menu.SubMenu>
              )
            }
            return (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            )
          })}
        </Menu>
      </Sider>

      {/* 主内容区域 */}
      <AntLayout className="admin-main">
        {/* 顶部导航 */}
        <Header className="admin-header">
          <div className="admin-header-left">
            {/* 菜单收缩按钮 */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="admin-trigger"
            />

            {/* 面包屑导航 */}
            <Breadcrumb className="admin-breadcrumb">
              {getBreadcrumbs().map((item, index) => (
                <Breadcrumb.Item key={index}>
                  {index === 0 && <HomeOutlined />}
                  {item.path ? (
                    <span 
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                      onClick={() => navigate(item.path!)}
                    >
                      {item.title}
                    </span>
                  ) : (
                    item.title
                  )}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>

          <div className="admin-header-right">
            {/* 通知铃铛 */}
            <Badge count={3} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                className="admin-notification"
              />
            </Badge>

            {/* 用户信息下拉菜单 */}
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div className="admin-user">
                <Avatar icon={<UserOutlined />} className="admin-avatar" />
                <span className="admin-username">
                  {currentAdmin?.realName || currentAdmin?.username || '管理员'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 主内容 */}
        <Content className="admin-content">
          <div className="admin-content-wrapper">
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
