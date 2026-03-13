export interface NavItem {
  id: number;
  path: string;
  title: string;
  icon: string;
  active: boolean;
}

const navItems: NavItem[] = [
  { id: 1, path: '/dashboard', title: 'Overview', icon: 'mingcute:home-1-fill', active: true },
  { id: 2, path: '/staking', title: 'Staking & Yield', icon: 'lucide:line-chart', active: true },
  { id: 3, path: '/compliance', title: 'Compliance', icon: 'mdi:shield-check-outline', active: true },
  { id: 4, path: '/agents', title: 'AI Agents', icon: 'mdi:robot-outline', active: true },
  { id: 5, path: '/audit', title: 'Audit Trail', icon: 'mdi:history', active: true },
  { id: 6, path: '/mcp', title: 'MCP Tools', icon: 'mdi:wrench-outline', active: true },
  { id: 7, path: '/x402', title: 'x402 Payments', icon: 'mdi:cash-lock', active: true },
  { id: 8, path: '/issue', title: 'Issue Token', icon: 'mdi:token', active: true },
  { id: 9, path: '/', title: 'Landing Page', icon: 'mdi:web', active: true },
];

export default navItems;
