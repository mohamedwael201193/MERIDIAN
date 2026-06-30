import Chart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'

interface BarChartProps {
  chartData: ApexOptions['series']
  chartOptions: ApexOptions
}

export default function BarChart({ chartData, chartOptions }: BarChartProps) {
  return <Chart options={chartOptions} series={chartData} type="bar" width="100%" height="100%" />
}
