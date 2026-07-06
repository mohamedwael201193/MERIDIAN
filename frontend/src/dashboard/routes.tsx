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
    path: '/dashboard/tokens',
    icon: <MdToken className="h-5 w-5" />,
    description: 'MeridianToken registry and issuance',
  },
  {
    name: 'Staking & Yield',
    path: '/dashboard/staking',
    icon: <MdTrendingUp className="h-5 w-5" />,
    description: 'StakingVault, APY, and distributions',
  },
  {
    name: 'Compliance',
    path: '/dashboard/compliance',
    icon: <MdSecurity className="h-5 w-5" />,
    description: 'ERC-3643 attestations and sanctions',
  },
  {
    name: 'AI Agents',
    path: '/dashboard/agents',
    icon: <MdSmartToy className="h-5 w-5" />,
    description: 'Agent Activity Center — live MCP timeline',
  },
  {
    name: 'Audit Trail',
    path: '/dashboard/audit',
    icon: <MdHistory className="h-5 w-5" />,
    description: 'CEP-88 events and audit summaries',
  },
  {
    name: 'MCP Tools',
    path: '/dashboard/mcp',
    icon: <MdBuild className="h-5 w-5" />,
    description: 'Non-custodial agent access layer',
  },
]
