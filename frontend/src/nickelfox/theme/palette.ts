import { PaletteOptions } from '@mui/material'
import { meridianRed, grey, green, pinkishRed, yellowOrange } from './colors'

const palette: PaletteOptions = {
  primary: {
    light: meridianRed[300],
    main: meridianRed[500],
    dark: meridianRed[700],
  },
  secondary: {
    light: meridianRed[200],
    main: meridianRed[400],
    dark: meridianRed[800],
  },
  success: {
    light: green[200],
    main: green[600],
    dark: green[900],
  },
  info: {
    light: '#93a5b8',
    main: '#64748b',
    dark: '#475569',
  },
  warning: {
    light: yellowOrange[50],
    main: yellowOrange[400],
    dark: yellowOrange[700],
  },
  error: {
    light: pinkishRed[300],
    main: pinkishRed[500],
    dark: pinkishRed[800],
  },
  background: {
    default: '#050505',
    paper: '#060608',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a3a3a3',
    disabled: '#737373',
  },
  divider: '#262626',
  action: {
    focus: '#525252',
    disabled: '#404040',
  },
  grey,
  common: {
    white: '#ffffff',
    black: '#000000',
  },
}

export default palette
