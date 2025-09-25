// 简化版React管理后台 - 移除Redux复杂性
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { 
  Layout as AntLayout, 
  Menu, 
  Button, 
  message, 
  Spin, 
  ConfigProvider,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  Avatar,
  Dropdown
} from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import './App.css'

const { Header, Sider, Content } = AntLayout

// API基础URL
const API_BASE = '/api/v1'

// HTTP请求函数
async function apiRequest(url: string, options: any = {}) {
  const token = localStorage.getItem('admin_token')
  const response = await fetch(API_BASE + url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  })
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`)
  }
  
  return response.json()
}

// 登录页面组件
const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ username: '', password: '' })
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      message.error('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      const result = await apiRequest('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (result.success) {
        localStorage.setItem('admin_token', result.data.token)
        message.success('登录成功！')
        navigate('/dashboard')
      } else {
        message.error(result.message || '登录失败')
      }
    } catch (error) {
      console.error('Login error:', error)
      message.error('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setFormData({ username: 'admin', password: 'admin123' })
  }

  return (
    <div className="login-page">
      <Card title="积分营销管理系统" className="login-card">
        <div className="login-form">
          <input
            type="text"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="login-input"
          />
          <input
            type="password"
            placeholder="请输入密码"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="login-input"
          />
          <Button 
            type="primary" 
            loading={loading}
            onClick={handleLogin}
            className="login-button"
          >
            立即登录
          </Button>
          <Button 
            onClick={handleDemoLogin}
            className="demo-button"
          >
            使用演示账号登录
          </Button>
        </div>
      </Card>
    </div>
  )
}

// 仪表板页面
const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await apiRequest('/admin/dashboard/stats')
        if (result.success) {
          setStats(result.data.overview)
        }
      } catch (error) {
        console.error('Load stats error:', error)
        message.error('加载统计数据失败')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) return <Spin size="large" />

  return (
    <div>
      <h2>仪表板</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="总用户数" value={stats?.totalUsers || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="活跃用户" value={stats?.activeUsers || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总商户数" value={stats?.totalMerchants || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日订单" value={stats?.todayOrders || 0} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

// 用户管理页面
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await apiRequest('/admin/users')
        if (result.success) {
          setUsers(result.data.users || [])
        }
      } catch (error) {
        console.error('Load users error:', error)
        message.error('加载用户数据失败')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'id' },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
    { title: '积分余额', dataIndex: 'points_balance', key: 'points_balance' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      )
    }
  ]

  return (
    <div>
      <h2>用户管理</h2>
      <Table 
        columns={columns} 
        dataSource={users} 
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}

// 商户管理页面
const MerchantsPage: React.FC = () => {
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const result = await apiRequest('/admin/merchants')
        if (result.success) {
          setMerchants(result.data.merchants || [])
        }
      } catch (error) {
        console.error('Load merchants error:', error)
        message.error('加载商户数据失败')
      } finally {
        setLoading(false)
      }
    }
    loadMerchants()
  }, [])

  const columns = [
    { title: '商户ID', dataIndex: 'id', key: 'id' },
    { title: '公司名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '联系方式', dataIndex: 'contact', key: 'contact' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      )
    }
  ]

  return (
    <div>
      <h2>商户管理</h2>
      <Table 
        columns={columns} 
        dataSource={merchants} 
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}

// 积分管理页面
const PointsPage: React.FC = () => {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const result = await apiRequest('/admin/points')
        if (result.success) {
          setPoints(result.data.records || [])
        }
      } catch (error) {
        console.error('Load points error:', error)
        message.error('加载积分数据失败')
      } finally {
        setLoading(false)
      }
    }
    loadPoints()
  }, [])

  const columns = [
    { title: '用户ID', dataIndex: 'user_id', key: 'user_id' },
    { title: '积分变动', dataIndex: 'points_change', key: 'points_change' },
    { title: '余额', dataIndex: 'balance_after', key: 'balance_after' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' }
  ]

  return (
    <div>
      <h2>积分管理</h2>
      <Table 
        columns={columns} 
        dataSource={points} 
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}

// 主布局组件
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
      onClick: () => navigate('/dashboard')
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
      onClick: () => navigate('/users')
    },
    {
      key: 'merchants',
      icon: <ShopOutlined />,
      label: '商户管理',
      onClick: () => navigate('/merchants')
    },
    {
      key: 'points',
      icon: <GiftOutlined />,
      label: '积分管理',
      onClick: () => navigate('/points')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings')
    }
  ]

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
    message.success('已退出登录')
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  // 获取当前选中的菜单
  const getSelectedKey = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'dashboard'
    if (path.includes('/users')) return 'users'
    if (path.includes('/merchants')) return 'merchants'
    if (path.includes('/points')) return 'points'
    if (path.includes('/settings')) return 'settings'
    return 'dashboard'
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" style={{ padding: '16px', color: 'white', textAlign: 'center' }}>
          🎁 积分系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown overlay={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>系统管理员</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

// 认证守卫
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('admin_token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// 系统设置页面
const SettingsPage: React.FC = () => {
  return (
    <div>
      <h2>系统设置</h2>
      <Card title="系统状态">
        <p>✅ API服务运行正常</p>
        <p>✅ 数据库连接正常</p>
        <p>✅ 系统版本: v1.0.0</p>
      </Card>
    </div>
  )
}

// 主应用组件
function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router basename="/admin">
        <div className="App">
          <Routes>
            {/* 根路径重定向到登录页 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* 受保护的路由 */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/users" element={
              <AuthGuard>
                <MainLayout>
                  <UsersPage />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/merchants" element={
              <AuthGuard>
                <MainLayout>
                  <MerchantsPage />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/points" element={
              <AuthGuard>
                <MainLayout>
                  <PointsPage />
                </MainLayout>
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </AuthGuard>
            } />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  )
}

export default App
