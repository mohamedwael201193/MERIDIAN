import type { ApexOptions } from 'apexcharts'

const chartBase: ApexOptions['chart'] = {
  background: 'transparent',
  foreColor: '#a3aed0',
  toolbar: { show: false },
}

const tooltipDark = {
  theme: 'dark' as const,
  style: {
    fontSize: '12px',
    backgroundColor: '#161622',
  },
}

export const lineChartDataStaked = [
  { name: 'Staked CSPR', data: [3.8, 4.0, 3.9, 4.1, 4.05, 4.25], color: '#dc2626' },
  { name: 'Rewards', data: [0.08, 0.09, 0.085, 0.095, 0.09, 0.092], color: '#f87171' },
]

export const lineChartOptionsStaked: ApexOptions = {
  theme: { mode: 'dark' },
  legend: { show: false },
  chart: { ...chartBase, type: 'line' },
  colors: ['#dc2626', '#f87171'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  tooltip: tooltipDark,
  grid: {
    show: true,
    borderColor: 'rgba(255,255,255,0.06)',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    categories: ['E1418', 'E1419', 'E1420', 'E1421', 'E1422', 'E1423'],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#A3AED0', fontSize: '12px', fontWeight: '500' } },
  },
  yaxis: { show: false },
}

export const barChartDataEraYield = [
  { name: 'Rewards', data: [12450, 12680, 12520, 12890, 12740], color: '#dc2626' },
  { name: 'Fees', data: [622, 634, 626, 644, 637], color: '#7f1d1d' },
]

export const barChartOptionsEraYield: ApexOptions = {
  theme: { mode: 'dark' },
  chart: { ...chartBase, stacked: true },
  colors: ['#dc2626', '#991b1b'],
  tooltip: tooltipDark,
  xaxis: {
    categories: ['1419', '1420', '1421', '1422', '1423'],
    labels: { show: true, style: { colors: '#A3AED0', fontSize: '14px', fontWeight: '500' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false },
  grid: {
    borderColor: 'rgba(255,255,255,0.06)',
    show: true,
    yaxis: { lines: { show: false } },
    xaxis: { lines: { show: false } },
  },
  fill: { type: 'solid', colors: ['#dc2626', '#991b1b'] },
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 10, columnWidth: '20px' } },
}

export const barChartDataEvents = [{ name: 'Events', data: [12, 18, 14, 22, 16, 19, 15] }]

export const barChartOptionsEvents: ApexOptions = {
  theme: { mode: 'dark' },
  chart: chartBase,
  colors: ['#dc2626'],
  tooltip: tooltipDark,
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    labels: { style: { colors: '#A3AED0', fontSize: '14px', fontWeight: '500' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { show: false },
  grid: {
    show: true,
    borderColor: 'rgba(255,255,255,0.06)',
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: false } },
  },
  fill: {
    type: 'gradient',
    gradient: {
      type: 'vertical',
      shadeIntensity: 1,
      opacityFrom: 0.95,
      opacityTo: 0.55,
      colorStops: [
        [
          { offset: 0, color: '#ef4444', opacity: 1 },
          { offset: 100, color: '#991b1b', opacity: 0.8 },
        ],
      ],
    },
  },
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 10, columnWidth: '40px' } },
}
