import { Theme } from '@mui/material'
import { Components } from '@mui/material/styles/components'
import { meridianTokens } from '@/design/tokens'
import { panelSurfaceSx } from '@/design/surface'

const paperSurface = panelSurfaceSx({ spark: true })

const Paper: Components<Omit<Theme, 'components'>>['MuiPaper'] = {
  defaultProps: {},
  styleOverrides: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: `${meridianTokens.radius.lg}px`,
      ...paperSurface,
    },
  },
}

export default Paper
