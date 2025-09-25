// 管理后台登录页面

import React from 'react'
import { Form, Input, Button, Card, message, Spin } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store'
import { loginAsync, selectAuthLoading, selectAuthError, clearError } from '../../store/slices/authSlice'
import { AdminLoginRequest } from '../../types'
import './index.css'

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const loading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  // 处理登录
  const handleLogin = async (values: AdminLoginRequest) => {
    try {
      dispatch(clearError())
      const result = await dispatch(loginAsync(values))
      
      if (loginAsync.fulfilled.match(result)) {
        // 登录成功，跳转到仪表板
        navigate('/admin/dashboard')
      }
    } catch (error: any) {
      message.error(error.message || '登录失败')
    }
  }

  // 演示账号快速登录
  const handleDemoLogin = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'admin123'
    })
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay" />
      </div>
      
      <div className="login-content">
        <Card className="login-card" bordered={false}>
          {/* 系统标题 */}
          <div className="login-header">
            <div className="login-logo">
              <LoginOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            </div>
            <h1 className="login-title">积分营销管理系统</h1>
            <p className="login-subtitle">微信支付积分赠送系统管理后台</p>
          </div>

          {/* 登录表单 */}
          <Spin spinning={loading === 'loading'}>
            <Form
              form={form}
              name="login"
              size="large"
              onFinish={handleLogin}
              autoComplete="off"
              className="login-form"
            >
              {/* 用户名 */}
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 50, message: '用户名最多50个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </Form.Item>

              {/* 密码 */}
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>

              {/* 错误提示 */}
              {error && (
                <div className="login-error">
                  <span>⚠️ {error}</span>
                </div>
              )}

              {/* 登录按钮 */}
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="login-button"
                  loading={loading === 'loading'}
                  icon={<LoginOutlined />}
                  block
                >
                  {loading === 'loading' ? '登录中...' : '立即登录'}
                </Button>
              </Form.Item>

              {/* 演示账号 */}
              <div className="login-demo">
                <Button 
                  type="link" 
                  onClick={handleDemoLogin}
                  size="small"
                >
                  使用演示账号登录
                </Button>
              </div>
            </Form>
          </Spin>

          {/* 系统信息 */}
          <div className="login-footer">
            <p>积分营销系统 v1.0.0</p>
            <p>技术支持：产品开发团队</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Login
