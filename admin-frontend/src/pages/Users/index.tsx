// 用户管理页面

import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

const Users: React.FC = () => {
  return (
    <div>
      <Card>
        <Title level={2}>👥 用户管理</Title>
        <Paragraph>
          用户管理功能正在开发中...
        </Paragraph>
        <Paragraph>
          <strong>已规划功能：</strong>
          <ul>
            <li>用户列表查询和筛选</li>
            <li>用户详情查看</li>
            <li>用户积分调整</li>
            <li>用户状态管理</li>
            <li>用户行为分析</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  )
}

export default Users
