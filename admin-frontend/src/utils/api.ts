// API请求工具函数
import { message } from 'antd'

const API_BASE = '/api/v1'

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
}

// 统一API请求函数
export async function apiRequest<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('admin_token')
  
  try {
    const response = await fetch(API_BASE + url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    })

    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const errorMsg = isJson ? (data.message || `HTTP ${response.status}`) : data
      throw new Error(`API请求失败: ${response.status} - ${errorMsg}`)
    }

    return data
  } catch (error: any) {
    console.error('API请求错误:', error)
    throw error
  }
}

// GET请求
export async function apiGet<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'GET' })
}

// POST请求
export async function apiPost<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  })
}

// PUT请求
export async function apiPut<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  })
}

// DELETE请求
export async function apiDelete<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'DELETE' })
}

// 统一错误处理
export function handleApiError(error: any, defaultMsg: string = '操作失败') {
  const errorMsg = error?.message || defaultMsg
  message.error(errorMsg)
  console.error('API错误:', error)
}

// 统一成功提示
export function showSuccess(msg: string = '操作成功') {
  message.success(msg)
}
