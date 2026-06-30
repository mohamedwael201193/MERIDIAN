'use client'

import type { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { ClickProvider, ClickUI, ThemeModeType } from '@make-software/csprclick-ui'
import { getCsprClickConfig } from '@lib/csprclick'
import { meridianClickDarkTheme } from '@lib/csprclickTheme'

/** ClickUI + ThemeProvider initialize the CSPR.click runtime (required by the SDK). */
export default function ClickProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={meridianClickDarkTheme}>
      <ClickProvider options={getCsprClickConfig()}>
        <ClickUI rootAppElement="body" themeMode={ThemeModeType.dark} />
        {children}
      </ClickProvider>
    </ThemeProvider>
  )
}
