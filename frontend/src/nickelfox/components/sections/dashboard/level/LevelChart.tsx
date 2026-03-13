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
        axisPointer: { type: 'shadow' },
      },
      legend: {
        show: true,
        top: 0,
        right: 0,
        orient: 'horizontal',
        itemGap: 14,
        itemWidth: 10,
        itemHeight: 10,
        icon: 'roundRect',
        textStyle: {
          color: theme.palette.text.secondary,
          fontSize: 11,
        },
        data: ['Approved', 'Rejected'],
      },
      xAxis: {
        type: 'category',
        axisTick: { show: false },
        data: data.labels,
        axisLabel: {
          color: theme.palette.text.secondary,
          fontSize: 11,
          margin: 12,
        },
        axisLine: {
          lineStyle: {
            color: alpha(theme.palette.common.white, 0.08),
            width: 1,
          },
        },
      },
      yAxis: {
        type: 'value',
        show: false,
        splitLine: { show: false },
      },
      grid: {
        left: 4,
        right: 4,
        top: 36,
        bottom: 8,
        containLabel: true,
      },
      series: [
        {
          id: 1,
          name: 'Approved',
          type: 'bar',
          stack: 'Decisions',
          barMaxWidth: 32,
          emphasis: { focus: 'series' },
          data: data.Volume,
          color: theme.palette.primary.main,
          itemStyle: { borderRadius: [0, 0, 0, 0] },
        },
        {
          id: 2,
          name: 'Rejected',
          type: 'bar',
          stack: 'Decisions',
          barMaxWidth: 32,
          emphasis: { focus: 'series' },
          data: data.Service,
          color: alpha(theme.palette.common.white, 0.14),
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }),
    [data, theme],
  )

  return <ReactEChart ref={chartRef} option={option} echarts={echarts} {...rest} />
}

export default LevelChart
