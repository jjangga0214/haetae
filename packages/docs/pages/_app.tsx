import 'nextra-theme-docs/style.css'
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from '@mui/material/styles'
import { useTheme, ThemeProvider } from 'next-themes'
import { useEffect, useState } from 'react'

interface NextraProps {
  Component: React.FC
  pageProps: Record<string, unknown>
}

function Main({ Component, pageProps }: NextraProps): JSX.Element {
  // Avoid Hydration Mismatch: https://github.com/pacocoursey/next-themes#avoid-hydration-mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // `useTheme` can only be used under `<ThemeProvider>`
  const { resolvedTheme } = useTheme()
  const theme = createTheme({
    palette: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mode: mounted ? resolvedTheme : 'light',
    },
  })

  return (
    <MuiThemeProvider theme={theme}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...pageProps} />
    </MuiThemeProvider>
  )
}

export default function Nextra({
  Component,
  pageProps,
}: NextraProps): JSX.Element {
  return (
    /**
     * Nextra internally uses ThemeProvider.
     * REF: https://github.com/shuding/nextra/blob/a8c588385f7a968125f5b9831f209292336b7674/packages/nextra-theme-docs/src/contexts/config.tsx#L47-L52
     * Nextra theme config (e.g. theme.config.tsx) is applied to ThemeProvider.
     * This "outer" ThemeProvider may be out of sync with the "internal" ThemeProvider.
     * In that case, the config should be synced by hard-coding here in duplicated manner.
     */
    // `useTheme` can only be used under `<ThemeProvider>`. That's the reason to place <Main> in it.
    <ThemeProvider attribute="class" disableTransitionOnChange>
      <Main Component={Component} pageProps={pageProps} />
    </ThemeProvider>
  )
}
