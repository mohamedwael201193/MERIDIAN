import { SxProps, useTheme } from '@mui/material'
import ReactEChart from '@/nickelfox/components/base/ReactEChart'
import echarts from '@/nickelfox/components/base/echartsSetup'
import EChartsReactCore from 'echarts-for-react/lib/core'
import { LineSeriesOption } from 'echarts/charts'
import {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import { ReactElement, useMemo } from 'react'

type VisitorInsightsChartProps = {
  chartRef: React.MutableRefObject<EChartsReactCore | null>
  data: {
    labels: string[]
    values: number[]
    seriesName: string
  }
  sx?: SxProps
}

type VisitorInsightsChartOptions = echarts.ComposeOption<
  LineSeriesOption | LegendComponentOption | TooltipComponentOption | GridComponentOption
>

const VisitorInsightsChart = ({
  chartRef,
  data,
  ...rest
}: VisitorInsightsChartProps): ReactElement => {
  const theme = useTheme()
  const maxValue = Math.max(...data.values, 1)

  const option: VisitorInsightsChartOptions = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: theme.palette.warning.main,
          },
          label: {
            backgroundColor: theme.palette.warning.main,
          },
        },
      },
      legend: {
        show: false,
        data: [data.seriesName],
      },
      grid: {
        top: '5%',
        right: '1%',
        bottom: '2.5%',
        left: '1.25%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: data.labels,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            padding: [10, 25, 10, 15],
            fontSize: theme.typography.body2.fontSize,
            fontWeight: theme.typography.fontWeightMedium as number,
            color: theme.palette.common.white,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          min: 0,
          max: Math.ceil(maxValue * 1.2),
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            padding: [0, 10, 0, 0],
            fontSize: theme.typography.body2.fontSize,
            fontWeight: theme.typography.fontWeightMedium as number,
            color: theme.palette.common.white,
          },
        },
      ],
      series: [
        {
          id: 1,
          name: data.seriesName,
          type: 'line',
          stack: 'Total',
          smooth: false,
          color: theme.palette.primary.main,
          lineStyle: {
            width: 2,
            color: theme.palette.primary.main,
          },
          showSymbol: false,
          areaStyle: {
            opacity: 1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 1,
                color: theme.palette.grey.A100,
              },
              {
                offset: 0,
                color: theme.palette.primary.main,
              },
            ]),
          },
          emphasis: {
            focus: 'series',
          },
          data: data.values,
        },
      ],
    }),
    [data, maxValue, theme],
  )
  return <ReactEChart ref={chartRef} echarts={echarts} option={option} {...rest} />
}

export default VisitorInsightsChart
