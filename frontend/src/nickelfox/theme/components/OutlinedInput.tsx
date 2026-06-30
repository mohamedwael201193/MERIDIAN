import { Theme } from '@mui/material'
import { Components } from '@mui/material/styles/components'

const OutlinedInput: Components<Omit<Theme, 'components'>>['MuiOutlinedInput'] = {
  defaultProps: { autoComplete: 'off' },
  styleOverrides: {
    root: ({ theme }) => ({
      paddingLeft: 0,
      borderRadius: theme.shape.borderRadius * 2.5,
      transition: theme.transitions.create(['box-shadow', 'border-color'], { duration: 160 }),
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.text.secondary,
        borderWidth: 1,
      },
      '&.Mui-focused': {
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
    notchedOutline: ({ theme }) => ({
      borderColor: theme.palette.text.primary,
      '&:hover': {
        borderColor: theme.palette.text.secondary,
      },
    }),
  },
}

export default OutlinedInput
