import type { ReactNode } from 'react'
import {
  MdBuild,
  MdDashboard,
  MdHistory,
  MdSecurity,
  MdSmartToy,
  MdToken,
  MdTrendingUp,
} from 'react-icons/md'

export interface DashboardRoute {
  name: string
  path: string
  icon: ReactNode
  description: string
}

export const dashboardRoutes: DashboardRoute[] = [
  {
    name: 'Overview',
    path: '/dashboard',
    icon: <MdDashboard className="h-5 w-5" />,
    description: 'Protocol KPIs and recent activity',
  },
  {
    name: 'Tokens',
    path: '/issue',
    icon: <MdToken className="h-5 w-5" />,
    description: 'MeridianToken registry and issuance',
  },
  {
    name: 'Staking & Yield',
    path: '/staking',
    icon: <MdTrendingUp className="h-5 w-5" />,
    description: 'StakingVault, APY, and distributions',
  },
  {
    name: 'Compliance',
    path: '/compliance',
    icon: <MdSecurity className="h-5 w-5" />,
    description: 'ERC-3643 attestations and sanctions',
  },
  {
    name: 'AI Agents',
    path: '/agents',
    icon: <MdSmartToy className="h-5 w-5" />,
    description: 'Agent Activity Center — live MCP timeline',
  },
  {
    name: 'Audit Trail',
    path: '/audit',
    icon: <MdHistory className="h-5 w-5" />,
    description: 'CEP-88 events and audit summaries',
  },
  {
    name: 'MCP Tools',
    path: '/mcp',
    icon: <MdBuild className="h-5 w-5" />,
    description: 'Non-custodial agent access layer',
  },
]
