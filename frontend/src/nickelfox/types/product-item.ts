import { LinearProgressProps } from '@mui/material'

export interface ProductItem {
  id?: string
  name: string
  color: LinearProgressProps['color']
  sales: number
}
