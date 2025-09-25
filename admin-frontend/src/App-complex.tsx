// 积分管理后台主应用

import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Provider } from 'react-redux'
import { store } from './store'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Merchants from './pages/Merchants'
import Points from './pages/Points'
import Orders from './pages/Orders'
import Settings from './pages/Settings'

// 简化版本，移除React Query复杂性

// Ant Design主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    fontSize: 14,
    borderRadius: 6,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
      darkItemSelectedBg: '#1890ff',
    }
  }
}

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN} theme={theme}>
        <Router basename="/admin">
            <div className="App">
              <Routes>
                {/* 登录页面 */}
                <Route path="/login" element={<Login />} />
                
                {/* 管理后台主页面 - 使用AuthGuard保护 */}
                <Route path="/*" element={
                  <AuthGuard>
                    <Layout>
                      <Routes>
                        {/* 默认重定向到仪表板 */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* 仪表板 */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        {/* 用户管理 */}
                        <Route path="/users" element={<Users />} />
                        <Route path="/users/:id" element={<Users />} />
                        
                        {/* 商户管理 */}
                        <Route path="/merchants" element={<Merchants />} />
                        <Route path="/merchants/:id" element={<Merchants />} />
                        
                        {/* 积分管理 */}
                        <Route path="/points" element={<Points />} />
                        <Route path="/points/config" element={<Points />} />
                        <Route path="/points/records" element={<Points />} />
                        
                        {/* 订单管理 */}
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/orders/:id" element={<Orders />} />
                        
                        {/* 系统设置 */}
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/settings/*" element={<Settings />} />
                      </Routes>
                    </Layout>
                  </AuthGuard>
                } />
              </Routes>
            </div>
        </Router>
      </ConfigProvider>
    </Provider>
  )
}

export default App