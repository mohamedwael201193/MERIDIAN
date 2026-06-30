export interface NavItem {
  id: number
  path: string
  title: string
  icon: string
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ id: 1, path: '/dashboard', title: 'Dashboard', icon: 'mdi:view-dashboard-outline' }],
  },
  {
    id: 'assets',
    label: 'Assets',
    items: [{ id: 2, path: '/issue', title: 'Issue Token', icon: 'mdi:token' }],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 3, path: '/compliance', title: 'Compliance', icon: 'mdi:shield-check-outline' },
      { id: 4, path: '/staking', title: 'Staking', icon: 'mdi:chart-line' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      { id: 5, path: '/agents', title: 'AI Agents', icon: 'mdi:robot-outline' },
      { id: 6, path: '/audit', title: 'Audit', icon: 'mdi:history' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    items: [
      { id: 7, path: '/mcp', title: 'MCP Tools', icon: 'mdi:wrench-outline' },
      { id: 8, path: '/x402', title: 'x402 Payments', icon: 'mdi:cash-lock' },
    ],
  },
  {
    id: 'external',
    label: 'External',
    items: [{ id: 9, path: '/', title: 'Landing Page', icon: 'mdi:web' }],
  },
]

/** Flat list for legacy imports */
const navItems: NavItem[] = navGroups.flatMap((group) => group.items)

export default navItems
