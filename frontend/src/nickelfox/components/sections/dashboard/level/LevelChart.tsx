import { alpha, SxProps, useTheme } from '@mui/material'
import ReactEChart from '@/nickelfox/components/base/ReactEChart'
import { BarSeriesOption } from 'echarts'
import echarts from '@/nickelfox/components/base/echartsSetup'
import EChartsReactCore from 'echarts-for-react/lib/core'
import {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import React, { ReactElement, useMemo } from 'react'

type LevelChartProps = {
  chartRef: React.MutableRefObject<EChartsReactCore | null>
  data: {
    labels: string[]
    Volume: number[]
    Service: number[]
  }
  sx?: SxProps
}

type LevelChartOptions = echarts.ComposeOption<
  BarSeriesOption | LegendComponentOption | TooltipComponentOption | GridComponentOption
>

const LevelChart = ({ chartRef, data, ...rest }: LevelChartProps): ReactElement => {
  const theme = useTheme()
  const option: LevelChartOptions = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: theme.palette.text.secondary },
        data: ['Approved', 'Rejected'],
      },
      xAxis: {
        type: 'category',
        show: true,
        axisTick: { show: false },
        data: data.labels,
        axisLabel: {
          show: true,
          color: theme.palette.text.secondary,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: alpha(theme.palette.common.white, 0.06),
            width: 1,
          },
        },
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      grid: {
        left: 0,
        right: 0,
        top: 8,
        bottom: 28,
      },
      series: [
        {
          id: 1,
          name: 'Approved',
          type: 'bar',
          stack: 'Decisions',
          barWidth: 25,
          emphasis: {
            focus: 'series',
          },
          data: data.Volume,
          color: theme.palette.primary.main,
          itemStyle: {
            borderRadius: 4,
          },
        },
        {
          id: 2,
          name: 'Rejected',
          type: 'bar',
          stack: 'Decisions',
          barWidth: 25,
          emphasis: {
            focus: 'series',
          },
          data: data.Service,
          color: theme.palette.grey[800],
          itemStyle: {
            borderRadius: 4,
          },
        },
      ],
    }),
    [data, theme],
  )

  return <ReactEChart ref={chartRef} option={option} echarts={echarts} {...rest} />
}

export default LevelChart
