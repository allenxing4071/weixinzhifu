/**
 * 生产环境网络请求工具类
 */

class RequestManager {
  constructor() {
    this.requestQueue = []
    this.runningRequests = 0
    this.maxConcurrent = 8 // 小程序并发限制
  }

  get baseUrl() {
    const app = getApp()
    return app?.globalData?.baseUrl || 'http://8.156.84.226/api/v1'
  }

  /**
   * 通用请求方法
   */
  async request(options) {
    return new Promise((resolve, reject) => {
      this.addToQueue({ ...options, resolve, reject })
    })
  }

  /**
   * 添加请求到队列
   */
  addToQueue(requestOptions) {
    this.requestQueue.push(requestOptions)
    this.processQueue()
  }

  /**
   * 处理请求队列
   */
  processQueue() {
    if (this.runningRequests >= this.maxConcurrent || this.requestQueue.length === 0) {
      return
    }

    const requestOptions = this.requestQueue.shift()
    this.runningRequests++

    this.executeRequest(requestOptions)
  }

  /**
   * 执行具体请求
   */
  executeRequest({ url, method = 'GET', data = {}, header = {}, resolve, reject }) {
    const app = getApp()
    const token = app?.globalData?.token

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`

    // 构建请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    }

    // 添加认证头
    if (token) {
      requestHeader.Authorization = `Bearer ${token}`
    }

    console.log('🌐 API请求:', {
      url: fullUrl,
      method,
      header: requestHeader,
      data
    })

    wx.request({
      url: fullUrl,
      method,
      data,
      header: requestHeader,
      timeout: 30000,
      success: (res) => {
        console.log('✅ API响应:', res.data)
        
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          console.error('❌ API错误:', res)
          reject(new Error(`请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        console.error('❌ 网络错误:', err)
        reject(new Error(err.errMsg || '网络请求失败'))
      },
      complete: () => {
        this.runningRequests--
        this.processQueue()
      }
    })
  }

  get(url, params = {}) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    const fullUrl = queryString ? `${url}?${queryString}` : url
    return this.request({ url: fullUrl, method: 'GET' })
  }

  post(url, data = {}) {
    return this.request({ url, method: 'POST', data })
  }

  put(url, data = {}) {
    return this.request({ url, method: 'PUT', data })
  }

  delete(url) {
    return this.request({ url, method: 'DELETE' })
  }
}

const request = new RequestManager()

export default request

/**
 * 显示网络错误提示
 */
export const showNetworkError = (error) => {
  const message = error?.message || '网络请求失败，请稍后重试'
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 带加载提示的请求
 */
export const requestWithLoading = async (requestFn, loadingText = '加载中...') => {
  wx.showLoading({
    title: loadingText,
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
