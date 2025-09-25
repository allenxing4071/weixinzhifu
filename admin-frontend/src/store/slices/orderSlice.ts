// 订单管理状态管理 - 简化版

import { createSlice } from '@reduxjs/toolkit'

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    loading: 'idle' as const,
    error: null as string | null
  },
  reducers: {}
})

export default orderSlice.reducer
