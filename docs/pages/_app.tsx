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
  // `useTheme` can only be used under `<ThemeProvider>`
  const { resolvedTheme } = useTheme()
  const theme = createTheme({
    palette: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      mode: resolvedTheme,
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
  // Avoid Hydration Mismatch: https://github.com/pacocoursey/next-themes#avoid-hydration-mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (mounted) {
    return (
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <Main Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    )
  }
  return <Main Component={Component} pageProps={pageProps} />
}
