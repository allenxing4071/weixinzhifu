// 订单管理页面

import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

const Orders: React.FC = () => {
  return (
    <div>
      <Card>
        <Title level={2}>🛒 订单管理</Title>
        <Paragraph>
          订单管理功能正在开发中...
        </Paragraph>
        <Paragraph>
          <strong>已规划功能：</strong>
          <ul>
            <li>订单列表查询</li>
            <li>订单详情查看</li>
            <li>订单状态管理</li>
            <li>退款申请处理</li>
            <li>异常订单监控</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  )
}

export default Orders
