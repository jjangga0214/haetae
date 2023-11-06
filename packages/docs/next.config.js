import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  staticImage: true,
})

export default {
  ...withNextra(),
  async redirects() {
    return [
      {
        source: '/getting-started',
        destination: '/',
        permanent: true,
      },
    ]
  },
}
