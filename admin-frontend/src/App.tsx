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
  Dropdown,
  Modal,
  Input,
  Select,
  Form,
  Progress,
  Badge,
  Divider,
  List,
  Tabs,
  DatePicker
} from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShopOutlined,
  GiftOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QrcodeOutlined,
  PlusOutlined,
  FileTextOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  TeamOutlined,
  KeyOutlined,
  LockOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  SecurityScanOutlined,
  CrownOutlined,
  SafetyOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  ShoppingOutlined,
  ToolOutlined
} from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import './App.css'
import { apiRequest as apiReq } from './utils/api'
import { formatDateTime, formatAmount } from './utils/format'

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // 忽略Chrome扩展相关错误
    if (error.message?.includes('chrome-extension') || 
        error.message?.includes('_events') ||
        error.message?.includes('mfgccjchihfkkindfppnaooecgfneiii') ||
        error.message?.includes('inpage.js') ||
        error.message?.includes('Cannot set properties of undefined') ||
        error.stack?.includes('chrome-extension') ||
        error.stack?.includes('mfgccjchihfkkindfppnaooecgfneiii')) {
      this.setState({ hasError: false })
      return
    }
    
    console.error('应用错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && !this.state.error?.message?.includes('chrome-extension')) {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h2>应用出现错误</h2>
          <p>请刷新页面重试</p>
          <Button onClick={() => window.location.reload()}>刷新页面</Button>
        </div>
      )
    }

    return this.props.children
  }
}

const { Header, Sider, Content } = AntLayout

// 全局错误处理
window.addEventListener('error', (event) => {
  // 忽略Chrome扩展错误
  if (event.filename?.includes('chrome-extension') || 
      event.message?.includes('chrome-extension') ||
      event.message?.includes('_events')) {
    event.preventDefault()
    return false
  }
})

window.addEventListener('unhandledrejection', (event) => {
  // 忽略Chrome扩展Promise错误
  if (event.reason?.message?.includes('chrome-extension') ||
      event.reason?.stack?.includes('chrome-extension')) {
    event.preventDefault()
    return false
  }
})

