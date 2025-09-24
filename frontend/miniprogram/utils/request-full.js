/**
 * 网络请求工具类
 */

class RequestManager {
  constructor() {
    this.requestQueue = []
    this.runningRequests = 0
    this.maxConcurrent = 8 // 小程序并发限制
  }

  get baseUrl() {
    const app = getApp()
    return app?.globalData?.baseUrl || 'https://api.example.com/api/v1'
  }

  /**
   * 通用请求方法
   */
  async request(options) {
    return new Promise((resolve, reject) => {
      // 加入请求队列
      this.requestQueue.push({
        options,
        resolve,
        reject
      })
      
      // 处理队列
      this.processQueue()
    })
  }

  /**
   * 处理请求队列
   */
  processQueue() {
    if (this.runningRequests >= this.maxConcurrent || this.requestQueue.length === 0) {
      return
    }

    const { options, resolve, reject } = this.requestQueue.shift()
    this.runningRequests++

    // 构建完整请求配置
    const config = {
      url: this.buildUrl(options.url),
      method: options.method || 'GET',
      data: options.data,
      header: this.buildHeaders(options.header),
      timeout: options.timeout || 30000,
      dataType: 'json',
      responseType: 'text',
      success: (res) => {
        this.runningRequests--
        this.processQueue() // 处理下一个请求
        
        // 统一响应处理
        this.handleResponse(res, resolve, reject)
      },
      fail: (error) => {
        this.runningRequests--
        this.processQueue() // 处理下一个请求
        
        // 统一错误处理
        this.handleError(error, reject)
      }
    }

    wx.request(config)
  }

  /**
   * 构建完整URL
   */
  buildUrl(url) {
    if (url.startsWith('http')) {
      return url
    }
    return `${this.baseUrl}${url.startsWith('/') ? url : '/' + url}`
  }

  /**
   * 构建请求头
   */
  buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    }

    // 添加认证头
    const app = getApp()
    const token = app?.globalData?.token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * 处理响应
   */
  handleResponse(res, resolve, reject) {
    // 检查HTTP状态码
    if (res.statusCode >= 200 && res.statusCode < 300) {
      
      // 检查业务状态码
      if (res.data && res.data.success === false) {
        this.handleBusinessError(res.data, reject)
        return
      }
      
      resolve(res.data)
    } else {
      reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || '请求失败'}`))
    }
  }

  /**
   * 处理业务错误
   */
  handleBusinessError(data, reject) {
    // 处理token过期
    if (data.code === 'TOKEN_EXPIRED' || data.code === 'UNAUTHORIZED') {
      const app = getApp()
      app?.clearLoginState?.()
      
      wx.showModal({
        title: '登录过期',
        content: '请重新登录',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/points/index'
          })
        }
      })
    }
    
    reject(new Error(data.message || '请求失败'))
  }

  /**
   * 处理网络错误
   */
  handleError(error, reject) {
    console.error('网络请求失败:', error)
    
    let message = '网络连接失败'
    
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        message = '请求超时，请检查网络连接'
      } else if (error.errMsg.includes('fail')) {
        message = '网络连接失败，请稍后重试'
      }
    }
    
    reject(new Error(message))
  }

  /**
   * GET请求
   */
  get(url, params = {}, options = {}) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request({
      url: fullUrl,
      method: 'GET',
      ...options
    })
  }

  /**
   * POST请求
   */
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  /**
   * PUT请求
   */
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  /**
   * DELETE请求
   */
  delete(url, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      ...options
    })
  }
}

// 创建全局实例
const request = new RequestManager()

/**
 * 显示网络错误提示
 */
export const showNetworkError = (error) => {
  wx.showToast({
    title: error.message || '网络异常',
    icon: 'none',
    duration: 2000
  })
}

/**
 * 带loading的请求
 */
export const requestWithLoading = async (requestFn, loadingTitle = '加载中...') => {
  wx.showLoading({
    title: loadingTitle,
    mask: true
  })
  
  try {
    const result = await requestFn()
    wx.hideLoading()
    return result
  } catch (error) {
    wx.hideLoading()
    showNetworkError(error)
    throw error
  }
}

export default request
