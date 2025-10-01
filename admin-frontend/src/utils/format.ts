// 格式化工具函数

// 格式化日期时间
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  } catch {
    return dateStr
  }
}

// 格式化日期
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN').replace(/\//g, '-')
  } catch {
    return dateStr
  }
}

// 格式化金额
// unit: 'cents' = 分（默认），'yuan' = 元
export function formatAmount(
  amount: number | null | undefined,
  unit: 'cents' | 'yuan' = 'cents'
): string {
  if (amount === null || amount === undefined) return '¥0.00'

  // 如果已经是元，直接格式化
  if (unit === 'yuan') {
    return `¥${Number(amount).toFixed(2)}`
  }

  // 如果是分，转换为元后格式化
  return `¥${(amount / 100).toFixed(2)}`
}

// 格式化积分
export function formatPoints(points: number | null | undefined): string {
  if (points === null || points === undefined) return '0'
  return points.toLocaleString()
}

// 格式化订单状态
export function formatOrderStatus(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    'pending': { text: '待支付', color: 'default' },
    'paid': { text: '已支付', color: 'success' },
    'processing': { text: '处理中', color: 'processing' },
    'completed': { text: '已完成', color: 'success' },
    'failed': { text: '失败', color: 'error' },
    'refunded': { text: '已退款', color: 'warning' }
  }
  return statusMap[status] || { text: status, color: 'default' }
}

// 格式化积分记录类型
export function formatPointType(type: string): { text: string; color: string } {
  const typeMap: Record<string, { text: string; color: string }> = {
    'earn': { text: '获得', color: 'success' },
    'spend': { text: '消费', color: 'error' },
    'refund': { text: '退还', color: 'warning' },
    'admin': { text: '管理员调整', color: 'processing' }
  }
  return typeMap[type] || { text: type, color: 'default' }
}

// 格式化商户状态
export function formatMerchantStatus(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    'active': { text: '正常', color: 'success' },
    'inactive': { text: '停用', color: 'default' },
    'suspended': { text: '暂停', color: 'warning' }
  }
  return statusMap[status] || { text: status, color: 'default' }
}

// 格式化管理员角色
export function formatAdminRole(role: string): { text: string; color: string } {
  const roleMap: Record<string, { text: string; color: string }> = {
    'super_admin': { text: '超级管理员', color: 'red' },
    'admin': { text: '管理员', color: 'blue' },
    'operator': { text: '操作员', color: 'default' }
  }
  return roleMap[role] || { text: role, color: 'default' }
}

// 格式化管理员状态
export function formatAdminStatus(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    'active': { text: '正常', color: 'success' },
    'inactive': { text: '停用', color: 'default' },
    'locked': { text: '锁定', color: 'error' }
  }
  return statusMap[status] || { text: status, color: 'default' }
}

// 数据库字段转驼峰命名
// 将 snake_case 转换为 camelCase
export function toCamelCase(obj: any): any {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj !== 'object' || obj instanceof Date) return obj

  const result: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = obj[key]
    }
  }
  return result
}

// 驼峰命名转数据库字段
// 将 camelCase 转换为 snake_case
export function toSnakeCase(obj: any): any {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (typeof obj !== 'object' || obj instanceof Date) return obj

  const result: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = obj[key]
    }
  }
  return result
}
