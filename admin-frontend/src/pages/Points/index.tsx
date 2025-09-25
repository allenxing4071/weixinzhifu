// 积分管理页面

import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

const Points: React.FC = () => {
  return (
    <div>
      <Card>
        <Title level={2}>🎁 积分管理</Title>
        <Paragraph>
          积分管理功能正在开发中...
        </Paragraph>
        <Paragraph>
          <strong>已规划功能：</strong>
          <ul>
            <li>积分统计分析</li>
            <li>积分记录查询</li>
            <li>积分规则配置</li>
            <li>批量积分操作</li>
            <li>积分过期管理</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  )
}

export default Points
