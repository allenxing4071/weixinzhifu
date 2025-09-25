// 仪表板状态管理

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { dashboardApi } from '../../services/api'
import { DashboardStats, SystemMonitor, LoadingState } from '../../types'

// 仪表板状态接口
interface DashboardState {
  stats: DashboardStats | null
  monitor: SystemMonitor | null
  todos: any[]
  loading: LoadingState
  error: string | null
  lastUpdated: number | null
}

// 初始状态
const initialState: DashboardState = {
  stats: null,
  monitor: null,
  todos: [],
  loading: 'idle',
  error: null,
  lastUpdated: null,
}

// 异步操作 - 获取仪表板数据
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await dashboardApi.getStats()
      return stats
    } catch (error: any) {
      return rejectWithValue(error.message || '获取仪表板数据失败')
    }
  }
)

// 异步操作 - 获取系统监控数据
export const fetchSystemMonitor = createAsyncThunk(
  'dashboard/fetchMonitor',
  async (_, { rejectWithValue }) => {
    try {
      const monitor = await dashboardApi.getMonitor()
      return monitor
    } catch (error: any) {
      return rejectWithValue(error.message || '获取监控数据失败')
    }
  }
)

// 异步操作 - 获取待处理事项
export const fetchTodos = createAsyncThunk(
  'dashboard/fetchTodos',
  async (_, { rejectWithValue }) => {
    try {
      const todos = await dashboardApi.getTodos()
      return todos
    } catch (error: any) {
      return rejectWithValue(error.message || '获取待处理事项失败')
    }
  }
)

// 创建slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null
    },
    
    // 标记todo为已处理
    markTodoAsHandled: (state, action) => {
      const todoId = action.payload
      state.todos = state.todos.map(todo => 
        todo.id === todoId ? { ...todo, handled: true } : todo
      )
    },
    
    // 更新实时数据
    updateRealTimeData: (state, action) => {
      if (state.stats) {
        state.stats.overview = { ...state.stats.overview, ...action.payload }
        state.lastUpdated = Date.now()
      }
    }
  },
  extraReducers: (builder) => {
    // 获取仪表板数据
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = 'loading'
        state.error = null
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = 'succeeded'
        state.stats = action.payload
        state.lastUpdated = Date.now()
        state.error = null
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = 'failed'
        state.error = action.payload as string
      })

    // 获取系统监控数据
    builder
      .addCase(fetchSystemMonitor.fulfilled, (state, action) => {
        state.monitor = action.payload
      })

    // 获取待处理事项
    builder
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.todos = action.payload
      })
  },
})

// 导出actions
export const { clearError, markTodoAsHandled, updateRealTimeData } = dashboardSlice.actions

// 选择器
export const selectDashboard = (state: { dashboard: DashboardState }) => state.dashboard
export const selectDashboardStats = (state: { dashboard: DashboardState }) => state.dashboard.stats
export const selectSystemMonitor = (state: { dashboard: DashboardState }) => state.dashboard.monitor
export const selectTodos = (state: { dashboard: DashboardState }) => state.dashboard.todos
export const selectDashboardLoading = (state: { dashboard: DashboardState }) => state.dashboard.loading
export const selectDashboardError = (state: { dashboard: DashboardState }) => state.dashboard.error

export default dashboardSlice.reducer
