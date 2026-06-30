import { DefaultThemes, ThemeModeType, buildTheme } from '@make-software/csprclick-ui'

export const meridianClickTheme = buildTheme({
  ...DefaultThemes.csprclick,
})

export const meridianClickDarkTheme = meridianClickTheme[ThemeModeType.dark]

export { ThemeModeType }
