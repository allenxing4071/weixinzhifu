// 认证状态管理

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { message } from 'antd'
import { authApi } from '../../services/api'
import { Admin, AdminLoginRequest, Permission, LoadingState } from '../../types'

// 认证状态接口
interface AuthState {
  isAuthenticated: boolean
  admin: Admin | null
  permissions: Permission[]
  token: string | null
  loading: LoadingState
  error: string | null
}

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  admin: null,
  permissions: [],
  token: localStorage.getItem('admin_token'),
  loading: 'idle',
  error: null,
}

// 异步操作 - 登录
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (loginData: AdminLoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(loginData)
      
      // 保存token到localStorage
      localStorage.setItem('admin_token', response.token)
      
      message.success('登录成功！')
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败')
    }
  }
)

// 异步操作 - 获取当前用户信息
export const getCurrentAdminAsync = createAsyncThunk(
  'auth/getCurrentAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const admin = await authApi.getCurrentAdmin()
      return admin
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败')
    }
  }
)

// 异步操作 - 登出
export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout()
      localStorage.removeItem('admin_token')
      message.success('已安全退出')
    } catch (error: any) {
      // 即使API调用失败，也要清除本地token
      localStorage.removeItem('admin_token')
      return rejectWithValue(error.message || '退出失败')
    }
  }
)

// 创建slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    
    // 清除认证状态
    clearAuth: (state) => {
      state.isAuthenticated = false
      state.admin = null
      state.permissions = []
      state.token = null
      state.loading = 'idle'
      state.error = null
      localStorage.removeItem('admin_token')
    },
    
    // 设置权限
    setPermissions: (state, action: PayloadAction<Permission[]>) => {
      state.permissions = action.payload
    }
  },
  extraReducers: (builder) => {
    // 登录
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = 'loading'
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = 'succeeded'
        state.isAuthenticated = true
        state.token = action.payload.token
        state.admin = action.payload.adminInfo as any
        state.permissions = action.payload.adminInfo.permissions
        state.error = null
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = 'failed'
        state.error = action.payload as string
        state.isAuthenticated = false
        state.admin = null
        state.token = null
      })

    // 获取当前用户信息
    builder
      .addCase(getCurrentAdminAsync.pending, (state) => {
        state.loading = 'loading'
      })
      .addCase(getCurrentAdminAsync.fulfilled, (state, action) => {
        state.loading = 'succeeded'
        state.admin = action.payload
        state.isAuthenticated = true
      })
      .addCase(getCurrentAdminAsync.rejected, (state, action) => {
        state.loading = 'failed'
        state.error = action.payload as string
        state.isAuthenticated = false
        state.admin = null
        state.token = null
      })

    // 登出
    builder
      .addCase(logoutAsync.fulfilled, (state) => {
        state.isAuthenticated = false
        state.admin = null
        state.permissions = []
        state.token = null
        state.loading = 'idle'
        state.error = null
      })
  },
})

// 导出actions
export const { clearError, clearAuth, setPermissions } = authSlice.actions

// 选择器
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectCurrentAdmin = (state: { auth: AuthState }) => state.auth.admin
export const selectPermissions = (state: { auth: AuthState }) => state.auth.permissions
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error

// 权限检查函数
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission)
}

export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

export default authSlice.reducer
