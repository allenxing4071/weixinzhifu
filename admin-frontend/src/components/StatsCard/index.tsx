// 统计卡片组件

import React from 'react'
import { Card, Statistic, Skeleton } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { StatsCardProps } from '../../types'
import './index.css'

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend,
  icon,
  color = '#1890ff',
  loading = false,
  precision = 0,
  prefix,
  suffix
}) => {
  if (loading) {
    return (
      <Card className="stats-card">
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    )
  }

  return (
    <Card className="stats-card" hoverable>
      <div className="stats-content">
        {/* 图标区域 */}
        <div className="stats-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>

        {/* 数据区域 */}
        <div className="stats-data">
          <div className="stats-title">{title}</div>
          
          <div className="stats-value">
            <Statistic
              value={value}
              precision={precision}
              prefix={prefix}
              suffix={suffix}
              valueStyle={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: '#262626'
              }}
            />
          </div>

          {/* 趋势显示 */}
          {trend && (
            <div className="stats-trend">
              <span 
                className={`trend-value ${trend.type === 'up' ? 'trend-up' : 'trend-down'}`}
              >
                {trend.type === 'up' ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )}
                {trend.value}%
              </span>
              <span className="trend-period">{trend.period}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StatsCard
