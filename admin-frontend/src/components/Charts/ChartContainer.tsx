// 图表容器组件（完整版 - React 18兼容）

import React, { useEffect, useRef } from 'react'
import { Card, Button, Skeleton } from 'antd'
import { SyncOutlined, DownloadOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'
import { ChartContainerProps, ChartData, PieChartData } from '../../types'

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  type,
  data,
  height = 400,
  loading = false,
  refreshInterval,
  onRefresh,
  showLegend = true,
  showToolbox = true
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // 初始化图表 - React 18兼容版本
  useEffect(() => {
    if (!chartRef.current || loading) return

    // 销毁现有实例
    if (chartInstance.current) {
      chartInstance.current.dispose()
      chartInstance.current = null
    }

    // 创建新的图表实例
    chartInstance.current = echarts.init(chartRef.current)

    // 监听窗口大小变化
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [loading])

  // 更新图表数据 - 防御性编程
  useEffect(() => {
    if (!chartInstance.current || loading || !data) return

    try {
      let option: echarts.EChartsOption = {}

      // 线图/柱状图/面积图配置
      if (type === 'line' || type === 'bar' || type === 'area') {
        const chartData = data as ChartData
        option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: (params: any) => {
              if (!Array.isArray(params)) return ''
              let result = `${params[0]?.axisValueLabel || ''}<br/>`
              params.forEach(param => {
                const value = type === 'line' && param.seriesName?.includes('金额') 
                  ? `¥${(param.value || 0).toLocaleString()}`
                  : (param.value || 0).toLocaleString()
                result += `${param.marker || ''}${param.seriesName || ''}: ${value}<br/>`
              })
              return result
            }
          },
          legend: showLegend ? {
            top: 10,
            right: 20
          } : undefined,
          grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: showLegend ? '15%' : '10%',
            containLabel: true
          },
          toolbox: showToolbox ? {
            feature: {
              saveAsImage: { show: true, title: '保存为图片' }
            }
          } : undefined,
          xAxis: {
            type: 'category',
            data: chartData.xAxis || [],
            boundaryGap: type === 'bar'
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: (value: number) => {
                if (value >= 10000) {
                  return (value / 10000).toFixed(1) + '万'
                }
                return value.toString()
              }
            }
          },
          series: (chartData.series || []).map(series => ({
            name: series.name,
            type: type === 'area' ? 'line' : type,
            data: series.data || [],
            smooth: type === 'line' || type === 'area',
            areaStyle: type === 'area' ? { 
              opacity: 0.3,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: series.color || '#1890ff' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
              ])
            } : undefined,
            itemStyle: {
              color: series.color || '#1890ff'
            },
            lineStyle: type === 'line' || type === 'area' ? {
              color: series.color || '#1890ff',
              width: 3
            } : undefined
          }))
        }
      }

      // 饼图配置
      if (type === 'pie') {
        const pieData = data as PieChartData[]
        option = {
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: showLegend ? {
            orient: 'vertical',
            left: 'left'
          } : undefined,
          series: [
            {
              name: title,
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['50%', '50%'],
              data: pieData || [],
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              },
              label: {
                show: true,
                formatter: '{b}\n{d}%'
              }
            }
          ]
        }
      }

      chartInstance.current.setOption(option, true) // 第二个参数强制重新渲染
    } catch (error) {
      console.error('Chart render error:', error)
    }
  }, [data, type, title, loading, showLegend, showToolbox])

  // 定时刷新
  useEffect(() => {
    if (!refreshInterval || !onRefresh) return

    const timer = setInterval(() => {
      onRefresh()
    }, refreshInterval)

    return () => clearInterval(timer)
  }, [refreshInterval, onRefresh])

  // 导出图表
  const handleExport = () => {
    if (!chartInstance.current) return
    
    try {
      const url = chartInstance.current.getDataURL({
        type: 'png',
        backgroundColor: '#fff'
      })
      
      const link = document.createElement('a')
      link.download = `${title}-${new Date().getTime()}.png`
      link.href = url
      link.click()
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <Card
      title={title}
      className="chart-container"
      extra={
        <div className="chart-actions">
          {onRefresh && (
            <Button 
              type="text" 
              icon={<SyncOutlined />} 
              onClick={onRefresh}
              loading={loading}
              size="small"
            />
          )}
          <Button 
            type="text" 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            size="small"
          />
        </div>
      }
    >
      {loading ? (
        <Skeleton.Image style={{ width: '100%', height }} />
      ) : (
        <div
          ref={chartRef}
          style={{ 
            width: '100%', 
            height,
            minHeight: height 
          }}
        />
      )}
    </Card>
  )
}

export default ChartContainer
