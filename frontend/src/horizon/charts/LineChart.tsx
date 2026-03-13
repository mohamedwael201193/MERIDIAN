import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

interface LineChartProps {
  series: ApexOptions['series'];
  options: ApexOptions;
}

export default function LineChart({ series, options }: LineChartProps) {
  return <Chart options={options} type="line" width="100%" height="100%" series={series} />;
}
