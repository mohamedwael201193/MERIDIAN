import { keyframes } from '@mui/material'
import { meridianTokens } from '@/design/tokens'

/** Subtle pulsing spark on glass panels */
export const panelSparkShimmer = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`

export interface PanelSurfaceOptions {
  /** Show animated spark highlight (default true) */
  spark?: boolean
  /** Enable hover lift + border brighten */
  hover?: boolean
  /** Lighter nested surface for items inside a panel */
  nested?: boolean
}

/** Shared dark glass panel surface — use on all cards and panels */
export function panelSurfaceSx(options: PanelSurfaceOptions = {}): Record<string, unknown> {
  const { spark = true, hover = false, nested = false } = options

  const bg = nested ? meridianTokens.color.panelNested : meridianTokens.color.panel

  return {
    position: 'relative',
    overflow: 'hidden',
    bgcolor: bg,
    backgroundImage: [
      meridianTokens.surface.panelSpark,
      meridianTokens.surface.panelSparkAccent,
      meridianTokens.surface.panelSheen,
    ].join(', '),
    backdropFilter: meridianTokens.surface.backdropBlur,
    WebkitBackdropFilter: meridianTokens.surface.backdropBlur,
    border: '1px solid',
    borderColor: meridianTokens.surface.panelBorder,
    borderTopColor: meridianTokens.surface.panelBorderHighlight,
    boxShadow: nested ? meridianTokens.shadow.card : meridianTokens.shadow.panel,
    transition: 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
    '&::before': spark
      ? {
          content: '""',
          position: 'absolute',
          top: -1,
          left: '5%',
          width: '42%',
          height: 2,
          borderRadius: 2,
          background: meridianTokens.surface.panelSparkLine,
          pointerEvents: 'none',
          zIndex: 0,
          animation: `${panelSparkShimmer} 3.5s ease-in-out infinite`,
        }
      : undefined,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: meridianTokens.surface.panelEdge,
      pointerEvents: 'none',
      zIndex: 0,
    },
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
    ...(hover
      ? {
          cursor: 'pointer',
          '&:hover': {
            borderColor: meridianTokens.surface.panelHoverBorder,
            borderTopColor: 'rgba(255,255,255,0.28)',
            boxShadow: meridianTokens.shadow.cardHover,
            transform: 'translateY(-2px)',
          },
        }
      : {}),
  }
}
