// 商户管理页面

import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

const Merchants: React.FC = () => {
  return (
    <div>
      <Card>
        <Title level={2}>🏪 商户管理</Title>
        <Paragraph>
          商户管理功能正在开发中...
        </Paragraph>
        <Paragraph>
          <strong>已规划功能：</strong>
          <ul>
            <li>商户注册审核</li>
            <li>商户信息管理</li>
            <li>商户数据统计</li>
            <li>收款码管理</li>
            <li>商户状态控制</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  )
}

export default Merchants
