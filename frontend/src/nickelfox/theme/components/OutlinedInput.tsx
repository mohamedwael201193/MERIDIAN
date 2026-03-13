import { Theme } from '@mui/material'
import { Components } from '@mui/material/styles/components'
import { meridianTokens } from '@/design/tokens'

const OutlinedInput: Components<Omit<Theme, 'components'>>['MuiOutlinedInput'] = {
  defaultProps: { autoComplete: 'off' },
  styleOverrides: {
    root: ({ theme }) => ({
      paddingLeft: 0,
      borderRadius: `${meridianTokens.radius.md}px`,
      backgroundColor: meridianTokens.color.panel,
      transition: theme.transitions.create(['box-shadow', 'border-color', 'background-color'], { duration: 160 }),
      '&:hover': {
        backgroundColor: meridianTokens.color.bgElevated,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: meridianTokens.color.panelBorder,
        borderWidth: 1,
      },
      '&.Mui-focused': {
        backgroundColor: meridianTokens.color.bgElevated,
        boxShadow: `0 0 0 3px ${theme.palette.primary.main}26`,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
      },
      '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.divider,
      },
      '&.MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline > legend': {
        width: 0,
      },
    }),
    input: ({ theme }) => ({
      marginLeft: theme.spacing(3),
      color: theme.palette.text.secondary,
      '&::placeholder': {
        opacity: 1,
        color: theme.palette.text.primary,
      },
    }),
    notchedOutline: () => ({
      borderColor: meridianTokens.color.panelBorder,
    }),
  },
}

export default OutlinedInput
