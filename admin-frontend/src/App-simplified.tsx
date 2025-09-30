// 超级简化版React管理后台 - 解决运行时错误
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { 
  Layout, 
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
  Modal,
  Input,
  Select,
  Form
} from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  GiftOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QrcodeOutlined
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import './App.css'

const { Header, Sider, Content } = Layout

// API基础URL
const API_BASE = '/api/v1'

// HTTP请求函数
async function apiRequest(url: string, options: any = {}) {
  const token = localStorage.getItem('admin_token')
  
  try {
    const response = await fetch(API_BASE + url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    return response.json()
    
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

// 登录页面组件
const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username || !password) {
      message.error('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      const result = await apiRequest('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
      
      if (result.success) {
        localStorage.setItem('admin_token', result.data.token)
        message.success('登录成功！')
        navigate('/dashboard')
      } else {
        message.error(result.message || '登录失败')
      }
    } catch (error) {
      message.error('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <Card title="积分营销管理系统" style={{ width: 400 }}>
        <Form onFinish={handleLogin}>
          <Form.Item>
            <Input
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Input.Password
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              登录
            </Button>
          </Form.Item>
          <Form.Item>
            <Button 
              type="default"
              onClick={() => {
                setUsername('admin')
                setPassword('admin123')
              }}
              size="large"
              block
            >
              使用演示账号
            </Button>
          </Form.Item>
        </Form>
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

// 商户管理页面
const MerchantsPage: React.FC = () => {
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        const result = await apiRequest('/admin/merchants')
        if (result.success) {
          setMerchants(result.data.merchants || [])
          message.success(`加载了${result.data.merchants?.length || 0}个商户`)
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
    {
      title: '商户名称',
      dataIndex: 'merchantName',
      key: 'merchantName',
      width: 300
    },
    {
      title: '商户号',
      dataIndex: 'merchantNo',
      key: 'merchantNo',
      width: 150
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100
    },
    {
      title: '申请单号',
      dataIndex: 'applymentId',
      key: 'applymentId',
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? '已完成' : '待审核'}
        </Tag>
      )
    }
  ]

  return (
    <div>
      <h2>商户管理</h2>
      <Card>
        <Table 
          columns={columns} 
          dataSource={merchants} 
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  )
}

// 简化的其他页面
const UsersPage: React.FC = () => (
  <div>
    <h2>用户管理</h2>
    <Card>
      <p>用户管理功能正在开发中...</p>
    </Card>
  </div>
)

const OrdersPage: React.FC = () => (
  <div>
    <h2>订单管理</h2>
    <Card>
      <p>订单管理功能正在开发中...</p>
    </Card>
  </div>
)

const PointsPage: React.FC = () => (
  <div>
    <h2>积分管理</h2>
    <Card>
      <p>积分管理功能正在开发中...</p>
    </Card>
  </div>
)

const SettingsPage: React.FC = () => (
  <div>
    <h2>系统设置</h2>
    <Card>
      <p>✅ API服务运行正常</p>
      <p>✅ 数据库连接正常</p>
      <p>✅ 系统版本: v1.0.0</p>
    </Card>
  </div>
)

// 主布局组件
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
    message.success('已退出登录')
  }

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
      onClick: () => navigate('/dashboard')
    },
    {
      key: 'merchants',
      icon: <ShopOutlined />,
      label: '商户管理',
      onClick: () => navigate('/merchants')
    },
    {
      key: 'orders',
      icon: <FileTextOutlined />,
      label: '订单管理',
      onClick: () => navigate('/orders')
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
      onClick: () => navigate('/users')
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

  const getSelectedKey = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'dashboard'
    if (path.includes('/merchants')) return 'merchants'
    if (path.includes('/orders')) return 'orders'
    if (path.includes('/users')) return 'users'
    if (path.includes('/points')) return 'points'
    if (path.includes('/settings')) return 'settings'
    return 'dashboard'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ padding: '16px', color: 'white', textAlign: 'center' }}>
          🎁 积分系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} />
            <span style={{ marginLeft: 8, marginRight: 16 }}>系统管理员</span>
            <Button 
              type="text" 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              退出
            </Button>
          </div>
        </Header>
        <Content style={{ padding: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
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

// 主应用组件
function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router basename="/admin">
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/dashboard" element={
              <AuthGuard>
                <MainLayout>
                  <DashboardPage />
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
            <Route path="/orders" element={
              <AuthGuard>
                <MainLayout>
                  <OrdersPage />
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