import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  message,
  Row,
  Col,
  Table,
  Tag,
  Modal,
  Space,
  Divider,
  Typography,
  Tooltip,
  Image
} from 'antd'
import {
  QrcodeOutlined,
  DownloadOutlined,
  CopyOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons'

const { Option } = Select
const { Text, Title } = Typography
const { TextArea } = Input

interface Merchant {
  id: string
  merchantName: string
  merchantNo: string
  contactPerson: string
  contactPhone: string
  status: string
  subMchId?: string
}

interface QRCodeData {
  qrCodeImage: string
  qrCodeUrl: string
  qrCodeData: string
  qrType: string
  merchantInfo: {
    id: string
    name: string
    subMchId: string
  }
  fixedAmount?: number
  expiresAt: string
  createdAt: string
}

const MerchantQRCodePage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([])

  // 加载商户列表
  useEffect(() => {
    loadMerchants()
  }, [])

  const loadMerchants = async () => {
    try {
      const response = await fetch('/api/v1/admin/merchants?status=active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setMerchants(result.data.merchants || [])
      }
    } catch (error) {
      console.error('加载商户列表失败:', error)
    }
  }

  // 生成单个商户二维码
  const generateSingleQRCode = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/admin/merchants/${values.merchantId}/qrcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          qrType: values.qrType,
          fixedAmount: values.fixedAmount
        })
      })

      const result = await response.json()

      if (result.success) {
        setQRCodeData(result.data)
        setPreviewVisible(true)
        message.success('二维码生成成功！')
      } else {
        message.error(result.message || '生成失败')
      }
    } catch (error) {
      console.error('生成二维码失败:', error)
      message.error('生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 批量生成二维码
  const generateBatchQRCodes = async (values: any) => {
    if (selectedMerchants.length === 0) {
      message.warning('请选择要生成二维码的商户')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/admin/merchants/qrcode/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          merchantIds: selectedMerchants,
          qrType: values.qrType,
          fixedAmount: values.fixedAmount
        })
      })

      const result = await response.json()

      if (result.success) {
        const { successful, failed, summary } = result.data
        message.success(`批量生成完成：成功${summary.successful}个，失败${summary.failed}个`)
        
        // 显示批量结果
        Modal.info({
          title: '批量生成结果',
          width: 800,
          content: (
            <div>
              <p>总计：{summary.total} 个商户</p>
              <p>成功：{summary.successful} 个</p>
              <p>失败：{summary.failed} 个</p>
              
              {failed.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text type="danger">失败详情：</Text>
                  <ul>
                    {failed.map((item: any, index: number) => (
                      <li key={index}>{item.merchantName}: {item.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })
      } else {
        message.error(result.message || '批量生成失败')
      }
    } catch (error) {
      console.error('批量生成失败:', error)
      message.error('批量生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 下载二维码
  const downloadQRCode = (qrCodeData: QRCodeData) => {
    const link = document.createElement('a')
    link.download = `${qrCodeData.merchantInfo.name}_二维码.png`
    link.href = qrCodeData.qrCodeImage
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 复制二维码链接
  const copyQRCodeUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  // 商户表格列定义
  const merchantColumns = [
    {
      title: '商户名称',
      dataIndex: 'merchantName',
      key: 'merchantName'
    },
    {
      title: '商户编号',
      dataIndex: 'merchantNo',
      key: 'merchantNo'
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson'
    },
    {
      title: '特约商户号',
      dataIndex: 'subMchId',
      key: 'subMchId',
      render: (subMchId: string) => subMchId || <Text type="secondary">未配置</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '正常' },
          inactive: { color: 'red', text: '禁用' },
          pending: { color: 'orange', text: '待审核' }
        }
        const statusInfo = statusMap[status as keyof typeof statusMap]
        return <Tag color={statusInfo?.color}>{statusInfo?.text}</Tag>
      }
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <QrcodeOutlined />
                商户二维码生成管理
              </Space>
            }
            extra={
              <Space>
                <Button
                  type={!batchMode ? 'primary' : 'default'}
                  onClick={() => setBatchMode(false)}
                >
                  单个生成
                </Button>
                <Button
                  type={batchMode ? 'primary' : 'default'}
                  onClick={() => setBatchMode(true)}
                >
                  批量生成
                </Button>
                <Button icon={<ReloadOutlined />} onClick={loadMerchants}>
                  刷新
                </Button>
              </Space>
            }
          >
            {!batchMode ? (
              // 单个生成模式
              <Form
                form={form}
                layout="vertical"
                onFinish={generateSingleQRCode}
                style={{ maxWidth: 600 }}
              >
                <Form.Item
                  name="merchantId"
                  label="选择商户"
                  rules={[{ required: true, message: '请选择商户' }]}
                >
                  <Select
                    placeholder="请选择要生成二维码的商户"
                    showSearch
                    filterOption={(input, option) =>
                      option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                    }
                  >
                    {merchants.map(merchant => (
                      <Option key={merchant.id} value={merchant.id}>
                        {merchant.merchantName} ({merchant.merchantNo})
                        {!merchant.subMchId && <Text type="secondary"> - 未配置特约商户号</Text>}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="qrType"
                  label="二维码类型"
                  rules={[{ required: true, message: '请选择二维码类型' }]}
                  initialValue="miniprogram"
                >
                  <Select>
                    <Option value="miniprogram">小程序扫码</Option>
                    <Option value="wechat_native">微信Native支付</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="fixedAmount"
                  label="固定金额（元）"
                  help="可选，不填则为动态金额二维码"
                >
                  <InputNumber
                    min={0.01}
                    max={10000}
                    step={0.01}
                    precision={2}
                    placeholder="请输入固定金额"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<QrcodeOutlined />}
                    loading={loading}
                    size="large"
                  >
                    生成二维码
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              // 批量生成模式
              <div>
                <Form
                  form={form}
                  layout="inline"
                  onFinish={generateBatchQRCodes}
                  style={{ marginBottom: 16 }}
                >
                  <Form.Item
                    name="qrType"
                    label="二维码类型"
                    rules={[{ required: true, message: '请选择二维码类型' }]}
                    initialValue="miniprogram"
                  >
                    <Select style={{ width: 150 }}>
                      <Option value="miniprogram">小程序扫码</Option>
                      <Option value="wechat_native">微信Native支付</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="fixedAmount" label="固定金额（元）">
                    <InputNumber
                      min={0.01}
                      max={10000}
                      step={0.01}
                      precision={2}
                      placeholder="可选"
                      style={{ width: 120 }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<QrcodeOutlined />}
                      loading={loading}
                      disabled={selectedMerchants.length === 0}
                    >
                      批量生成 ({selectedMerchants.length})
                    </Button>
                  </Form.Item>
                </Form>

                <Table
                  dataSource={merchants}
                  columns={merchantColumns}
                  rowKey="id"
                  rowSelection={{
                    selectedRowKeys: selectedMerchants,
                    onChange: (selectedRowKeys) => {
                      setSelectedMerchants(selectedRowKeys as string[])
                    },
                    getCheckboxProps: (record) => ({
                      disabled: !record.subMchId, // 没有特约商户号的不能选择
                    }),
                  }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }}
                  size="small"
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 二维码预览弹窗 */}
      <Modal
        title="二维码生成成功"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => qrCodeData && downloadQRCode(qrCodeData)}
          >
            下载二维码
          </Button>
        ]}
        width={600}
      >
        {qrCodeData && (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={qrCodeData.qrCodeImage}
              alt="商户二维码"
              style={{ maxWidth: 300, maxHeight: 300 }}
              preview={false}
            />
            
            <Divider />
            
            <div style={{ textAlign: 'left' }}>
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Text strong>商户信息：</Text>
                  <Text>{qrCodeData.merchantInfo.name}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>特约商户号：</Text>
                  <Text>{qrCodeData.merchantInfo.subMchId}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>二维码类型：</Text>
                  <Tag color="blue">
                    {qrCodeData.qrType === 'miniprogram' ? '小程序扫码' : '微信Native支付'}
                  </Tag>
                </Col>
                {qrCodeData.fixedAmount && (
                  <Col span={24}>
                    <Text strong>固定金额：</Text>
                    <Text type="success">¥{qrCodeData.fixedAmount}</Text>
                  </Col>
                )}
                <Col span={24}>
                  <Text strong>有效期至：</Text>
                  <Text>{new Date(qrCodeData.expiresAt).toLocaleString()}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>二维码链接：</Text>
                  <br />
                  <Input.Group compact>
                    <Input
                      value={qrCodeData.qrCodeUrl}
                      readOnly
                      style={{ width: 'calc(100% - 32px)' }}
                    />
                    <Tooltip title="复制链接">
                      <Button
                        icon={<CopyOutlined />}
                        onClick={() => copyQRCodeUrl(qrCodeData.qrCodeUrl)}
                      />
                    </Tooltip>
                  </Input.Group>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MerchantQRCodePage
