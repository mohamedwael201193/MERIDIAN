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

/** Three destinations. Everything else is reachable from chat or settings. */
export const navGroups: NavGroup[] = [
  {
    id: 'main',
    label: '',
    items: [
      { id: 20, path: '/agent', title: 'Home', icon: 'mdi:chat-outline' },
      { id: 5, path: '/activity', title: 'History', icon: 'mdi:history' },
      { id: 0, path: '/start', title: 'Get set up', icon: 'mdi:sparkles' },
    ],
  },
]

const navItems: NavItem[] = navGroups.flatMap((group) => group.items)

export default navItems
