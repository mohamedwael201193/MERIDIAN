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
    id: 'main',
    label: 'Workspace',
    items: [
      { id: 20, path: '/agent', title: 'Briefing', icon: 'mdi:view-dashboard-outline' },
      { id: 21, path: '/agents', title: 'Agents', icon: 'mdi:robot-outline' },
      { id: 5, path: '/activity', title: 'History', icon: 'mdi:history' },
    ],
  },
  {
    id: 'discover',
    label: 'Discover',
    items: [
      { id: 22, path: '/templates', title: 'Templates', icon: 'mdi:file-document-outline' },
      { id: 23, path: '/examples', title: 'Examples', icon: 'mdi:text-box-outline' },
      { id: 24, path: '/marketplace', title: 'Marketplace', icon: 'mdi:store-outline' },
    ],
  },
  {
    id: 'more',
    label: 'More',
    items: [
      { id: 0, path: '/start', title: 'Setup', icon: 'mdi:cog-outline' },
      { id: 1, path: '/dashboard', title: 'Operations', icon: 'mdi:chart-box-outline' },
      { id: 2, path: '/mcp', title: 'MCP Tools', icon: 'mdi:connection' },
    ],
  },
]

const navItems: NavItem[] = navGroups.flatMap((group) => group.items)

export default navItems
