// 表格配置工具函数
import React from 'react'
import type { ColumnType } from 'antd/es/table'
import { Tag } from 'antd'
import { formatDateTime, formatAmount, formatPoints, formatOrderStatus, formatPointType, formatMerchantStatus } from './format'

// 通用列配置：序号
export function indexColumn(): ColumnType<any> {
  return {
    title: '序号',
    key: 'index',
    width: 70,
    align: 'center',
    render: (_: any, __: any, index: number) => index + 1
  }
}

// 通用列配置：创建时间
export function createTimeColumn(dataIndex: string = 'created_at'): ColumnType<any> {
  return {
    title: '创建时间',
    dataIndex,
    key: dataIndex,
    width: 180,
    render: (text: string) => formatDateTime(text)
  }
}

// 通用列配置：更新时间
export function updateTimeColumn(dataIndex: string = 'updated_at'): ColumnType<any> {
  return {
    title: '更新时间',
    dataIndex,
    key: dataIndex,
    width: 180,
    render: (text: string) => formatDateTime(text)
  }
}

// 通用列配置：金额
export function amountColumn(title: string = '金额', dataIndex: string = 'amount'): ColumnType<any> {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width: 120,
    align: 'right',
    render: (amount: number) => formatAmount(amount)
  }
}

// 通用列配置：积分
export function pointsColumn(title: string = '积分', dataIndex: string = 'points'): ColumnType<any> {
  return {
    title,
    dataIndex,
    key: dataIndex,
    width: 100,
    align: 'right',
    render: (points: number) => formatPoints(points)
  }
}

// 通用列配置：订单状态
export function orderStatusColumn(dataIndex: string = 'status'): ColumnType<any> {
  return {
    title: '状态',
    dataIndex,
    key: dataIndex,
    width: 100,
    align: 'center',
    render: (status: string) => {
      const { text, color } = formatOrderStatus(status)
      return React.createElement(Tag, { color }, text)
    }
  }
}

// 通用列配置：积分类型
export function pointTypeColumn(dataIndex: string = 'type'): ColumnType<any> {
  return {
    title: '类型',
    dataIndex,
    key: dataIndex,
    width: 100,
    align: 'center',
    render: (type: string) => {
      const { text, color } = formatPointType(type)
      return React.createElement(Tag, { color }, text)
    }
  }
}

// 通用列配置：商户状态
export function merchantStatusColumn(dataIndex: string = 'status'): ColumnType<any> {
  return {
    title: '状态',
    dataIndex,
    key: dataIndex,
    width: 100,
    align: 'center',
    render: (status: string) => {
      const { text, color } = formatMerchantStatus(status)
      return React.createElement(Tag, { color }, text)
    }
  }
}

// 通用分页配置
export function getPaginationConfig(total: number, page: number, pageSize: number, onChange: (page: number, pageSize: number) => void) {
  return {
    total,
    current: page,
    pageSize,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange,
    onShowSizeChange: onChange,
    pageSizeOptions: ['10', '20', '50', '100']
  }
}
