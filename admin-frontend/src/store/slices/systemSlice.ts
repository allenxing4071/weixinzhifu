// 系统管理状态管理 - 简化版

import { createSlice } from '@reduxjs/toolkit'

const systemSlice = createSlice({
  name: 'system',
  initialState: {
    loading: 'idle' as const,
    error: null as string | null
  },
  reducers: {}
})

export default systemSlice.reducer
