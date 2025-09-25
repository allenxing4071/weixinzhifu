// 商户管理状态管理 - 简化版

import { createSlice } from '@reduxjs/toolkit'

const merchantSlice = createSlice({
  name: 'merchant',
  initialState: {
    loading: 'idle' as const,
    error: null as string | null
  },
  reducers: {}
})

export default merchantSlice.reducer
