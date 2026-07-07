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
    id: 'agent-os',
    label: 'Agent OS',
    items: [
      { id: 20, path: '/agent', title: 'Agent Console', icon: 'mdi:robot-outline' },
      { id: 21, path: '/missions', title: 'Mission Library', icon: 'mdi:target' },
      { id: 0, path: '/start', title: 'Install MERIDIAN', icon: 'mdi:rocket-launch-outline' },
      { id: 22, path: '/marketplace', title: 'Marketplace', icon: 'mdi:store-outline' },
    ],
  },
  {
    id: 'visualization',
    label: 'Visualization',
    items: [
      { id: 5, path: '/agents', title: 'Agent Timeline', icon: 'mdi:timeline-clock-outline' },
      { id: 1, path: '/dashboard', title: 'Dashboard', icon: 'mdi:view-dashboard-outline' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 3, path: '/compliance', title: 'Compliance', icon: 'mdi:shield-check-outline' },
      { id: 4, path: '/staking', title: 'Staking', icon: 'mdi:chart-line' },
      { id: 2, path: '/issue', title: 'Issue Token', icon: 'mdi:token' },
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
    id: 'legacy',
    label: 'Legacy',
    items: [
      { id: 10, path: '/playground', title: 'AI Playground', icon: 'mdi:flask-outline' },
      { id: 11, path: '/prompts', title: 'Prompt Library', icon: 'mdi:text-box-multiple-outline' },
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