// 使用工具函数中的apiRequest
const apiRequest = apiReq

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
      const result = await apiRequest('/auth/admin/login', {
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
      message.error(`登录失败: ${error instanceof Error ? error.message : '未知错误'}`)
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

// 仪表板页面 - 重新设计核心数据展示
const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const result = await apiRequest('/admin/dashboard/stats')
        if (result.success) {
          setDashboardData(result.data)
        }
      } catch (error) {
        console.error('Load dashboard data error:', error)
        message.error('加载仪表盘数据失败')
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  const refreshData = async () => {
    setLoading(true)
    try {
      const result = await apiRequest('/admin/dashboard/stats')
      if (result.success) {
        setDashboardData(result.data)
        message.success('数据刷新成功')
      }
    } catch (error) {
      console.error('Refresh data error:', error)
      message.error('刷新数据失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spin size="large" />

  const { overview, today, trends, quickAccess, system } = dashboardData || {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>数据仪表盘</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            实时监控业务数据和系统状态 
            <Badge 
              status={system?.status === 'healthy' ? 'processing' : 'error'} 
              text={system?.status === 'healthy' ? '系统正常' : '系统异常'}
              style={{ marginLeft: 8 }}
            />
          </p>
        </div>
        <Button type="primary" onClick={refreshData} loading={loading}>
          刷新数据
        </Button>
      </div>

      {/* 第一行：核心业务指标 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="有消费记录用户"
              value={overview?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃商户数"
              value={overview?.activeMerchants || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="家"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月交易额"
              value={overview?.monthlyRevenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
              本月订单 {overview?.monthlyOrders || 0} 笔
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月积分发放"
              value={overview?.monthlyPoints || 0}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#eb2f96' }}
              suffix="分"
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行：今日实时数据 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={today?.orders || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: today?.orders > 0 ? '#52c41a' : '#999' }}
              suffix="笔"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日交易额"
              value={today?.revenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: today?.revenue > 0 ? '#52c41a' : '#999' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日活跃用户"
              value={today?.activeUsers || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: today?.activeUsers > 0 ? '#52c41a' : '#999' }}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新用户"
              value={today?.newUsers || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: today?.newUsers > 0 ? '#52c41a' : '#999' }}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      {/* 第三行：趋势分析和商户分布 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card 
            title="最近7天交易趋势" 
            extra={
              <EyeOutlined 
                style={{ cursor: 'pointer', fontSize: '16px' }} 
                onClick={() => navigate('/orders')}
                title="查看订单详情"
              />
            }
          >
            <div style={{ height: 200 }}>
              {trends?.weekly && trends.weekly.length > 0 ? (
                <div>
                  {trends.weekly.map((item: any, index: number) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '4px 0',
                      borderBottom: index < trends.weekly.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <span style={{ fontSize: '12px' }}>
                        {new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {item.orders}笔 | ¥{(item.revenue / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#999'
                }}>
                  暂无交易数据
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="商户类别分布" 
            extra={
              <TrophyOutlined 
                style={{ cursor: 'pointer', fontSize: '16px' }} 
                onClick={() => navigate('/merchants')}
                title="查看商户详情"
              />
            }
          >
            <div style={{ height: 200 }}>
              {trends?.merchantCategories && trends.merchantCategories.length > 0 ? (
                <div>
                  {trends.merchantCategories.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '14px' }}>{item.category}</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {item.count}家 | ¥{item.revenue.toFixed(2)}
                        </span>
                      </div>
                      <Progress 
                        percent={Math.min((item.count / Math.max(...trends.merchantCategories.map((c: any) => c.count))) * 100, 100)} 
                        size="small"
                        showInfo={false}
                        strokeColor={['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'][index % 5]}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#999'
                }}>
                  暂无商户数据
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第四行：快速操作入口 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="最新订单" 
            extra={
              <Button type="link" size="small" onClick={() => window.location.href = '/admin/orders'}>
                查看全部
              </Button>
            }
          >
            <div style={{ height: 200, overflow: 'auto' }}>
              {quickAccess?.recentOrders && quickAccess.recentOrders.length > 0 ? (
                <List
                  size="small"
                  dataSource={quickAccess.recentOrders}
                  renderItem={(item: any) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>
                              ¥{item.amount.toFixed(2)}
                              <Tag color="green" style={{ marginLeft: 8 }}>
                                +{item.pointsAwarded}分
                              </Tag>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {item.userNickname} · {item.merchantName}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Tag color={item.status === 'paid' ? 'green' : 'orange'}>
                              {item.status === 'paid' ? '已支付' : '待支付'}
                            </Tag>
                            <div style={{ fontSize: '11px', color: '#999' }}>
                              {new Date(item.createdAt).toLocaleString('zh-CN', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#999'
                }}>
                  暂无订单数据
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="待处理商户申请" 
            extra={
              <Button type="link" size="small" onClick={() => window.location.href = '/admin/merchants'}>
                查看全部
              </Button>
            }
          >
            <div style={{ height: 200, overflow: 'auto' }}>
              {quickAccess?.pendingMerchants && quickAccess.pendingMerchants.length > 0 ? (
                <List
                  size="small"
                  dataSource={quickAccess.pendingMerchants}
                  renderItem={(item: any) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>
                              {item.merchantName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              联系人: {item.contactPerson}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Tag color="orange" icon={<ClockCircleOutlined />}>
                              待审核
                            </Tag>
                            <div style={{ fontSize: '11px', color: '#999' }}>
                              {new Date(item.createdAt).toLocaleString('zh-CN', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: '#999',
                  flexDirection: 'column'
                }}>
                  <CheckCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <span>暂无待处理申请</span>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 页面底部信息 */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: '#fafafa', 
        borderRadius: 6,
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        <div>
          数据更新时间: {system?.lastUpdated ? new Date(system.lastUpdated).toLocaleString('zh-CN') : '未知'}
          <Divider type="vertical" />
          系统状态: 
          <Tag color={system?.status === 'healthy' ? 'green' : 'red'} style={{ marginLeft: 4 }}>
            {system?.status === 'healthy' ? '正常运行' : '异常'}
          </Tag>
        </div>
      </div>
    </div>
  )
}

// 用户管理页面
const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userDetailVisible, setUserDetailVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userDetailLoading, setUserDetailLoading] = useState(false)
  
  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<any>(null)
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const result = await apiRequest('/admin/users')
      if (result.success) {
        // 处理后端返回的数据结构 { data: { list: [...], pagination: {...} } }
        const usersList = result.data?.list || result.data || []
        setUsers(Array.isArray(usersList) ? usersList : [])
      }
    } catch (error) {
      console.error('Load users error:', error)
      message.error('加载用户数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 应用筛选逻辑
  useEffect(() => {
    let result = [...users]
    
    // 文本搜索（用户名、手机号、微信ID、用户ID）
    if (searchText) {
      const search = searchText.toLowerCase()
      result = result.filter((user: any) => 
        (user.nickname && user.nickname.toLowerCase().includes(search)) ||
        (user.phone && user.phone.includes(search)) ||
        (user.wechatId && user.wechatId.toLowerCase().includes(search)) ||
        (user.id && user.id.toLowerCase().includes(search))
      )
    }
    
    // 状态筛选
    if (statusFilter !== 'all') {
      result = result.filter((user: any) => user.status === statusFilter)
    }
    
    // 日期范围筛选
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange
      result = result.filter((user: any) => {
        const userDate = new Date(user.createdAt)
        return userDate >= startDate.toDate() && userDate <= endDate.toDate()
      })
    }
    
    setFilteredUsers(result)
  }, [users, searchText, statusFilter, dateRange])

  // 重置筛选
  const handleResetFilters = () => {
    setSearchText('')
    setStatusFilter('all')
    setDateRange(null)
    message.success('已重置筛选条件')
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleToggleUserStatus = async (user: any) => {
    const newStatus = user.status === 'active' ? 'locked' : 'active'
    const action = newStatus === 'active' ? '解锁' : '锁定'
    
    try {
      const result = await apiRequest(`/admin/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      
      if (result.success) {
        message.success(`${action}用户成功`)
        loadUsers() // 重新加载用户列表
      } else {
        message.error(result.message || `${action}用户失败`)
      }
    } catch (error) {
      console.error('Toggle user status error:', error)
      message.error(`${action}用户失败`)
    }
  }

  const handleViewUserDetail = async (user: any) => {
    setUserDetailLoading(true)
    setUserDetailVisible(true)
    
    try {
      const result = await apiRequest(`/admin/users/${user.id}`)
      if (result.success) {
        setSelectedUser(result.data)
      } else {
        message.error('获取用户详情失败')
        setSelectedUser(user) // 使用列表数据作为备用
      }
    } catch (error) {
      console.error('Get user detail error:', error)
      message.error('获取用户详情失败')
      setSelectedUser(user) // 使用列表数据作为备用
    } finally {
      setUserDetailLoading(false)
    }
  }

  const columns = [
    { 
      title: '用户信息', 
      dataIndex: 'nickname', 
      key: 'user_info',
      width: 200,
      render: (nickname: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{nickname || '未知用户'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.id}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            微信: {record.wechatId || '未绑定'}
          </div>
        </div>
      )
    },
    { 
      title: '积分信息', 
      dataIndex: 'availablePoints', 
      key: 'points_info',
      width: 150,
      render: (availablePoints: number, record: any) => (
        <div>
          <div style={{ fontWeight: 500, color: '#1890ff' }}>余额: {availablePoints || 0}</div>
          <div style={{ fontSize: '12px', color: '#52c41a' }}>
            总获得: {record.totalEarned || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
            总消费: {record.totalSpent || 0}
          </div>
        </div>
      )
    },
    { 
      title: '消费统计', 
      key: 'consumption_stats',
      width: 150,
      render: (text: any, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.orderCount || 0} 笔订单
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            总金额: ¥{((record.totalAmount || 0) / 100).toFixed(2)}
          </div>
        </div>
      )
    },
    { 
      title: '账户状态', 
      dataIndex: 'status', 
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '已锁定'}
        </Tag>
      )
    },
    { 
      title: '注册时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      width: 150,
      render: (time: string) => formatDateTime(time)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (text: any, record: any) => (
        <div>
          <Button 
            size="small" 
            type={record.status === 'active' ? 'default' : 'primary'}
            onClick={() => handleToggleUserStatus(record)}
            style={{ marginRight: 8 }}
          >
            {record.status === 'active' ? '锁定' : '解锁'}
          </Button>
          <Button 
            size="small" 
            onClick={() => handleViewUserDetail(record)}
          >
            详情
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>用户管理</h2>
        <Button 
          type="primary"
          onClick={loadUsers}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>
      
      <div style={{ marginBottom: 16, color: '#666' }}>
        管理有消费记录的用户，可以锁定/解锁用户参与积分消费的权限。🔒锁定后用户无法扫码消费获得积分
      </div>
      
      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Input.Search
              placeholder="搜索用户名、手机号、微信ID、用户ID"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => setSearchText(value)}
              allowClear
              style={{ width: '100%' }}
              prefix={<SearchOutlined />}
            />
          </div>
          
          <div style={{ flex: '0 0 150px' }}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '✅ 正常', value: 'active' },
                { label: '🔒 已锁定', value: 'locked' }
              ]}
            />
          </div>
          
          <div style={{ flex: '0 0 280px' }}>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={['注册开始日期', '注册结束日期']}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleResetFilters}
            >
              重置筛选
            </Button>
          </div>
        </div>
        
        <div style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
          {searchText && <span>🔍 搜索: "{searchText}" </span>}
          {statusFilter !== 'all' && <span>• 状态: {statusFilter === 'active' ? '正常' : '已锁定'} </span>}
          {dateRange && <span>• 注册时间: {dateRange[0].format('YYYY-MM-DD')} ~ {dateRange[1].format('YYYY-MM-DD')} </span>}
          {(searchText || statusFilter !== 'all' || dateRange) && (
            <span style={{ color: '#1890ff' }}>• 共找到 {filteredUsers.length} 个用户</span>
          )}
        </div>
      </Card>
      
      <Table 
        columns={columns} 
        dataSource={filteredUsers.length > 0 || searchText || statusFilter !== 'all' || dateRange ? filteredUsers : users} 
        loading={loading}
        rowKey="id"
        pagination={{ 
          pageSize: 20,
          showTotal: (total) => `共 ${total} 个用户`,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        scroll={{ x: 1000 }}
      />
      
      {/* 用户详情弹窗 */}
      <Modal
        title={selectedUser ? `用户详情 - ${selectedUser.nickname}` : '用户详情'}
        open={userDetailVisible}
        onCancel={() => {
          setUserDetailVisible(false)
          setSelectedUser(null)
        }}
        footer={[
          <Button key="close" onClick={() => setUserDetailVisible(false)}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setUserDetailVisible(false)
              if (selectedUser) {
                handleToggleUserStatus(selectedUser)
              }
            }}
            disabled={!selectedUser}
          >
            {selectedUser?.status === 'active' ? '锁定用户' : '解锁用户'}
          </Button>
        ]}
        width={900}
      >
        {userDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>加载用户详情...</p>
          </div>
        ) : selectedUser ? (
          <div style={{ marginTop: 16 }}>
            {/* 基本信息 */}
            <Row gutter={16}>
              <Col span={12}>
                <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>用户ID:</strong> {selectedUser.id}</p>
                  <p><strong>昵称:</strong> {selectedUser.nickname || '未设置'}</p>
                  <p><strong>微信ID:</strong> {selectedUser.wechatId || '未绑定'}</p>
                  <p><strong>手机号:</strong> {selectedUser.phone || '未设置'}</p>
                  <p><strong>账户状态:</strong> 
                    <Tag color={selectedUser.status === 'active' ? 'green' : 'red'}>
                      {selectedUser.status === 'active' ? '正常' : '已锁定'}
                    </Tag>
                  </p>
                  <p><strong>注册时间:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="积分信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>当前余额:</strong> <span style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>{selectedUser.availablePoints || 0}</span> 分</p>
                  <p><strong>累计获得:</strong> <span style={{ color: '#52c41a' }}>{selectedUser.totalEarned || 0}</span> 分</p>
                  <p><strong>累计消费:</strong> <span style={{ color: '#ff4d4f' }}>{selectedUser.totalSpent || 0}</span> 分</p>
                  <p><strong>净收益:</strong> <span style={{ color: '#1890ff' }}>{(selectedUser.totalEarned || 0) - (selectedUser.totalSpent || 0)}</span> 分</p>
                </Card>
              </Col>
            </Row>
            
            {/* 订单统计 */}
            <Row gutter={16}>
              <Col span={12}>
                <Card title="订单统计" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>总订单数:</strong> {selectedUser.orderStats?.totalOrders || 0} 笔</p>
                  <p><strong>已支付:</strong> <span style={{ color: '#52c41a' }}>{selectedUser.orderStats?.paidOrders || 0}</span> 笔</p>
                  <p><strong>待支付:</strong> <span style={{ color: '#faad14' }}>{selectedUser.orderStats?.pendingOrders || 0}</span> 笔</p>
                  <p><strong>已取消:</strong> <span style={{ color: '#ff4d4f' }}>{selectedUser.orderStats?.cancelledOrders || 0}</span> 笔</p>
                  <p><strong>总消费金额:</strong> <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{((selectedUser.orderStats?.totalAmount || 0) / 100).toFixed(2)}</span></p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="常消费商户" size="small" style={{ marginBottom: 16 }}>
                  {selectedUser.merchantStats && selectedUser.merchantStats.length > 0 ? (
                    <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                      {selectedUser.merchantStats.map((merchant: any, index: number) => (
                        <div key={index} style={{ marginBottom: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                          <div style={{ fontWeight: 500, fontSize: '12px' }}>{merchant.merchantName}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {merchant.orderCount}笔 | ¥{(merchant.totalAmount / 100).toFixed(2)} | {merchant.totalPoints}分
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999' }}>暂无消费记录</p>
                  )}
                </Card>
              </Col>
            </Row>
            
            {/* 最近积分记录 */}
            {selectedUser.pointsHistory && selectedUser.pointsHistory.length > 0 && (
              <Card title="最近积分记录" size="small" style={{ marginBottom: 16 }}>
                <Table
                  size="small"
                  dataSource={selectedUser.pointsHistory}
                  pagination={false}
                  rowKey="id"
                  columns={[
                    {
                      title: '积分变动',
                      dataIndex: 'pointsChange',
                      key: 'pointsChange',
                      width: 80,
                      render: (points: number) => (
                        <span style={{ color: points > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
                          {points > 0 ? '+' : ''}{points}
                        </span>
                      )
                    },
                    {
                      title: '商户',
                      dataIndex: 'merchantName',
                      key: 'merchantName',
                      width: 180
                    },
                    {
                      title: '描述',
                      dataIndex: 'description',
                      key: 'description'
                    },
                    {
                      title: '时间',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                      width: 120,
                      render: (time: string) => new Date(time).toLocaleDateString()
                    }
                  ]}
                />
              </Card>
            )}
            
            {/* 最近订单记录 */}
            {selectedUser.recentOrders && selectedUser.recentOrders.length > 0 && (
              <Card title="最近订单记录" size="small">
                <Table
                  size="small"
                  dataSource={selectedUser.recentOrders}
                  pagination={false}
                  rowKey="id"
                  columns={[
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      key: 'amount',
                      width: 80,
                      render: (amount: number) => formatAmount(amount)
                    },
                    {
                      title: '积分',
                      dataIndex: 'pointsAwarded',
                      key: 'pointsAwarded',
                      width: 60,
                      render: (points: number) => <Tag color="green">{points}</Tag>
                    },
                    {
                      title: '商户',
                      dataIndex: 'merchantName',
                      key: 'merchantName',
                      width: 180
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      width: 80,
                      render: (status: string) => {
                        const statusMap: any = {
                          'paid': { color: 'green', text: '已支付' },
                          'pending': { color: 'orange', text: '待支付' },
                          'cancelled': { color: 'red', text: '已取消' }
                        }
                        const statusInfo = statusMap[status] || { color: 'default', text: status }
                        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                      }
                    },
                    {
                      title: '时间',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                      width: 120,
                      render: (time: string) => new Date(time).toLocaleDateString()
                    }
                  ]}
                />
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>暂无数据</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

// 新版商户管理页面 - 使用新的商户CRUD API
const MerchantsPage: React.FC = () => {
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null)
  const [qrCodeData, setQrCodeData] = useState<any>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [dataSource, setDataSource] = useState('unknown')
  
  // 新增商户弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    merchantName: '',
    contactPerson: '',
    contactPhone: '',
    businessLicense: '',
    contactEmail: '',
    merchantType: 'INDIVIDUAL',
    legalPerson: '',
    businessCategory: '',
    applymentId: '',
    subMchId: ''
  })

  // 编辑商户弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    merchantName: '',
    contactPerson: '',
    contactPhone: '',
    businessLicense: '',
    contactEmail: '',
    merchantType: 'INDIVIDUAL',
    legalPerson: '',
    businessCategory: '',
    applymentId: '',
    subMchId: '',
    status: 'pending'
  })

  // 商户详情弹窗状态
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [merchantDetail, setMerchantDetail] = useState<any>(null)

  useEffect(() => {
    loadMerchants()
    loadStats()
  }, [])

  const loadMerchants = async () => {
    try {
      const result = await apiRequest('/admin/merchants')
      
      if (result.success) {
        // 处理后端返回的数据结构 { data: { list: [...], pagination: {...} } }
        const merchantsList = result.data?.list || result.data || []
        setMerchants(Array.isArray(merchantsList) ? merchantsList : [])
        setDataSource((result as any).dataSource || 'unknown')
      } else {
        message.error(result.message || '加载商户数据失败')
      }
    } catch (error) {
      console.error('❌ 加载商户失败:', error)
      message.error('加载商户数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await apiRequest('/admin/merchants/stats')
      
      if (result.success) {
        setStats(result.data)
      } else {
        console.warn('⚠️ 统计数据加载失败:', result.message)
      }
    } catch (error) {
      console.error('❌ 加载统计失败:', error)
    }
  }

  // 生成单个商户二维码
  const generateQRCode = async (merchant: any, amount?: number) => {
    setQrLoading(true)
    try {
      const requestBody = amount ? { fixedAmount: amount } : {}
      const result = await apiRequest(`/admin/merchants/${merchant.merchantId || merchant.id}/qrcode`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      if (result.success) {
        setQrCodeData(result.data)
        message.success('二维码生成成功！')
      } else {
        message.error(result.message || '二维码生成失败')
      }
    } catch (error) {
      console.error('Generate QR code error:', error)
      message.error('二维码生成失败')
    } finally {
      setQrLoading(false)
    }
  }

  const handleGenerateQR = (merchant: any) => {
    setSelectedMerchant(merchant)
    setQrModalVisible(true)
    generateQRCode(merchant)
  }

  // 查看商户详情
  const handleViewDetail = async (merchant: any) => {
    setDetailLoading(true)
    setDetailModalVisible(true)
    
    try {
      const result = await apiRequest(`/admin/merchants/${merchant.id}`)
      
      if (result.success) {
        setMerchantDetail(result.data) // 修复：直接使用result.data
      } else {
        message.error('获取商户详情失败: ' + result.message)
        setMerchantDetail(merchant) // 使用列表数据作为备用
      }
    } catch (error) {
      console.error('查看详情出错:', error)
      message.error('获取商户详情失败')
      setMerchantDetail(merchant) // 使用列表数据作为备用
    } finally {
      setDetailLoading(false)
    }
  }

  // 创建新商户
  const handleCreateMerchant = async () => {
    setCreateLoading(true)
    try {
      
      // 验证必填字段
      if (!createForm.merchantName || !createForm.contactPerson || !createForm.contactPhone || !createForm.businessLicense) {
        message.error('请填写必填字段')
        setCreateLoading(false)
        return
      }

      const result = await apiRequest('/admin/merchants', {
        method: 'POST',
        body: JSON.stringify(createForm)
      })
      
      if (result.success) {
        message.success(`商户 ${result.data.merchant.merchantName} 创建成功`)
        setCreateModalVisible(false)
        setCreateForm({
          merchantName: '',
          contactPerson: '',
          contactPhone: '',
          businessLicense: '',
          contactEmail: '',
          merchantType: 'INDIVIDUAL',
          legalPerson: '',
          businessCategory: '',
          applymentId: '',
          subMchId: ''
        })
        loadMerchants() // 刷新列表
        loadStats()   // 刷新统计
      } else {
        message.error(result.message || '创建商户失败')
      }
    } catch (error) {
      console.error('❌ 创建商户失败:', error)
      message.error('创建商户失败')
    } finally {
      setCreateLoading(false)
    }
  }

  // 表单字段更新
  const handleFormChange = (field: string, value: any) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 批量生成二维码
  const handleBatchGenerateQR = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要生成二维码的商户')
      return
    }

    setBatchLoading(true)
    try {
      const result = await apiRequest('/admin/merchants/qrcode/batch', {
        method: 'POST',
        body: JSON.stringify({
          merchantIds: selectedRowKeys,
          qrType: 'standard'
        })
      })
      
      if (result.success) {
        message.success(`批量生成成功: ${result.data.summary.success} 个成功，${result.data.summary.failure} 个失败`)
        setSelectedRowKeys([])
      } else {
        message.error(result.message || '批量生成失败')
      }
    } catch (error) {
      console.error('Batch generate error:', error)
      message.error('批量生成失败')
    } finally {
      setBatchLoading(false)
    }
  }

  // 批量状态修改
  const handleBatchStatusChange = async (newStatus: 'active' | 'inactive') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要修改状态的商户')
      return
    }

    const selectedMerchants = merchants.filter((merchant: any) => 
      selectedRowKeys.includes(merchant.id)
    )
    const action = newStatus === 'active' ? '激活' : '禁用'

    Modal.confirm({
      title: `批量${action}确认`,
      content: (
        <div>
          <p>确定要{action}以下 <strong>{selectedRowKeys.length}</strong> 个商户吗？</p>
          <div style={{ 
            maxHeight: '200px', 
            overflow: 'auto', 
            background: '#f5f5f5', 
            padding: '8px 12px', 
            borderRadius: '4px',
            margin: '8px 0'
          }}>
            {selectedMerchants.map((merchant: any, index: number) => (
              <div key={merchant.id} style={{ marginBottom: '4px' }}>
                {index + 1}. {merchant.merchantName} (当前状态: {merchant.status})
              </div>
            ))}
          </div>
        </div>
      ),
      okText: `确定${action}`,
      cancelText: '取消',
      onOk: async () => {
        setBatchLoading(true)
        try {
          
          const updatePromises = selectedRowKeys.map(merchantId => 
            apiRequest(`/admin/merchants/${merchantId}`, {
              method: 'PUT',
              body: JSON.stringify({ status: newStatus })
            })
          )
          
          const results = await Promise.allSettled(updatePromises)
          
          let successCount = 0
          let failureCount = 0
          
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
              successCount++
            } else {
              failureCount++
            }
          })
          
          if (successCount > 0 && failureCount === 0) {
            message.success(`✅ 批量${action}成功！共${action} ${successCount} 个商户`)
          } else if (successCount > 0 && failureCount > 0) {
            message.warning(`⚠️ 部分${action}成功：${successCount} 个成功，${failureCount} 个失败`)
          } else {
            message.error(`❌ 批量${action}失败！`)
          }
          
          setSelectedRowKeys([])
          loadMerchants()
          
        } catch (error) {
          console.error(`Batch ${action} error:`, error)
          message.error(`批量${action}异常`)
        } finally {
          setBatchLoading(false)
        }
      }
    })
  }

  // 批量删除商户
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的商户')
      return
    }

    // 获取选中商户的名称用于确认对话框
    const selectedMerchants = merchants.filter((merchant: any) => 
      selectedRowKeys.includes(merchant.id)
    )

    Modal.confirm({
      title: '批量删除确认',
      content: (
        <div>
          <p>确定要删除以下 <strong>{selectedRowKeys.length}</strong> 个商户吗？</p>
          <div style={{ 
            maxHeight: '200px', 
            overflow: 'auto', 
            background: '#f5f5f5', 
            padding: '8px 12px', 
            borderRadius: '4px',
            margin: '8px 0'
          }}>
            {selectedMerchants.map((merchant: any, index: number) => (
              <div key={merchant.id} style={{ marginBottom: '4px' }}>
                {index + 1}. {merchant.merchantName} ({merchant.contactPerson})
              </div>
            ))}
          </div>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
            ⚠️ 此操作不可恢复，请谨慎操作！
          </p>
        </div>
      ),
      okText: '确定删除',
      cancelText: '取消',
      okType: 'danger',
      width: 500,
      onOk: async () => {
        setBatchLoading(true)
        try {
          
          // 并发删除所有选中的商户
          const deletePromises = selectedRowKeys.map(merchantId => 
            apiRequest(`/admin/merchants/${merchantId}`, {
              method: 'DELETE'
            })
          )
          
          const results = await Promise.allSettled(deletePromises)
          
          // 统计成功和失败的数量
          let successCount = 0
          let failureCount = 0
          const failedMerchants: string[] = []
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
              successCount++
            } else {
              failureCount++
              const merchant = selectedMerchants[index]
              if (merchant && merchant.merchantName) {
                failedMerchants.push(merchant.merchantName)
              }
            }
          })
          
          // 显示结果消息
          if (successCount > 0 && failureCount === 0) {
            message.success(`✅ 批量删除成功！共删除 ${successCount} 个商户`)
          } else if (successCount > 0 && failureCount > 0) {
            message.warning(`⚠️ 部分删除成功：${successCount} 个成功，${failureCount} 个失败`)
            if (failedMerchants.length > 0) {
              Modal.warning({
                title: '删除失败的商户',
                content: (
                  <div>
                    <p>以下商户删除失败：</p>
                    <ul>
                      {failedMerchants.map(name => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )
              })
            }
          } else {
            message.error(`❌ 批量删除失败！${failureCount} 个商户删除失败`)
          }
          
          // 清空选择并重新加载数据
          setSelectedRowKeys([])
          loadMerchants()
          
        } catch (error) {
          console.error('Batch delete error:', error)
          message.error('批量删除异常')
        } finally {
          setBatchLoading(false)
        }
      }
    })
  }

  const downloadQRCode = () => {
    if (qrCodeData?.qrCodeImage) {
      const link = document.createElement('a')
      link.href = qrCodeData.qrCodeImage
      link.download = `qrcode_${selectedMerchant?.merchantId || selectedMerchant?.id}.png`
      link.click()
    }
  }

  // 编辑商户
  const handleEditMerchant = (record: any) => {
    setEditForm({
      id: record.id,
      merchantName: record.merchantName || '',
      contactPerson: record.contactPerson || '',
      contactPhone: record.contactPhone || '',
      businessLicense: record.businessLicense || '',
      contactEmail: record.contactEmail || '',
      merchantType: record.merchantType || 'INDIVIDUAL',
      legalPerson: record.legalPerson || '',
      businessCategory: record.businessCategory || '',
      applymentId: record.applymentId || '',
      subMchId: record.subMchId || '',
      status: record.status || 'pending'
    })
    setEditModalVisible(true)
  }

  // 保存编辑的商户
  const handleSaveEdit = async () => {
    setEditLoading(true)
    try {
      
      // 验证必填字段
      if (!editForm.merchantName || !editForm.contactPerson || !editForm.contactPhone || !editForm.businessLicense) {
        message.error('请填写所有必填字段')
        setEditLoading(false)
        return
      }

      const result = await apiRequest(`/admin/merchants/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          merchantName: editForm.merchantName,
          contactPerson: editForm.contactPerson,
          contactPhone: editForm.contactPhone,
          businessLicense: editForm.businessLicense,
          contactEmail: editForm.contactEmail,
          merchantType: editForm.merchantType,
          legalPerson: editForm.legalPerson,
          businessCategory: editForm.businessCategory,
          applymentId: editForm.applymentId,
          subMchId: editForm.subMchId,
          status: editForm.status
        })
      })
      
      if (result.success) {
        message.success('商户信息更新成功')
        setEditModalVisible(false)
        loadMerchants() // 重新加载列表
      } else {
        message.error(result.message || '更新商户失败')
      }
    } catch (error) {
      console.error('Update merchant error:', error)
      message.error('更新商户失败')
    } finally {
      setEditLoading(false)
    }
  }

  // 编辑表单字段更新
  const handleEditFormChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 切换商户状态
  const handleToggleStatus = async (record: any) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'active' ? '激活' : '禁用'
    
    try {
      const result = await apiRequest(`/admin/merchants/${record.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      
      if (result.success) {
        message.success(`${action}商户成功`)
        loadMerchants() // 重新加载数据
      } else {
        message.error(result.message || `${action}商户失败`)
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      message.error(`${action}商户失败`)
    }
  }

  // 删除商户
  const handleDeleteMerchant = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除商户"${record.merchantName}"吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await apiRequest(`/admin/merchants/${record.id}`, {
            method: 'DELETE'
          })
          
          if (result.success) {
            message.success('删除商户成功')
            loadMerchants() // 重新加载数据
          } else {
            message.error(result.message || '删除商户失败')
          }
        } catch (error) {
          console.error('Delete merchant error:', error)
          message.error('删除商户失败')
        }
      }
    })
  }

  const columns = [
    {
      title: '商户信息',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text || record.merchantName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ID: {record.id}
          </div>
          {record.category && (
            <Tag color="blue" style={{ fontSize: '11px', marginTop: 4 }}>{record.category}</Tag>
          )}
        </div>
      )
    },
    {
      title: '联系信息',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 150,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text || '-'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.contactPhone || '-'}</div>
        </div>
      )
    },
    {
      title: '交易统计',
      key: 'transaction',
      width: 180,
      render: (text: any, record: any) => (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#1890ff' }}>
            ¥{((record.totalAmount || 0) / 100).toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#52c41a', marginTop: 2 }}>
            {record.orderCount || 0}笔订单
          </div>
          <div style={{ fontSize: '12px', color: '#faad14', marginTop: 2 }}>
            赠{record.totalPoints || 0}积分
          </div>
        </div>
      )
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 100,
      render: (count: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
            {count || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>消费用户</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: any = {
          'active': { color: 'green', text: '营业中' },
          'pending': { color: 'orange', text: '待审核' },
          'inactive': { color: 'red', text: '已停业' }
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (text: any, record: any) => (
        <div>
          <Button 
            type="primary"
            icon={<QrcodeOutlined />}
            onClick={() => handleGenerateQR(record)}
            size="small"
            disabled={record.status !== 'active'}
            style={{ marginRight: 4 }}
          >
            二维码
          </Button>
          <Button 
            size="small" 
            onClick={() => handleViewDetail(record)}
            style={{ marginRight: 4 }}
          >
            详情
          </Button>
          <Button 
            size="small" 
            onClick={() => handleEditMerchant(record)}
            style={{ marginRight: 4 }}
          >
            编辑
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'activate',
                  label: record.status === 'active' ? '禁用' : '激活',
                  onClick: () => handleToggleStatus(record)
                },
                {
                  key: 'delete',
                  label: '删除',
                  danger: true,
                  onClick: () => handleDeleteMerchant(record)
                }
              ]
            }}
            trigger={['click']}
          >
            <Button size="small">
              更多
            </Button>
          </Dropdown>
        </div>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: any[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[])
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.status !== 'active' // 只有激活状态的商户才能被选中
    })
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总商户数" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已完成" value={stats?.active || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="审核中" value={stats?.pending || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已驳回" value={stats?.inactive || 0} />
          </Card>
        </Col>
      </Row>

      {/* 商户列表 */}
      <Card 
        title="商户管理" 
        extra={
          <div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              style={{ marginRight: 8 }}
            >
              新增商户
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'batch-qrcode',
                    label: '批量生成二维码',
                    icon: <QrcodeOutlined />,
                    onClick: handleBatchGenerateQR,
                    disabled: selectedRowKeys.length === 0
                  },
                  {
                    key: 'batch-activate',
                    label: '批量激活',
                    onClick: () => handleBatchStatusChange('active'),
                    disabled: selectedRowKeys.length === 0
                  },
                  {
                    key: 'batch-deactivate',
                    label: '批量禁用',
                    onClick: () => handleBatchStatusChange('inactive'),
                    disabled: selectedRowKeys.length === 0
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'batch-delete',
                    label: '批量删除',
                    danger: true,
                    onClick: handleBatchDelete,
                    disabled: selectedRowKeys.length === 0
                  }
                ]
              }}
              disabled={selectedRowKeys.length === 0}
              trigger={['click']}
            >
              <Button 
                loading={batchLoading}
                disabled={selectedRowKeys.length === 0}
                style={{ marginRight: 8 }}
              >
                批量操作 ({selectedRowKeys.length}) ▼
              </Button>
            </Dropdown>
            <Button 
              onClick={loadMerchants}
              loading={loading}
            >
              刷新数据
            </Button>
          </div>
        }
      >
        {/* 搜索和筛选 */}
        <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 6 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input.Search
                placeholder="搜索商户名称、联系人、电话"
                allowClear
                onSearch={(value) => {
                  // TODO: 实现搜索功能
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="筛选状态"
                allowClear
                onChange={(value) => {
                  // TODO: 实现状态筛选
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="已完成">已完成</Select.Option>
                <Select.Option value="审核中">审核中</Select.Option>
                <Select.Option value="已驳回">已驳回</Select.Option>
                <Select.Option value="待审核">待审核</Select.Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="商户类型"
                allowClear
                onChange={(value) => {
                  // TODO: 实现类型筛选
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="INDIVIDUAL">个体工商户</Select.Option>
                <Select.Option value="ENTERPRISE">企业</Select.Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="二维码状态"
                allowClear
                onChange={(value) => {
                  // TODO: 实现二维码筛选
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="has_qrcode">已生成</Select.Option>
                <Select.Option value="no_qrcode">未生成</Select.Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button type="primary" style={{ width: '100%' }}>
                高级筛选
              </Button>
            </Col>
          </Row>
        </div>
        
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Tag color={dataSource === 'database' ? 'green' : 'orange'}>
            数据源: {dataSource === 'database' ? '数据库' : '模拟数据'}
          </Tag>
        </div>
        <Table 
          rowSelection={rowSelection}
          columns={columns} 
          dataSource={merchants} 
          loading={loading}
          rowKey="id"
          pagination={{ 
            pageSize: 20,
            showTotal: (total) => `共 ${total} 个商户`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 二维码预览弹窗 */}
      <Modal
        title="商户支付二维码"
        open={qrModalVisible}
        onCancel={() => {
          setQrModalVisible(false)
          setQrCodeData(null)
          setSelectedMerchant(null)
        }}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            icon={<QrcodeOutlined />}
            onClick={downloadQRCode}
            disabled={!qrCodeData?.qrCodeImage}
          >
            下载二维码
          </Button>
        ]}
        width={600}
      >
        {qrLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>正在生成二维码...</p>
          </div>
        ) : qrCodeData ? (
          <div style={{ textAlign: 'center' }}>
            <h3>商户: {selectedMerchant?.merchantName || selectedMerchant?.merchantId}</h3>
            <div style={{ 
              display: 'inline-block', 
              padding: '20px', 
              border: '1px solid #d9d9d9', 
              borderRadius: '8px',
              margin: '20px 0'
            }}>
              <img 
                src={qrCodeData.qrCodeImage}
                alt="商户支付二维码"
                style={{ width: 200, height: 200 }}
              />
            </div>
                 <p style={{ color: '#666', fontSize: '14px' }}>
                   扫码支付: 用户自定义金额
                 </p>
            <p style={{ color: '#999', fontSize: '12px' }}>
              二维码类型: {qrCodeData.qrType === 'miniprogram' ? '微信小程序码' : '标准二维码'}
            </p>
            <p style={{ color: '#999', fontSize: '12px' }}>
              页面路径: {qrCodeData.qrCodeData}
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>二维码生成失败</p>
          </div>
        )}
      </Modal>

      {/* 新增商户弹窗 */}
      <Modal
        title="新增商户"
        open={createModalVisible}
        onOk={handleCreateMerchant}
        onCancel={() => {
          setCreateModalVisible(false)
          setCreateForm({
            merchantName: '',
            contactPerson: '',
            contactPhone: '',
            businessLicense: '',
            contactEmail: '',
            merchantType: 'INDIVIDUAL',
            legalPerson: '',
            businessCategory: '',
            applymentId: '',
            subMchId: ''
          })
        }}
        confirmLoading={createLoading}
        width={600}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="商户名称" required>
                <Input
                  value={createForm.merchantName}
                  onChange={(e) => handleFormChange('merchantName', e.target.value)}
                  placeholder="请输入商户名称"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="商户类型" required>
                <Select
                  value={createForm.merchantType}
                  onChange={(value) => handleFormChange('merchantType', value)}
                >
                  <Select.Option value="INDIVIDUAL">个体户</Select.Option>
                  <Select.Option value="ENTERPRISE">企业</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="联系人" required>
                <Input
                  value={createForm.contactPerson}
                  onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                  placeholder="请输入联系人姓名"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系电话" required>
                <Input
                  value={createForm.contactPhone}
                  onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                  placeholder="请输入联系电话"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="营业执照号" required>
                <Input
                  value={createForm.businessLicense}
                  onChange={(e) => handleFormChange('businessLicense', e.target.value)}
                  placeholder="请输入营业执照号"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系邮箱">
                <Input
                  value={createForm.contactEmail}
                  onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                  placeholder="请输入联系邮箱"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="法定代表人">
                <Input
                  value={createForm.legalPerson}
                  onChange={(e) => handleFormChange('legalPerson', e.target.value)}
                  placeholder="请输入法定代表人"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="经营类目">
                <Select
                  value={createForm.businessCategory}
                  onChange={(value) => handleFormChange('businessCategory', value)}
                  placeholder="请选择经营类目"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  <Select.Option value="餐饮">餐饮</Select.Option>
                  <Select.Option value="零售">零售</Select.Option>
                  <Select.Option value="休闲娱乐">休闲娱乐</Select.Option>
                  <Select.Option value="生活服务">生活服务</Select.Option>
                  <Select.Option value="交通出行">交通出行</Select.Option>
                  <Select.Option value="汽车">汽车</Select.Option>
                  <Select.Option value="数字娱乐">数字娱乐</Select.Option>
                  <Select.Option value="教育培训">教育培训</Select.Option>
                  <Select.Option value="医疗健康">医疗健康</Select.Option>
                  <Select.Option value="金融保险">金融保险</Select.Option>
                  <Select.Option value="房地产">房地产</Select.Option>
                  <Select.Option value="酒类贸易">酒类贸易</Select.Option>
                  <Select.Option value="食品饮料">食品饮料</Select.Option>
                  <Select.Option value="服装鞋帽">服装鞋帽</Select.Option>
                  <Select.Option value="美妆个护">美妆个护</Select.Option>
                  <Select.Option value="母婴用品">母婴用品</Select.Option>
                  <Select.Option value="家居建材">家居建材</Select.Option>
                  <Select.Option value="数码家电">数码家电</Select.Option>
                  <Select.Option value="体育户外">体育户外</Select.Option>
                  <Select.Option value="图书音像">图书音像</Select.Option>
                  <Select.Option value="工业品">工业品</Select.Option>
                  <Select.Option value="农林牧渔">农林牧渔</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="微信申请单号">
                <Input
                  value={createForm.applymentId}
                  onChange={(e) => handleFormChange('applymentId', e.target.value)}
                  placeholder="请输入微信申请单号"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="微信特约商户号">
                <Input
                  value={createForm.subMchId}
                  onChange={(e) => handleFormChange('subMchId', e.target.value)}
                  placeholder="请输入特约商户号"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 编辑商户弹窗 */}
      <Modal
        title="编辑商户"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={editLoading}
        width={600}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="商户名称" required>
                <Input
                  value={editForm.merchantName}
                  onChange={(e) => handleEditFormChange('merchantName', e.target.value)}
                  placeholder="请输入商户名称"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="商户类型" required>
                <Select
                  value={editForm.merchantType}
                  onChange={(value) => handleEditFormChange('merchantType', value)}
                >
                  <Select.Option value="INDIVIDUAL">个体户</Select.Option>
                  <Select.Option value="ENTERPRISE">企业</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="联系人" required>
                <Input
                  value={editForm.contactPerson}
                  onChange={(e) => handleEditFormChange('contactPerson', e.target.value)}
                  placeholder="请输入联系人姓名"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系电话" required>
                <Input
                  value={editForm.contactPhone}
                  onChange={(e) => handleEditFormChange('contactPhone', e.target.value)}
                  placeholder="请输入联系电话"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="营业执照号" required>
                <Input
                  value={editForm.businessLicense}
                  onChange={(e) => handleEditFormChange('businessLicense', e.target.value)}
                  placeholder="请输入营业执照号"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系邮箱">
                <Input
                  value={editForm.contactEmail}
                  onChange={(e) => handleEditFormChange('contactEmail', e.target.value)}
                  placeholder="请输入联系邮箱"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="法定代表人">
                <Input
                  value={editForm.legalPerson}
                  onChange={(e) => handleEditFormChange('legalPerson', e.target.value)}
                  placeholder="请输入法定代表人"
                />
              </Form.Item>
            </Col>
                 <Col span={12}>
                   <Form.Item label="经营类目">
                     <Select
                       value={editForm.businessCategory}
                       onChange={(value) => handleEditFormChange('businessCategory', value)}
                       placeholder="请选择经营类目"
                       showSearch
                       filterOption={(input, option) =>
                         String(option?.children || '').toLowerCase().indexOf(input.toLowerCase()) >= 0
                       }
                     >
                       <Select.Option value="餐饮">餐饮</Select.Option>
                       <Select.Option value="零售">零售</Select.Option>
                       <Select.Option value="休闲娱乐">休闲娱乐</Select.Option>
                       <Select.Option value="生活服务">生活服务</Select.Option>
                       <Select.Option value="交通出行">交通出行</Select.Option>
                       <Select.Option value="汽车">汽车</Select.Option>
                       <Select.Option value="数字娱乐">数字娱乐</Select.Option>
                       <Select.Option value="教育培训">教育培训</Select.Option>
                       <Select.Option value="医疗健康">医疗健康</Select.Option>
                       <Select.Option value="金融保险">金融保险</Select.Option>
                       <Select.Option value="房地产">房地产</Select.Option>
                       <Select.Option value="酒类贸易">酒类贸易</Select.Option>
                       <Select.Option value="食品饮料">食品饮料</Select.Option>
                       <Select.Option value="服装鞋帽">服装鞋帽</Select.Option>
                       <Select.Option value="美妆个护">美妆个护</Select.Option>
                       <Select.Option value="母婴用品">母婴用品</Select.Option>
                       <Select.Option value="家居建材">家居建材</Select.Option>
                       <Select.Option value="数码家电">数码家电</Select.Option>
                       <Select.Option value="体育户外">体育户外</Select.Option>
                       <Select.Option value="图书音像">图书音像</Select.Option>
                       <Select.Option value="工业品">工业品</Select.Option>
                       <Select.Option value="农林牧渔">农林牧渔</Select.Option>
                       <Select.Option value="其他">其他</Select.Option>
                     </Select>
                   </Form.Item>
                 </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="微信申请单号">
                <Input
                  value={editForm.applymentId}
                  onChange={(e) => handleEditFormChange('applymentId', e.target.value)}
                  placeholder="请输入微信申请单号"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="微信特约商户号">
                <Input
                  value={editForm.subMchId}
                  onChange={(e) => handleEditFormChange('subMchId', e.target.value)}
                  placeholder="请输入特约商户号"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="商户状态">
                <Select
                  value={editForm.status}
                  onChange={(value) => handleEditFormChange('status', value)}
                >
                  <Select.Option value="pending">待审核</Select.Option>
                  <Select.Option value="active">已完成</Select.Option>
                  <Select.Option value="inactive">已禁用</Select.Option>
                  <Select.Option value="rejected">已驳回</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 商户详情弹窗 */}
      <Modal
        title={merchantDetail ? `商户详情 - ${merchantDetail.merchantName}` : '商户详情'}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setMerchantDetail(null)
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false)
              handleEditMerchant(merchantDetail)
            }}
            disabled={!merchantDetail}
          >
            编辑
          </Button>
        ]}
        width={700}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>加载商户详情...</p>
          </div>
        ) : merchantDetail ? (
          <div style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>商户编号:</strong> {merchantDetail.merchantNo || <Tag color="orange">待生成</Tag>}</p>
                  <p><strong>商户类型:</strong> {
                    merchantDetail.merchantType === 'INDIVIDUAL' ? (
                      <Tag color="blue">个体户</Tag>
                    ) : merchantDetail.merchantType === 'ENTERPRISE' ? (
                      <Tag color="purple">企业</Tag>
                    ) : (
                      <Tag color="default">未设置</Tag>
                    )
                  }</p>
                  <p><strong>营业执照:</strong> {merchantDetail.businessLicense || <span style={{ color: '#999' }}>未填写</span>}</p>
                  <p><strong>经营类目:</strong> {merchantDetail.businessCategory || <span style={{ color: '#999' }}>未填写</span>}</p>
                  <p><strong>状态:</strong>
                    <Tag color={merchantDetail.status === 'active' ? 'green' : merchantDetail.status === 'pending' ? 'orange' : 'red'}>
                      {merchantDetail.status === 'active' ? '✅ 已启用' :
                       merchantDetail.status === 'pending' ? '⏳ 待审核' :
                       merchantDetail.status === 'inactive' ? '🚫 已禁用' : '❌ 已驳回'}
                    </Tag>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="联系信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>联系人:</strong> {merchantDetail.contactPerson || <span style={{ color: '#999' }}>未填写</span>}</p>
                  <p><strong>联系电话:</strong> {merchantDetail.contactPhone || <span style={{ color: '#999' }}>未填写</span>}</p>
                  <p><strong>联系邮箱:</strong> {merchantDetail.contactEmail || <span style={{ color: '#999' }}>未填写</span>}</p>
                  <p><strong>法定代表人:</strong> {merchantDetail.legalPerson || <span style={{ color: '#999' }}>未填写</span>}</p>
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="微信支付信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>申请单号:</strong> {merchantDetail.applymentId || <Tag color="orange">待申请</Tag>}</p>
                  <p><strong>特约商户号:</strong> {merchantDetail.subMchId || <Tag color="orange">待生成</Tag>}</p>
                  <p><strong>二维码状态:</strong> {
                    merchantDetail.qrCode ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>已生成</Tag>
                    ) : (
                      <Tag color="orange" icon={<ClockCircleOutlined />}>未生成</Tag>
                    )
                  }</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="业务数据" size="small" style={{ marginBottom: 16 }}>
                  {merchantDetail.stats && merchantDetail.stats.paidOrders > 0 ? (
                    <>
                      <p><strong>总收款金额:</strong> <span style={{ color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}>
                        ¥{(merchantDetail.stats.totalAmount || 0).toFixed(2)}
                      </span></p>
                      <p><strong>总订单数:</strong> <span style={{ color: '#1890ff', fontWeight: 500 }}>
                        {merchantDetail.stats.paidOrders || 0} 笔
                      </span></p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
                        <ClockCircleOutlined /> 待处理: {merchantDetail.stats.pendingOrders || 0} 笔 |
                        已完成: {merchantDetail.stats.paidOrders || 0} 笔
                      </p>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                      <FileTextOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
                      <p style={{ margin: 0 }}>暂无交易记录</p>
                      <p style={{ fontSize: '12px', margin: 0 }}>该商户还未产生任何订单</p>
                    </div>
                  )}
                  <Divider style={{ margin: '12px 0' }} />
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    <strong>创建时间:</strong> {merchantDetail.createdAt ? formatDateTime(merchantDetail.createdAt) : '未知'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    <strong>更新时间:</strong> {merchantDetail.updatedAt ? formatDateTime(merchantDetail.updatedAt) : '未知'}
                  </p>
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>暂无数据</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

// 积分管理页面
const PointsPage: React.FC = () => {
  const [points, setPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<any>({
    total: 0,
    paymentReward: 0,
    mallConsumption: 0,
    adminAdjust: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('')
  const [recordTypeFilter, setRecordTypeFilter] = useState('all')
  const [merchantFilter, setMerchantFilter] = useState('all')

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchText, recordTypeFilter, merchantFilter])

  // 加载积分数据
  useEffect(() => {
    loadPoints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize, searchText, recordTypeFilter, merchantFilter])

  const loadPoints = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchText && { search: searchText }),
        ...(recordTypeFilter !== 'all' && { recordType: recordTypeFilter }),
        ...(merchantFilter !== 'all' && { merchantId: merchantFilter })
      })

      const result = await apiRequest(`/admin/points?${params}`)
      if (result.success) {
        // 修复：正确处理嵌套的数据结构
        const pointsList = result.data?.list || result.data || []
        const paginationData = result.data?.pagination || result.pagination || {}
        
        setPoints(Array.isArray(pointsList) ? pointsList : [])
        setPagination(prev => ({
          ...prev,
          total: paginationData.total || 0
        }))

        // 设置统计数据（从API或计算当前页）
        if ((result as any).stats) {
          setStats((result as any).stats)
        } else {
          // 如果API没有返回stats，计算当前页的统计
          const data = Array.isArray(pointsList) ? pointsList : []
          setStats({
            total: paginationData.total || 0,
            paymentReward: data.filter((p: any) =>
              p.recordType === 'payment_reward' || p.record_type === 'payment_reward' || p.type === 'payment_reward'
            ).length,
            mallConsumption: data.filter((p: any) =>
              p.recordType === 'mall_consumption' || p.record_type === 'mall_consumption' || p.type === 'mall_consumption'
            ).length,
            adminAdjust: data.filter((p: any) =>
              p.recordType === 'admin_adjust' || p.record_type === 'admin_adjust' || p.type === 'admin_adjust'
            ).length
          })
        }
      } else {
        message.error(result.message || '加载积分数据失败')
      }
    } catch (error) {
      console.error('Load points error:', error)
      message.error('加载积分数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (paginationConfig: any) => {
    setPagination({
      page: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: paginationConfig.total
    })
  }

  const columns = [
    {
      title: '用户信息',
      dataIndex: 'userName',
      key: 'user_info',
      width: 180,
      render: (userName: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{userName || record.userNickname || record.user_name || '未知用户'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.userId || record.user_id || '-'}</div>
          {(record.userPhone || record.user_phone) && (
            <div style={{ fontSize: '12px', color: '#999' }}>{record.userPhone || record.user_phone}</div>
          )}
        </div>
      )
    },
    {
      title: '积分变动',
      dataIndex: 'amount',
      key: 'pointsChange',
      width: 120,
      align: 'center' as const,
      render: (amount: number, record: any) => {
        const pointsValue = amount || record.pointsChange || record.points_change || 0;
        return (
          <span style={{
            color: pointsValue > 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 600,
            fontSize: '16px'
          }}>
            {pointsValue > 0 ? '+' : ''}{pointsValue}
          </span>
        );
      }
    },
    {
      title: '当前余额',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      width: 120,
      align: 'center' as const,
      render: (balance: number) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>
          {balance || 0}
        </span>
      )
    },
    {
      title: '消费商户',
      dataIndex: 'merchantName',
      key: 'merchantName',
      width: 200,
      render: (merchantName: string, record: any) => {
        const name = merchantName || record.merchant_name || '未知商户';
        const recordType = record.type || record.recordType || record.record_type || '';
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {recordType === 'payment_reward' ? '支付奖励' :
               recordType === 'mall_consumption' ? '商城消费' : 
               recordType === 'admin_adjust' ? '管理员调整' : '其他'}
            </div>
          </div>
        );
      }
    },
    {
      title: '详细描述',
      dataIndex: 'description',
      key: 'description',
      width: 280,
      ellipsis: true
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time: string, record: any) => {
        const timeValue = time || record.created_at;
        return formatDateTime(timeValue);
      }
    }
  ]

  return (
    <div>
      <h2>积分管理 - 用户消费记录</h2>
      <div style={{ marginBottom: 16, color: '#666' }}>
        查看所有用户的积分获得记录，包含消费商户和详细信息
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总积分记录"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="支付奖励"
              value={stats.paymentReward}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: '12px', color: '#999' }}>当前页</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="商城消费"
              value={stats.mallConsumption}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix={<span style={{ fontSize: '12px', color: '#999' }}>当前页</span>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="管理员调整"
              value={stats.adminAdjust}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#722ed1' }}
              suffix={<span style={{ fontSize: '12px', color: '#999' }}>当前页</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Input.Search
              placeholder="搜索用户昵称、手机号、用户ID、商户名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => setSearchText(value)}
              allowClear
              style={{ width: '100%' }}
              prefix={<SearchOutlined />}
            />
          </div>

          <div style={{ flex: '0 0 150px' }}>
            <Select
              value={recordTypeFilter}
              onChange={setRecordTypeFilter}
              style={{ width: '100%' }}
              options={[
                { label: '全部类型', value: 'all' },
                { label: '💰 支付奖励', value: 'payment_reward' },
                { label: '🛍️ 商城消费', value: 'mall_consumption' },
                { label: '⚙️ 管理员调整', value: 'admin_adjust' }
              ]}
            />
          </div>

          <div style={{ flex: '0 0 150px' }}>
            <Select
              value={merchantFilter}
              onChange={setMerchantFilter}
              style={{ width: '100%' }}
              placeholder="选择商户"
              options={[
                { label: '全部商户', value: 'all' }
                // 商户列表会在后续动态加载
              ]}
            />
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('')
              setRecordTypeFilter('all')
              setMerchantFilter('all')
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
          >
            重置
          </Button>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={points}
        loading={loading}
        rowKey="id"
        onChange={handleTableChange}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `共 ${total} 条积分记录`,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

// 订单管理页面（新增功能）
const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    status: '',
    merchantId: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [orderDetailVisible, setOrderDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadOrders()
    loadStats()
  }, [pagination.page, pagination.pageSize, filters])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.merchantId && { merchantId: filters.merchantId }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      })

      const result = await apiRequest(`/admin/orders?${params}`)
      if (result.success) {
        // 处理后端返回的数据结构 { data: { list: [...], pagination: {...} } }
        const ordersList = result.data?.list || result.data || []
        const paginationData = result.data?.pagination || result.pagination || {}
        setOrders(Array.isArray(ordersList) ? ordersList : [])
        setPagination(prev => ({
          ...prev,
          total: paginationData.total || 0
        }))
      } else {
        message.error(result.message || '加载订单数据失败')
      }
    } catch (error) {
      console.error('Load orders error:', error)
      message.error('加载订单数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await apiRequest('/admin/orders/stats')
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Load stats error:', error)
    }
  }

  const handleTableChange = (paginationConfig: any) => {
    setPagination({
      page: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: paginationConfig.total
    })
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const result = await apiRequest(`/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })
      
      if (result.success) {
        message.success('订单状态更新成功')
        loadOrders()
        loadStats()
      } else {
        message.error(result.message || '更新订单状态失败')
      }
    } catch (error) {
      console.error('Update order status error:', error)
      message.error('更新订单状态失败')
    }
  }

  const handleViewDetail = async (order: any) => {
    setDetailLoading(true)
    setOrderDetailVisible(true)
    
    try {
      const result = await apiRequest(`/admin/orders/${order.id}`)
      if (result.success) {
        setSelectedOrder(result.data) // 修复：直接使用 result.data
      } else {
        message.error('获取订单详情失败')
        setSelectedOrder(order) // 使用列表数据作为备用
      }
    } catch (error) {
      console.error('Get order detail error:', error)
      message.error('获取订单详情失败')
      setSelectedOrder(order) // 使用列表数据作为备用
    } finally {
      setDetailLoading(false)
    }
  }

  const handleExportOrders = async () => {
    try {
      const params = new URLSearchParams({
        ...(filters.status && { status: filters.status }),
        ...(filters.merchantId && { merchantId: filters.merchantId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        format: 'json'
      })

      const result = await apiRequest(`/admin/orders/export?${params}`, {
        method: 'POST'
      })
      
      if (result.success) {
        // 创建下载链接
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `orders_${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        
        message.success(`成功导出 ${result.data.total} 条订单数据`)
      } else {
        message.error('导出订单数据失败')
      }
    } catch (error) {
      console.error('Export orders error:', error)
      message.error('导出订单数据失败')
    }
  }

  const columns = [
    {
      title: '订单信息',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
              {text}
            </Button>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ID: {record.id}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(record.createdAt).toLocaleString()}
          </div>
        </div>
      )
    },
    {
      title: '用户信息',
      dataIndex: 'userNickname',
      key: 'user',
      width: 150,
      render: (nickname: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{nickname || '未知用户'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.userId || '-'}</div>
          {record.userPhone && (
            <div style={{ fontSize: '12px', color: '#999' }}>{record.userPhone}</div>
          )}
        </div>
      )
    },
    {
      title: '商户信息',
      dataIndex: 'actualMerchantName',
      key: 'merchant',
      width: 180,
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name || record.merchantName || '未知商户'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.merchantId || '-'}</div>
          {record.merchantContact && (
            <div style={{ fontSize: '12px', color: '#999' }}>{record.merchantContact}</div>
          )}
        </div>
      )
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <div>
          <div style={{ fontWeight: 500, color: '#1890ff' }}>
            ¥{(amount / 100).toFixed(2)}
          </div>
        </div>
      )
    },
    {
      title: '奖励积分',
      dataIndex: 'pointsAwarded',
      key: 'pointsAwarded',
      width: 100,
      render: (points: number) => (
        <Tag color="green">{points || 0}分</Tag>
      )
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string, record: any) => {
        const statusMap: any = {
          'pending': { color: 'orange', text: '待支付' },
          'paid': { color: 'green', text: '已支付' },
          'cancelled': { color: 'red', text: '已取消' },
          'expired': { color: 'gray', text: '已过期' },
          'refunded': { color: 'purple', text: '已退款' }
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status }
        
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (text: any, record: any) => (
        <div>
          <Button 
            size="small" 
            onClick={() => handleViewDetail(record)}
            style={{ marginRight: 8 }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'cancel',
                    label: '取消订单',
                    onClick: () => handleStatusChange(record.id, 'cancelled')
                  }
                ]
              }}
              trigger={['click']}
            >
              <Button size="small">操作</Button>
            </Dropdown>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总订单数" value={stats?.total || 0} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="已支付订单" 
                value={stats?.paidCount || 0}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="总交易金额" 
                value={(stats?.totalAmount || 0) / 100}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="支付成功率" 
                value={stats?.successRate || 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 订单列表 */}
      <Card 
        title="订单管理" 
        extra={
          <div>
            <Button 
              onClick={loadOrders}
              loading={loading}
              style={{ marginRight: 8 }}
            >
              刷新数据
            </Button>
            <Button 
              type="primary"
              onClick={handleExportOrders}
            >
              导出数据
            </Button>
          </div>
        }
      >
        {/* 搜索和筛选 */}
        <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 6 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Input.Search
                placeholder="搜索订单号、商户、用户"
                allowClear
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={loadOrders}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="订单状态"
                allowClear
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value || '' }))}
                style={{ width: '100%' }}
              >
                <Select.Option value="pending">待支付</Select.Option>
                <Select.Option value="paid">已支付</Select.Option>
                <Select.Option value="cancelled">已取消</Select.Option>
                <Select.Option value="expired">已过期</Select.Option>
                <Select.Option value="refunded">已退款</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <Input
                placeholder="商户ID"
                allowClear
                value={filters.merchantId}
                onChange={(e) => setFilters(prev => ({ ...prev, merchantId: e.target.value }))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Button type="primary" onClick={loadOrders} style={{ width: '100%' }}>
                搜索
              </Button>
            </Col>
          </Row>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={orders} 
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: (total) => `共 ${total} 个订单`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title={selectedOrder ? `订单详情 - ${selectedOrder.orderNo}` : '订单详情'}
        open={orderDetailVisible}
        onCancel={() => {
          setOrderDetailVisible(false)
          setSelectedOrder(null)
        }}
        footer={[
          <Button key="close" onClick={() => setOrderDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>加载订单详情...</p>
          </div>
        ) : selectedOrder ? (
          <div style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="订单信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>订单号:</strong> {selectedOrder.orderNo}</p>
                  <p><strong>订单金额:</strong> ¥{(selectedOrder.amount / 100).toFixed(2)}</p>
                  <p><strong>奖励积分:</strong> {selectedOrder.pointsAwarded}</p>
                  <p><strong>订单状态:</strong> 
                    <Tag color={selectedOrder.status === 'paid' ? 'green' : 'orange'}>
                      {selectedOrder.status === 'paid' ? '已支付' : '待支付'}
                    </Tag>
                  </p>
                  <p><strong>支付方式:</strong> {selectedOrder.paymentMethod}</p>
                  <p><strong>微信交易号:</strong> {selectedOrder.transactionId || '无'}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="时间信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>创建时间:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p><strong>支付时间:</strong> {selectedOrder.paidAt ? new Date(selectedOrder.paidAt).toLocaleString() : '未支付'}</p>
                  <p><strong>过期时间:</strong> {selectedOrder.expiredAt ? new Date(selectedOrder.expiredAt).toLocaleString() : '无'}</p>
                  <p><strong>更新时间:</strong> {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString() : '无'}</p>
                </Card>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Card title="用户信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>用户昵称:</strong> {selectedOrder.user?.nickname || '未知'}</p>
                  <p><strong>微信ID:</strong> {selectedOrder.user?.wechatId || '未知'}</p>
                  <p><strong>手机号:</strong> {selectedOrder.user?.phone || '未设置'}</p>
                  <p><strong>积分余额:</strong> {selectedOrder.user?.pointsBalance || 0}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="商户信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>商户名称:</strong> {selectedOrder.merchant?.merchantName || '未知'}</p>
                  <p><strong>商户编号:</strong> {selectedOrder.merchant?.merchantNo || '未设置'}</p>
                  <p><strong>联系人:</strong> {selectedOrder.merchant?.contactPerson || '未设置'}</p>
                  <p><strong>联系电话:</strong> {selectedOrder.merchant?.contactPhone || '未设置'}</p>
                  <p><strong>特约商户号:</strong> {selectedOrder.merchant?.subMchId || '未设置'}</p>
                </Card>
              </Col>
            </Row>

            {selectedOrder.pointsRecords && selectedOrder.pointsRecords.length > 0 && (
              <Card title="积分记录" size="small">
                <Table
                  size="small"
                  dataSource={selectedOrder.pointsRecords}
                  pagination={false}
                  columns={[
                    { title: '积分变动', dataIndex: 'pointsChange', key: 'pointsChange' },
                    { title: '变动后余额', dataIndex: 'pointsBalance', key: 'pointsBalance' },
                    { title: '来源', dataIndex: 'source', key: 'source' },
                    { title: '描述', dataIndex: 'description', key: 'description' },
                    { 
                      title: '时间', 
                      dataIndex: 'createdAt', 
                      key: 'createdAt',
                      render: (time: string) => new Date(time).toLocaleString()
                    }
                  ]}
                />
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>暂无数据</p>
          </div>
        )}
      </Modal>
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
      key: 'orders',
      icon: <FileTextOutlined />,
      label: '订单管理',
      onClick: () => navigate('/orders')
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

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  // 获取当前选中的菜单
  const getSelectedKey = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'dashboard'
    if (path.includes('/users')) return 'users'
    if (path.includes('/merchants')) return 'merchants'
    if (path.includes('/orders')) return 'orders'
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
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
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

// 系统设置页面 - 管理员用户管理
const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('admin-users')
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  
  // 表单数据
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    role: 'admin',
    permissions: {
      users: true,
      merchants: true,
      orders: true,
      points: true,
      settings: false,
      admin_users: false
    }
  })
  
  const [editForm, setEditForm] = useState({
    id: '',
    username: '',
    realName: '',
    email: '',
    phone: '',
    role: 'admin',
    status: 'active',
    permissions: {
      users: true,
      merchants: true,
      orders: true,
      points: true,
      settings: false,
      admin_users: false
    }
  })

  // 加载管理员用户列表
  const loadAdminUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      })
      
      const result = await apiRequest(`/admin/admin-users?${params}`)
      if (result.success) {
        setAdminUsers(result.data || [])
        setStats((result as any).stats || {})
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || 0
        }))
      } else {
        message.error(result.message || '加载管理员用户失败')
      }
    } catch (error) {
      console.error('Load admin users error:', error)
      message.error('加载管理员用户失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'admin-users') {
      loadAdminUsers()
    }
  }, [activeTab, pagination.page, pagination.pageSize])

  // 创建管理员用户
  const handleCreateUser = async () => {
    try {
      setCreateLoading(true)
      
      // 验证必填字段
      if (!createForm.username || !createForm.password) {
        message.error('用户名和密码为必填项')
        return
      }
      
      const result = await apiRequest('/admin/admin-users', {
        method: 'POST',
        body: JSON.stringify(createForm)
      })
      
      if (result.success) {
        message.success('管理员用户创建成功')
        setCreateModalVisible(false)
        setCreateForm({
          username: '',
          password: '',
          realName: '',
          email: '',
          phone: '',
          role: 'admin',
          permissions: {
            users: true,
            merchants: true,
            orders: true,
            points: true,
            settings: false,
            admin_users: false
          }
        })
        loadAdminUsers()
      } else {
        message.error(result.message || '创建管理员用户失败')
      }
    } catch (error) {
      console.error('Create admin user error:', error)
      message.error('创建管理员用户失败')
    } finally {
      setCreateLoading(false)
    }
  }

  // 编辑管理员用户
  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setEditForm({
      id: user.id,
      username: user.username,
      realName: user.realName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      permissions: user.permissions || {
        users: true,
        merchants: true,
        orders: true,
        points: true,
        settings: false,
        admin_users: false
      }
    })
    setEditModalVisible(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      setEditLoading(true)
      
      const result = await apiRequest(`/admin/admin-users/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          realName: editForm.realName,
          email: editForm.email,
          phone: editForm.phone,
          role: editForm.role,
          status: editForm.status,
          permissions: editForm.permissions
        })
      })
      
      if (result.success) {
        message.success('管理员用户更新成功')
        setEditModalVisible(false)
        loadAdminUsers()
      } else {
        message.error(result.message || '更新管理员用户失败')
      }
    } catch (error) {
      console.error('Update admin user error:', error)
      message.error('更新管理员用户失败')
    } finally {
      setEditLoading(false)
    }
  }

  // 删除管理员用户
  const handleDeleteUser = (user: any) => {
    if (user.role === 'super_admin') {
      message.error('不能删除超级管理员')
      return
    }
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除管理员用户 "${user.username}" 吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await apiRequest(`/admin/admin-users/${user.id}`, {
            method: 'DELETE'
          })
          
          if (result.success) {
            message.success('管理员用户删除成功')
            loadAdminUsers()
          } else {
            message.error(result.message || '删除管理员用户失败')
          }
        } catch (error) {
          console.error('Delete admin user error:', error)
          message.error('删除管理员用户失败')
        }
      }
    })
  }

  // 重置密码
  const handleResetPassword = (user: any) => {
    Modal.confirm({
      title: '重置密码',
      content: (
        <div>
          <p>确定要重置用户 "{user.username}" 的密码吗？</p>
          <p style={{ color: '#fa8c16' }}>新密码将设置为: <strong>123456</strong></p>
        </div>
      ),
      onOk: async () => {
        try {
          const result = await apiRequest(`/admin/admin-users/${user.id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword: '123456' })
          })
          
          if (result.success) {
            message.success('密码重置成功，新密码为: 123456')
          } else {
            message.error(result.message || '密码重置失败')
          }
        } catch (error) {
          console.error('Reset password error:', error)
          message.error('密码重置失败')
        }
      }
    })
  }

  // 管理员用户表格列定义
  const adminUserColumns = [
    {
      title: '用户信息',
      dataIndex: 'username',
      key: 'username',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            {record.role === 'super_admin' ? <CrownOutlined style={{ color: '#faad14', marginRight: 4 }} /> : 
             record.role === 'admin' ? <TeamOutlined style={{ color: '#1890ff', marginRight: 4 }} /> :
             <UserOutlined style={{ color: '#52c41a', marginRight: 4 }} />}
            {text}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.realName || '未设置姓名'}
          </div>
        </div>
      )
    },
    {
      title: '角色权限',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string, record: any) => {
        const roleMap: any = {
          'super_admin': { color: 'gold', text: '超级管理员', icon: <CrownOutlined /> },
          'admin': { color: 'blue', text: '管理员', icon: <TeamOutlined /> },
          'readonly': { color: 'green', text: '只读用户', icon: <EyeOutlined /> }
        }
        const roleInfo = roleMap[role] || { color: 'default', text: role, icon: <UserOutlined /> }
        
        return (
          <div>
            <Tag color={roleInfo.color} icon={roleInfo.icon}>
              {roleInfo.text}
            </Tag>
            <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
              权限: {Object.values(record.permissions || {}).filter(Boolean).length} 项
            </div>
          </div>
        )
      }
    },
    {
      title: '联系信息',
      key: 'contact',
      width: 180,
      render: (text: any, record: any) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            📧 {record.email || '未设置'}
          </div>
          <div style={{ fontSize: '12px', marginTop: 2 }}>
            📱 {record.phone || '未设置'}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: any = {
          'active': { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
          'locked': { color: 'red', text: '锁定', icon: <LockOutlined /> },
          'suspended': { color: 'orange', text: '暂停', icon: <ExclamationCircleOutlined /> }
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status, icon: <QuestionCircleOutlined /> }
        
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        )
      }
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (time: string) => (
        <div style={{ fontSize: '12px' }}>
          {time ? new Date(time).toLocaleDateString('zh-CN') : '从未登录'}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (text: any, record: any) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleEditUser(record)
            }}
          >
            编辑
          </Button>
          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleResetPassword(record)
            }}
          >
            重置密码
          </Button>
          {record.roleCode !== 'super_admin' && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record)}
            >
              删除
            </Button>
          )}
        </div>
      )
    }
  ]

  const tabItems = [
    {
      key: 'admin-users',
      label: (
        <span>
          <TeamOutlined />
          管理员用户
        </span>
      )
    },
    {
      key: 'system-status',
      label: (
        <span>
          <SafetyOutlined />
          系统状态
        </span>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>系统设置</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>
            管理员账户管理和系统配置
          </p>
        </div>
      </div>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems.map(tab => ({
            ...tab,
            children: tab.key === 'admin-users' ? (
              <div>
                {/* 统计卡片 */}
                {stats && (
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="总管理员"
                          value={stats.total || 0}
                          prefix={<TeamOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="在线状态"
                          value={stats.active || 0}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="超级管理员"
                          value={stats.superAdmins || 0}
                          prefix={<CrownOutlined />}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="普通管理员"
                          value={stats.admins || 0}
                          prefix={<UserOutlined />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                )}
                
                {/* 操作按钮 */}
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                      style={{ marginRight: 8 }}
                    >
                      添加管理员
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={loadAdminUsers}
                      loading={loading}
                    >
                      刷新
                    </Button>
                  </div>
                </div>

                {/* 管理员列表 */}
                <Table
                  columns={adminUserColumns}
                  dataSource={adminUsers}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    current: pagination.page,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showTotal: (total) => `共 ${total} 个管理员`,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                      setPagination({ page, pageSize: pageSize || 10, total: pagination.total })
                    }
                  }}
                  scroll={{ x: 1000 }}
                />
              </div>
            ) : (
              <div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="系统状态" size="small">
                      <div style={{ padding: '16px 0' }}>
                        <p style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          API服务运行正常
                        </p>
                        <p style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          数据库连接正常
                        </p>
                        <p style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          系统版本: v1.0.0
                        </p>
                        <p style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                          <SecurityScanOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                          安全状态: 正常
                        </p>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="系统信息" size="small">
                      <div style={{ padding: '16px 0' }}>
                        <p><strong>服务器时间:</strong> {new Date().toLocaleString('zh-CN')}</p>
                        <p><strong>运行时长:</strong> 正常运行</p>
                        <p><strong>数据库:</strong> MySQL 8.0</p>
                        <p><strong>缓存状态:</strong> Redis 正常</p>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            )
          }))}
        />
      </Card>

      {/* 创建管理员用户弹窗 */}
      <Modal
        title="添加管理员用户"
        open={createModalVisible}
        onOk={handleCreateUser}
        onCancel={() => setCreateModalVisible(false)}
        confirmLoading={createLoading}
        width={600}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="用户名" required>
                <Input
                  value={createForm.username}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="请输入用户名"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="密码" required>
                <Input.Password
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="请输入密码"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="真实姓名">
                <Input
                  value={createForm.realName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, realName: e.target.value }))}
                  placeholder="请输入真实姓名"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="角色">
                <Select
                  value={createForm.role}
                  onChange={(value) => setCreateForm(prev => ({ ...prev, role: value }))}
                >
                  <Select.Option value="admin">管理员</Select.Option>
                  <Select.Option value="readonly">只读用户</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="邮箱">
                <Input
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入邮箱"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号">
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入手机号"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="权限设置">
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 12 }}>
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={createForm.permissions.users}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, users: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    用户管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={createForm.permissions.merchants}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, merchants: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    商户管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={createForm.permissions.orders}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, orders: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    订单管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={createForm.permissions.points}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, points: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    积分管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={createForm.permissions.settings}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, settings: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    系统设置
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={createForm.permissions.admin_users}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, admin_users: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    管理员管理
                  </label>
                </Col>
              </Row>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑管理员用户弹窗 */}
      <Modal
        title={`编辑管理员用户 - ${editForm.username}`}
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={editLoading}
        width={600}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="真实姓名">
                <Input
                  value={editForm.realName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, realName: e.target.value }))}
                  placeholder="请输入真实姓名"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态">
                <Select
                  value={editForm.status}
                  onChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <Select.Option value="active">正常</Select.Option>
                  <Select.Option value="locked">锁定</Select.Option>
                  <Select.Option value="suspended">暂停</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="角色">
                <Select
                  value={editForm.role}
                  onChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
                  disabled={selectedUser?.role === 'super_admin'}
                >
                  <Select.Option value="admin">管理员</Select.Option>
                  <Select.Option value="readonly">只读用户</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="邮箱">
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="请输入邮箱"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="手机号">
            <Input
              value={editForm.phone}
              onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="请输入手机号"
            />
          </Form.Item>
          
          <Form.Item label="权限设置">
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 12 }}>
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={editForm.permissions.users}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, users: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    用户管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={editForm.permissions.merchants}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, merchants: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    商户管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={editForm.permissions.orders}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, orders: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    订单管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={editForm.permissions.points}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, points: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    积分管理
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={editForm.permissions.settings}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, settings: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    系统设置
                  </label>
                </Col>
                <Col span={8}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={editForm.permissions.admin_users}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, admin_users: e.target.checked }
                      }))}
                      style={{ marginRight: 8 }}
                    />
                    管理员管理
                  </label>
                </Col>
              </Row>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// 主应用组件
function App() {
  return (
    <ErrorBoundary>
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
            <Route path="/orders" element={
              <AuthGuard>
                <MainLayout>
                  <OrdersPage />
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
    </ErrorBoundary>
  )
}

export default App
