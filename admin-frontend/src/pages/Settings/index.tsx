// 系统设置页面

import React from 'react'
import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

const Settings: React.FC = () => {
  return (
    <div>
      <Card>
        <Title level={2}>⚙️ 系统设置</Title>
        <Paragraph>
          系统设置功能正在开发中...
        </Paragraph>
        <Paragraph>
          <strong>已规划功能：</strong>
          <ul>
            <li>系统基础配置</li>
            <li>管理员账号管理</li>
            <li>操作日志查询</li>
            <li>系统监控面板</li>
            <li>数据备份管理</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  )
}

export default Settings
