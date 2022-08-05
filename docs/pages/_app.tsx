import 'nextra-theme-docs/style.css'

interface NextraProps {
  Component: React.FC
  pageProps: Record<string, unknown>
}

export default function Nextra({
  Component,
  pageProps,
}: NextraProps): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...pageProps} />
}
