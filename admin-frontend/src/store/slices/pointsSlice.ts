// 积分管理状态管理 - 简化版

import { createSlice } from '@reduxjs/toolkit'

const pointsSlice = createSlice({
  name: 'points',
  initialState: {
    loading: 'idle' as const,
    error: null as string | null
  },
  reducers: {}
})

export default pointsSlice.reducer
