// 用户管理状态管理

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { message } from 'antd'
import { userApi } from '../../services/api'
import { User, UserListParams, UserPointsStats, LoadingState, AdjustPointsForm } from '../../types'

// 用户管理状态接口
interface UserState {
  // 用户列表
  userList: User[]
  userListTotal: number
  userListLoading: LoadingState
  
  // 当前用户详情
  currentUser: User | null
  currentUserLoading: LoadingState
  
  // 用户积分统计
  userPointsStats: UserPointsStats | null
  
  // 通用状态
  loading: LoadingState
  error: string | null
}

// 初始状态
const initialState: UserState = {
  userList: [],
  userListTotal: 0,
  userListLoading: 'idle',
  currentUser: null,
  currentUserLoading: 'idle',
  userPointsStats: null,
  loading: 'idle',
  error: null,
}

// 异步操作 - 获取用户列表
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (params: UserListParams, { rejectWithValue }) => {
    try {
      const response = await userApi.getUsers(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户列表失败')
    }
  }
)

// 异步操作 - 获取用户详情
export const fetchUserDetail = createAsyncThunk(
  'user/fetchUserDetail',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await userApi.getUserDetail(userId)
      return user
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户详情失败')
    }
  }
)

// 异步操作 - 获取用户积分统计
export const fetchUserPointsStats = createAsyncThunk(
  'user/fetchUserPointsStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const stats = await userApi.getUserPointsStats(userId)
      return stats
    } catch (error: any) {
      return rejectWithValue(error.message || '获取积分统计失败')
    }
  }
)

// 异步操作 - 调整用户积分
export const adjustUserPoints = createAsyncThunk(
  'user/adjustUserPoints',
  async ({ userId, data }: { userId: string; data: AdjustPointsForm }, { rejectWithValue, dispatch }) => {
    try {
      await userApi.adjustUserPoints(userId, data)
      message.success('积分调整成功！')
      
      // 重新获取用户详情和积分统计
      dispatch(fetchUserDetail(userId))
      dispatch(fetchUserPointsStats(userId))
      
      return userId
    } catch (error: any) {
      return rejectWithValue(error.message || '积分调整失败')
    }
  }
)

// 异步操作 - 更新用户状态
export const updateUserStatus = createAsyncThunk(
  'user/updateUserStatus',
  async ({ userId, status }: { userId: string; status: string }, { rejectWithValue, dispatch }) => {
    try {
      await userApi.updateUserStatus(userId, status)
      message.success('用户状态更新成功！')
      
      // 重新获取用户详情
      dispatch(fetchUserDetail(userId))
      
      return { userId, status }
    } catch (error: any) {
      return rejectWithValue(error.message || '状态更新失败')
    }
  }
)

// 创建slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    
    // 重置当前用户
    resetCurrentUser: (state) => {
      state.currentUser = null
      state.userPointsStats = null
      state.currentUserLoading = 'idle'
    },
    
    // 更新用户列表中的单个用户
    updateUserInList: (state, action) => {
      const { userId, updates } = action.payload
      const userIndex = state.userList.findIndex(user => user.id === userId)
      if (userIndex !== -1) {
        state.userList[userIndex] = { ...state.userList[userIndex], ...updates }
      }
    }
  },
  extraReducers: (builder) => {
    // 获取用户列表
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.userListLoading = 'loading'
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.userListLoading = 'succeeded'
        state.userList = action.payload.list
        state.userListTotal = action.payload.total
        state.error = null
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.userListLoading = 'failed'
        state.error = action.payload as string
      })

    // 获取用户详情
    builder
      .addCase(fetchUserDetail.pending, (state) => {
        state.currentUserLoading = 'loading'
        state.error = null
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.currentUserLoading = 'succeeded'
        state.currentUser = action.payload
        state.error = null
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.currentUserLoading = 'failed'
        state.error = action.payload as string
      })

    // 获取用户积分统计
    builder
      .addCase(fetchUserPointsStats.fulfilled, (state, action) => {
        state.userPointsStats = action.payload
      })

    // 调整用户积分
    builder
      .addCase(adjustUserPoints.pending, (state) => {
        state.loading = 'loading'
      })
      .addCase(adjustUserPoints.fulfilled, (state) => {
        state.loading = 'succeeded'
      })
      .addCase(adjustUserPoints.rejected, (state, action) => {
        state.loading = 'failed'
        state.error = action.payload as string
      })

    // 更新用户状态
    builder
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const { userId, status } = action.payload
        // 更新列表中的用户状态
        const userIndex = state.userList.findIndex(user => user.id === userId)
        if (userIndex !== -1) {
          state.userList[userIndex].status = status as any
        }
        // 更新当前用户状态
        if (state.currentUser?.id === userId) {
          state.currentUser.status = status as any
        }
      })
  },
})

// 导出actions
export const { clearError, resetCurrentUser, updateUserInList } = userSlice.actions

// 选择器
export const selectUser = (state: { user: UserState }) => state.user
export const selectUserList = (state: { user: UserState }) => state.user.userList
export const selectUserListTotal = (state: { user: UserState }) => state.user.userListTotal
export const selectUserListLoading = (state: { user: UserState }) => state.user.userListLoading
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser
export const selectCurrentUserLoading = (state: { user: UserState }) => state.user.currentUserLoading
export const selectUserPointsStats = (state: { user: UserState }) => state.user.userPointsStats
export const selectUserLoading = (state: { user: UserState }) => state.user.loading
export const selectUserError = (state: { user: UserState }) => state.user.error

export default userSlice.reducer
