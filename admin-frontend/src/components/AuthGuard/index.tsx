// 认证守卫组件

import React, { useEffect, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAppDispatch, useAppSelector } from '../../store'
import { 
  selectIsAuthenticated, 
  selectAuthLoading, 
  selectCurrentAdmin,
  getCurrentAdminAsync 
} from '../../store/slices/authSlice'

interface AuthGuardProps {
  children: ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const loading = useAppSelector(selectAuthLoading)
  const currentAdmin = useAppSelector(selectCurrentAdmin)
  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    // 如果有token但没有用户信息，尝试获取用户信息
    if (token && !currentAdmin && !isAuthenticated && loading === 'idle') {
      dispatch(getCurrentAdminAsync())
    }
  }, [dispatch, token, currentAdmin, isAuthenticated, loading])

  // 如果没有token，重定向到登录页
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // 如果正在加载用户信息，显示加载状态
  if (loading === 'loading') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <Spin size="large" tip="正在验证登录状态..." />
      </div>
    )
  }

  // 如果认证失败，重定向到登录页
  if (loading === 'failed' || !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 认证通过，渲染子组件
  return <>{children}</>
}

export default AuthGuard
