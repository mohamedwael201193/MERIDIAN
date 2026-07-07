/** MERIDIAN institutional design tokens */
export const meridianTokens = {
  color: {
    bg: '#050505',
    bgElevated: 'rgba(255,255,255,0.03)',
    glass: 'rgba(255,255,255,0.04)',
    glassBorder: 'rgba(255,255,255,0.08)',
    glassHover: 'rgba(255,255,255,0.07)',
    accent: '#dc2626',
    accentMuted: 'rgba(220,38,38,0.15)',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    textPrimary: '#fafafa',
    textSecondary: 'rgba(255,255,255,0.55)',
    textMuted: 'rgba(255,255,255,0.35)',
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  shadow: {
    card: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
    cardHover: '0 8px 32px rgba(220,38,38,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
    glow: '0 0 40px rgba(220,38,38,0.12)',
  },
  motion: {
    spring: { type: 'spring' as const, stiffness: 380, damping: 32 },
    ease: [0.22, 1, 0.36, 1] as const,
    duration: 0.35,
  },
  spacing: {
    pageMax: 1280,
    briefingGap: 16,
    sectionY: 32,
  },
  typography: {
    display: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15 },
    title: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' },
    label: {
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    mono: { fontFamily: 'var(--font-geist-mono), monospace' },
  },
} as const

export type PipelineStageId =
  | 'planning'
  | 'contracts'
  | 'compliance'
  | 'wallet'
  | 'validators'
  | 'building'
  | 'simulation'
  | 'approval'
  | 'broadcast'
  | 'explorer'
  | 'confirmed'

export interface PipelineStageDef {
  id: PipelineStageId
  label: string
  human: string
  traceTypes: string[]
}

export const PIPELINE_STAGES: PipelineStageDef[] = [
  {
    id: 'planning',
    label: 'Planning',
    human: 'Analyzing your request and selecting the right approach',
    traceTypes: ['objective_received', 'reasoning'],
  },
  {
    id: 'contracts',
    label: 'Reading contracts',
    human: 'Loading on-chain contract state from the indexer',
    traceTypes: ['tool_discovery', 'tool_selected'],
  },
  {
    id: 'compliance',
    label: 'Checking compliance',
    human: 'Verifying ERC-3643 holder registry and sanctions status',
    traceTypes: [],
  },
  {
    id: 'wallet',
    label: 'Checking wallet',
    human: 'Confirming wallet connection and account permissions',
    traceTypes: ['wallet_required'],
  },
  {
    id: 'validators',
    label: 'Finding validator',
    human: 'Comparing Casper validators for optimal delegation',
    traceTypes: [],
  },
  {
    id: 'building',
    label: 'Building transaction',
    human: 'Constructing the unsigned transaction payload',
    traceTypes: ['tool_invoked'],
  },
  {
    id: 'simulation',
    label: 'Unsigned deploy',
    human: 'Deploy JSON generated for wallet signing',
    traceTypes: [],
  },
  {
    id: 'approval',
    label: 'Approval required',
    human: 'Waiting for your signature in Casper Wallet',
    traceTypes: ['wallet_signed'],
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    human: 'Submitting signed transaction to Casper testnet',
    traceTypes: ['deploy_broadcast'],
  },
  {
    id: 'explorer',
    label: 'Explorer',
    human: 'Transaction visible on testnet explorer',
    traceTypes: [],
  },
  {
    id: 'confirmed',
    label: 'Confirmed',
    human: 'Finality reached and backend reads revalidated',
    traceTypes: ['finality', 'indexer_updated', 'complete'],
  },
]
