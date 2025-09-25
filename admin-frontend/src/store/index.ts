// 积分管理后台 - Redux状态管理

import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import authSlice from './slices/authSlice'
import dashboardSlice from './slices/dashboardSlice'
import userSlice from './slices/userSlice'
import merchantSlice from './slices/merchantSlice'
import orderSlice from './slices/orderSlice'
import pointsSlice from './slices/pointsSlice'
import systemSlice from './slices/systemSlice'

// 配置store
export const store = configureStore({
  reducer: {
    auth: authSlice,
    dashboard: dashboardSlice,
    user: userSlice,
    merchant: merchantSlice,
    order: orderSlice,
    points: pointsSlice,
    system: systemSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

// 类型定义
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// 类型化的hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store
