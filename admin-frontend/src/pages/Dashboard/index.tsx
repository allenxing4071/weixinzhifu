// 仪表板页面

import React, { useEffect } from 'react'
import { Row, Col, Card, Alert, Table, Tag, Button } from 'antd'
import {
  UserOutlined,
  ShopOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../store'
import { 
  fetchDashboardStats, 
  selectDashboardStats, 
  selectDashboardLoading,
  selectDashboardError 
} from '../../store/slices/dashboardSlice'
import StatsCard from '../../components/StatsCard'
import ChartContainer from '../../components/Charts/ChartContainer'
import './index.css'

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const stats = useAppSelector(selectDashboardStats)
  const loading = useAppSelector(selectDashboardLoading)
  const error = useAppSelector(selectDashboardError)

  // 页面加载时获取数据
  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  // 刷新数据
  const handleRefresh = () => {
    dispatch(fetchDashboardStats())
  }

  // 模拟数据（当API还未完全实现时）
  const mockStats = {
    overview: {
      totalUsers: 10234,
      activeUsers: 8567,
      totalMerchants: 156,
      activeMerchants: 142,
      todayOrders: 1234,
      todayAmount: 582300,
      todayPoints: 582300,
      todayNewUsers: 23
    },
    trends: {
      userGrowth: [
        { date: '12-14', value: 100 },
        { date: '12-15', value: 120 },
        { date: '12-16', value: 95 },
        { date: '12-17', value: 140 },
        { date: '12-18', value: 160 },
        { date: '12-19', value: 180 },
        { date: '12-20', value: 200 }
      ],
      paymentTrend: [
        { date: '12-14', value: 45000 },
        { date: '12-15', value: 52000 },
        { date: '12-16', value: 38000 },
        { date: '12-17', value: 62000 },
        { date: '12-18', value: 71000 },
        { date: '12-19', value: 58000 },
        { date: '12-20', value: 68000 }
      ],
      pointsTrend: [
        { date: '12-14', value: 45000 },
        { date: '12-15', value: 52000 },
        { date: '12-16', value: 38000 },
        { date: '12-17', value: 62000 },
        { date: '12-18', value: 71000 },
        { date: '12-19', value: 58000 },
        { date: '12-20', value: 68000 }
      ]
    },
    alerts: [
      {
        id: '1',
        type: 'warning' as const,
        title: '支付异常率偏高',
        message: '今日支付异常率达到3.2%，建议检查支付通道',
        value: '3.2%',
        time: '10分钟前',
        handled: false
      },
      {
        id: '2', 
        type: 'info' as const,
        title: '新商户申请',
        message: '有5个新商户申请待审核',
        value: '5',
        time: '30分钟前',
        handled: false
      }
    ]
  }

  const displayStats = stats || mockStats

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toLocaleString()
  }

  // 格式化金额
  const formatAmount = (amount: number): string => {
    return '¥' + (amount / 100).toLocaleString('zh-CN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }

  // 近期交易数据
  const recentOrders = [
    {
      key: '1',
      orderNo: '20241220143025123456',
      userName: '张三',
      merchantName: '小米便利店',
      amount: 5800,
      points: 58,
      status: 'paid',
      time: '2分钟前'
    },
    {
      key: '2',
      orderNo: '20241220142856789012',
      userName: '李四',
      merchantName: '星巴克咖啡',
      amount: 3500,
      points: 35,
      status: 'paid',
      time: '5分钟前'
    },
    {
      key: '3',
      orderNo: '20241220142634567890',
      userName: '王五',
      merchantName: '麦当劳',
      amount: 4200,
      points: 42,
      status: 'paid',
      time: '8分钟前'
    }
  ]

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text.slice(-12)}...
        </span>
      )
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 80
    },
    {
      title: '商户',
      dataIndex: 'merchantName',
      key: 'merchantName',
      width: 100
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 80,
      render: (amount: number) => formatAmount(amount)
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 60,
      render: (points: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          +{points}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color="green">已支付</Tag>
      )
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 80
    }
  ]

  return (
    <div className="dashboard-container">
      {/* 页面标题和刷新按钮 */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">仪表板</h2>
          <p className="dashboard-subtitle">积分营销系统运营概览</p>
        </div>
        <Button 
          icon={<SyncOutlined />} 
          onClick={handleRefresh}
          loading={loading === 'loading'}
        >
          刷新数据
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} className="dashboard-stats">
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="总用户数"
            value={formatNumber(displayStats.overview.totalUsers)}
            trend={{ value: 5.2, type: 'up', period: '较昨日' }}
            icon={<UserOutlined />}
            color="#1890ff"
            loading={loading === 'loading'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="活跃用户"
            value={formatNumber(displayStats.overview.activeUsers)}
            trend={{ value: 3.1, type: 'up', period: '较昨日' }}
            icon={<UserOutlined />}
            color="#52c41a"
            loading={loading === 'loading'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="总商户数"
            value={displayStats.overview.totalMerchants}
            trend={{ value: 2.8, type: 'up', period: '较昨日' }}
            icon={<ShopOutlined />}
            color="#722ed1"
            loading={loading === 'loading'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="今日新增"
            value={displayStats.overview.todayNewUsers}
            trend={{ value: 12, type: 'down', period: '较昨日' }}
            icon={<UserOutlined />}
            color="#fa541c"
            loading={loading === 'loading'}
          />
        </Col>
      </Row>

      {/* 交易和积分指标 */}
      <Row gutter={[16, 16]} className="dashboard-stats">
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="今日交易额"
            value={formatAmount(displayStats.overview.todayAmount)}
            trend={{ value: 8.9, type: 'up', period: '较昨日' }}
            icon={<ShoppingCartOutlined />}
            color="#13c2c2"
            loading={loading === 'loading'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="今日订单数"
            value={displayStats.overview.todayOrders}
            trend={{ value: 12.3, type: 'up', period: '较昨日' }}
            icon={<ShoppingCartOutlined />}
            color="#52c41a"
            loading={loading === 'loading'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="积分发放"
            value={formatNumber(displayStats.overview.todayPoints)}
            trend={{ value: 8.9, type: 'up', period: '较昨日' }}
            icon={<GiftOutlined />}
            color="#faad14"
            loading={loading === 'loading'}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatsCard
            title="平均客单价"
            value={formatAmount(Math.floor(displayStats.overview.todayAmount / displayStats.overview.todayOrders))}
            trend={{ value: 2.1, type: 'down', period: '较昨日' }}
            icon={<ShoppingCartOutlined />}
            color="#eb2f96"
            loading={loading === 'loading'}
          />
        </Col>
      </Row>

      {/* 图表和列表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 支付趋势图 */}
        <Col xs={24} lg={12}>
          <ChartContainer
            title="近7日支付趋势"
            type="line"
            data={{
              xAxis: displayStats.trends.paymentTrend.map(item => item.date),
              series: [{
                name: '支付金额',
                data: displayStats.trends.paymentTrend.map(item => item.value / 100),
                color: '#1890ff'
              }]
            }}
            height={300}
            loading={loading === 'loading'}
            onRefresh={handleRefresh}
          />
        </Col>

        {/* 用户增长图 */}
        <Col xs={24} lg={12}>
          <ChartContainer
            title="近7日用户增长"
            type="area"
            data={{
              xAxis: displayStats.trends.userGrowth.map(item => item.date),
              series: [{
                name: '新增用户',
                data: displayStats.trends.userGrowth.map(item => item.value),
                color: '#52c41a'
              }]
            }}
            height={300}
            loading={loading === 'loading'}
            onRefresh={handleRefresh}
          />
        </Col>
      </Row>

      {/* 预警信息和近期交易 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 系统预警 */}
        <Col xs={24} lg={12}>
          <Card title="系统预警" size="small" className="dashboard-alerts">
            {displayStats.alerts.map(alert => (
              <Alert
                key={alert.id}
                type={alert.type}
                message={alert.title}
                description={alert.message}
                showIcon
                style={{ marginBottom: 8 }}
                action={
                  <Button size="small" type="link">
                    处理
                  </Button>
                }
              />
            ))}
          </Card>
        </Col>

        {/* 近期交易 */}
        <Col xs={24} lg={12}>
          <Card 
            title="近期交易" 
            size="small"
            extra={<Button type="link">查看更多</Button>}
          >
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
