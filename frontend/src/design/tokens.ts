/** MERIDIAN institutional design tokens */
export const meridianTokens = {
  color: {
    bg: '#050505',
    bgElevated: '#0f0f14',
    glass: 'rgba(255,255,255,0.05)',
    glassBorder: 'rgba(255,255,255,0.1)',
    glassHover: 'rgba(255,255,255,0.08)',
    panel: '#060608',
    panelNested: '#0a0a0e',
    panelBorder: 'rgba(255,255,255,0.12)',
    panelHighlight: 'rgba(255,255,255,0.06)',
    accent: '#991b1b',
    accentMuted: 'rgba(153, 27, 27, 0.14)',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    textPrimary: '#fafafa',
    textSecondary: 'rgba(255,255,255,0.62)',
    textMuted: 'rgba(255,255,255,0.42)',
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  shadow: {
    card: '0 4px 28px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
    cardHover:
      '0 12px 40px rgba(0,0,0,0.7), 0 0 32px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.1)',
    panel:
      '0 8px 32px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.07)',
    glow: '0 0 48px rgba(255,255,255,0.06), 0 0 24px rgba(153,27,27,0.08)',
  },
  brand: {
    main: '#991b1b',
    dark: '#7f1d1d',
    rgb: '153, 27, 27',
  },
  surface: {
    backdropBlur: 'blur(20px) saturate(1.12)',
    panelSheen:
      'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 14%, transparent 48%)',
    panelSpark:
      'radial-gradient(ellipse 90% 55% at 8% -8%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 28%, transparent 62%)',
    panelSparkAccent:
      'radial-gradient(ellipse 55% 45% at 96% 108%, rgba(153,27,27,0.14) 0%, transparent 58%)',
    panelSparkLine:
      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0.35) 65%, transparent 100%)',
    panelSparkGlow:
      'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)',
    panelBorder: 'rgba(255,255,255,0.12)',
    panelBorderHighlight: 'rgba(255,255,255,0.2)',
    panelEdge: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
    panelHoverBorder: 'rgba(255,255,255,0.26)',
  },
  motion: {
    spring: { type: 'spring' as const, stiffness: 380, damping: 32 },
    ease: [0.22, 1, 0.36, 1] as const,
    duration: 0.35,
  },
  spacing: {
    pageMax: 1280,
    /** MUI spacing units between panel tiles (1 unit = 8px) */
    panelGap: 5,
    /** Vertical gap between major page sections */
    sectionGap: 6,
    briefingGap: 40,
    sectionY: 48,
    ribbonMb: 5,
    headerMb: 5,
    panelPadding: 3.5,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    fontFamilyMono: '"IBM Plex Mono", ui-monospace, monospace',
    display: {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.035em',
      lineHeight: 1.15,
    },
    title: {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    label: {
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
    },
    mono: { fontFamily: '"IBM Plex Mono", ui-monospace, monospace' },
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
    label: 'Simulation',
    human: 'Validating amounts, targets, and expected outcomes',
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
    human: 'Finality reached and indexer will reflect state',
    traceTypes: ['finality', 'indexer_updated', 'complete'],
  },
]
