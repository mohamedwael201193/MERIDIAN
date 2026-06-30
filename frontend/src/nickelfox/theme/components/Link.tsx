import { Theme } from '@mui/material'
import { Components } from '@mui/material/styles/components'
import { forwardRef } from 'react'
import NextLink from 'next/link'

const LinkBehavior = forwardRef<
  HTMLAnchorElement,
  { href?: string; className?: string; children?: React.ReactNode }
>(({ href = '/', ...props }, ref) => <NextLink ref={ref} href={href} {...props} />)

LinkBehavior.displayName = 'LinkBehavior'

const Link: Components<Omit<Theme, 'components'>>['MuiLink'] = {
  defaultProps: {
    underline: 'none',
    component: LinkBehavior,
  },
  styleOverrides: {},
}

export default Link
