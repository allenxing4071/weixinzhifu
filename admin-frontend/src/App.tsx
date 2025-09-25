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
  Form
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
  MenuUnfoldOutlined,
  QrcodeOutlined,
  PlusOutlined
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
      console.log('🔄 开始加载商户列表...')
      const result = await apiRequest('/admin/merchants')
      
      if (result.success) {
        console.log('✅ 商户数据加载成功:', result.data)
        setMerchants(result.data.merchants || [])
        setDataSource(result.dataSource || 'unknown')
        message.success(`加载了${result.data.merchants?.length || 0}个商户 (${result.dataSource === 'database' ? '数据库' : '模拟数据'})`)
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
      console.log('📊 开始加载统计数据...')
      const result = await apiRequest('/admin/merchants/stats')
      
      if (result.success) {
        console.log('✅ 统计数据加载成功:', result.data)
        setStats(result.data)
      } else {
        console.warn('⚠️ 统计数据加载失败:', result.message)
      }
    } catch (error) {
      console.error('❌ 加载统计失败:', error)
    }
  }

  // 生成单个商户二维码
  const generateQRCode = async (merchant: any, amount: number = 50) => {
    setQrLoading(true)
    try {
      const result = await apiRequest(`/admin/merchants/${merchant.merchantId || merchant.id}/qrcode`, {
        method: 'POST',
        body: JSON.stringify({ fixedAmount: amount })
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
    generateQRCode(merchant, 50)
  }

  // 查看商户详情
  const handleViewDetail = async (merchant: any) => {
    setDetailLoading(true)
    setDetailModalVisible(true)
    
    try {
      console.log('🔍 查看商户详情:', merchant.id)
      const result = await apiRequest(`/admin/merchants/${merchant.id}`)
      
      if (result.success) {
        setMerchantDetail(result.data.merchant)
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
      console.log('🆕 创建新商户:', createForm)
      
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
          fixedAmount: 50
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
          console.log(`🔄 开始批量${action}商户:`, selectedRowKeys)
          
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
          console.log('🗑️ 开始批量删除商户:', selectedRowKeys)
          
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
      link.href = `data:image/png;base64,${qrCodeData.qrCodeImage}`
      link.download = `qrcode_${selectedMerchant?.merchantId || selectedMerchant?.id}.png`
      link.click()
    }
  }

  // 编辑商户
  const handleEditMerchant = (record: any) => {
    console.log('编辑商户:', record)
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
      console.log('💾 保存编辑商户:', editForm)
      
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
      dataIndex: 'merchantName',
      key: 'merchantName',
      width: 250,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            编号: {record.merchantNo} | ID: {record.id}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            类型: {record.merchantType === 'INDIVIDUAL' ? '个体户' : '企业'} | 
            申请单: {record.applymentId || '未设置'}
          </div>
        </div>
      )
    },
    {
      title: '联系信息',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 180,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.contactPhone}</div>
          {record.contactEmail && (
            <div style={{ fontSize: '12px', color: '#999' }}>{record.contactEmail}</div>
          )}
        </div>
      )
    },
    {
      title: '状态信息',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string, record: any) => {
        const statusMap: any = {
          'active': { color: 'green', text: '活跃' },
          'pending': { color: 'orange', text: '待审核' },
          'inactive': { color: 'red', text: '已停用' }
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status }
        
        return (
          <div>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            {record.subMchId && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: 4 }}>
                微信: {record.subMchId}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: '业务数据',
      key: 'business',
      width: 120,
      render: (text: any, record: any) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            ¥{record.totalAmount || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.totalOrders || 0}单
          </div>
        </div>
      )
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
            disabled={!record.subMchId || record.status !== 'active'}
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
      disabled: record.status !== '已完成'
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
            <Statistic title="已完成" value={stats?.completed || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="审核中" value={stats?.auditing || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已驳回" value={stats?.rejected || 0} />
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
                  console.log('搜索:', value)
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
                  console.log('筛选状态:', value)
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
                  console.log('筛选类型:', value)
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
                  console.log('筛选二维码:', value)
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
                src={`data:image/png;base64,${qrCodeData.qrCodeImage}`}
                alt="商户支付二维码"
                style={{ width: 200, height: 200 }}
              />
            </div>
            <p style={{ color: '#666', fontSize: '14px' }}>
              扫码支付金额: ¥{qrCodeData.amount || '50.00'}
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
                  <p><strong>商户编号:</strong> {merchantDetail.merchantNo || '未设置'}</p>
                  <p><strong>商户类型:</strong> {merchantDetail.merchantType === 'INDIVIDUAL' ? '个体户' : '企业'}</p>
                  <p><strong>营业执照:</strong> {merchantDetail.businessLicense || '未设置'}</p>
                  <p><strong>经营类目:</strong> {merchantDetail.businessCategory || '未设置'}</p>
                  <p><strong>状态:</strong> 
                    <Tag color={merchantDetail.status === 'active' ? 'green' : merchantDetail.status === 'pending' ? 'orange' : 'red'}>
                      {merchantDetail.status === 'active' ? '已完成' : 
                       merchantDetail.status === 'pending' ? '待审核' : 
                       merchantDetail.status === 'inactive' ? '已禁用' : '已驳回'}
                    </Tag>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="联系信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>联系人:</strong> {merchantDetail.contactPerson || '未设置'}</p>
                  <p><strong>联系电话:</strong> {merchantDetail.contactPhone || '未设置'}</p>
                  <p><strong>联系邮箱:</strong> {merchantDetail.contactEmail || '未设置'}</p>
                  <p><strong>法定代表人:</strong> {merchantDetail.legalPerson || '未设置'}</p>
                </Card>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Card title="微信支付信息" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>申请单号:</strong> {merchantDetail.applymentId || '未设置'}</p>
                  <p><strong>特约商户号:</strong> {merchantDetail.subMchId || '未设置'}</p>
                  <p><strong>二维码状态:</strong> 
                    <Tag color={merchantDetail.qrCode ? 'green' : 'orange'}>
                      {merchantDetail.qrCode ? '已生成' : '未生成'}
                    </Tag>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="业务数据" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>总收款金额:</strong> ¥{merchantDetail.totalAmount || 0}</p>
                  <p><strong>总订单数:</strong> {merchantDetail.totalOrders || 0}</p>
                  <p><strong>创建时间:</strong> {merchantDetail.createdAt ? new Date(merchantDetail.createdAt).toLocaleString() : '未知'}</p>
                  <p><strong>更新时间:</strong> {merchantDetail.updatedAt ? new Date(merchantDetail.updatedAt).toLocaleString() : '未知'}</p>
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
