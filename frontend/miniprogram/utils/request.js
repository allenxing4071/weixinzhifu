// utils/request.js - 统一网络请求工具

/**
 * 统一网络请求方法
 * @param {string} url - 接口路径（相对路径，如 '/points/balance'）
 * @param {string} method - 请求方法 GET|POST|PUT|DELETE
 * @param {Object} data - 请求数据
 * @param {Object} customHeaders - 自定义请求头
 * @returns {Promise} - 返回处理后的响应数据
 */
export function requestAPI(url, method = 'GET', data = {}, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    // 构建完整URL
    const fullUrl = `${getApp().globalData.baseUrl}${url}`
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    }
    
    // 如果有token且不是登录接口，添加Authorization头
    if (getApp().globalData.token && !url.includes('/auth/wechat-login')) {
      headers['Authorization'] = `Bearer ${getApp().globalData.token}`
    }
    
    console.log(`📡 发起请求: ${method} ${fullUrl}`, { data, headers })
    
    wx.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      timeout: 15000, // 15秒超时
      success: (res) => {
        console.log(`📡 请求响应: ${method} ${url}`, res)
        
        if (res.statusCode === 200) {
          // 请求成功
          if (res.data && typeof res.data === 'object') {
            resolve(res.data)
          } else {
            resolve({ success: true, data: res.data })
          }
        } else if (res.statusCode === 401) {
          // Token过期或无效
          console.warn('🔑 Token过期，清除登录状态')
          getApp().clearLoginState()
          
          wx.showModal({
            title: '登录过期',
            content: '请重新登录',
            showCancel: false,
            success: () => {
              getApp().doWechatLogin()
            }
          })
          
          reject(new Error('登录过期'))
        } else if (res.statusCode === 403) {
          // 权限不足
          reject(new Error('权限不足'))
        } else if (res.statusCode === 404) {
          // 接口不存在
          reject(new Error('接口不存在'))
        } else if (res.statusCode >= 500) {
          // 服务器错误
          reject(new Error('服务器错误，请稍后重试'))
        } else {
          // 其他错误
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail: (error) => {
        console.error(`❌ 请求失败: ${method} ${url}`, error)
        
        let errorMessage = '网络请求失败'
        
        if (error.errMsg) {
          if (error.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请检查网络连接'
          } else if (error.errMsg.includes('fail')) {
            errorMessage = '网络连接失败，请检查网络设置'
          }
        }
        
        reject(new Error(errorMessage))
      }
    })
  })
}

/**
 * GET请求简化方法
 */
export function get(url, params = {}) {
  let query = ''
  if (Object.keys(params).length > 0) {
    query = '?' + new URLSearchParams(params).toString()
  }
  return requestAPI(url + query, 'GET')
}

/**
 * POST请求简化方法
 */
export function post(url, data = {}) {
  return requestAPI(url, 'POST', data)
}

/**
 * PUT请求简化方法
 */
export function put(url, data = {}) {
  return requestAPI(url, 'PUT', data)
}

/**
 * DELETE请求简化方法
 */
export function del(url) {
  return requestAPI(url, 'DELETE')
}

/**
 * 上传文件
 */
export function uploadFile(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${getApp().globalData.baseUrl}${url}`
    
    const headers = {}
    if (getApp().globalData.token) {
      headers['Authorization'] = `Bearer ${getApp().globalData.token}`
    }
    
    wx.uploadFile({
      url: fullUrl,
      filePath,
      name,
      formData,
      header: headers,
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve(data)
        } catch (error) {
          resolve({ success: true, data: res.data })
        }
      },
      fail: reject
    })
  })
}

/**
 * 下载文件
 */
export function downloadFile(url, header = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${getApp().globalData.baseUrl}${url}`
    
    if (getApp().globalData.token) {
      header['Authorization'] = `Bearer ${getApp().globalData.token}`
    }
    
    wx.downloadFile({
      url: fullUrl,
      header,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 请求拦截器配置
 */
export const requestConfig = {
  baseUrl: 'https://www.guandongfang.cn/api/v1',
  timeout: 15000,
  retryTimes: 2, // 重试次数
  retryDelay: 1000 // 重试延迟(ms)
}

/**
 * 带重试机制的请求
 */
export function requestWithRetry(url, method = 'GET', data = {}, options = {}) {
  const { retryTimes = requestConfig.retryTimes, retryDelay = requestConfig.retryDelay } = options
  
  return new Promise((resolve, reject) => {
    let attempts = 0
    
    const makeRequest = () => {
      attempts++
      
      requestAPI(url, method, data)
        .then(resolve)
        .catch((error) => {
          if (attempts < retryTimes && !error.message.includes('登录过期')) {
            console.log(`🔄 请求重试 ${attempts}/${retryTimes}: ${url}`)
            setTimeout(makeRequest, retryDelay)
          } else {
            reject(error)
          }
        })
    }
    
    makeRequest()
  })
}

// 导出默认请求方法
export default {
  requestAPI,
  get,
  post,
  put,
  del,
  uploadFile,
  downloadFile,
  requestWithRetry
}