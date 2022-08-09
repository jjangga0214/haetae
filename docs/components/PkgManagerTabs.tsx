import { Tab, Box } from '@mui/material'
import { TabPanel, TabList, TabContext } from '@mui/lab'

// eslint-disable-next-line func-names
export default function ({
  children,
}: {
  children: JSX.Element[]
}): JSX.Element {
  const value = 'npm'
  return (
    <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <TabList value="npm">
          <Tab label="NPM" value="npm" />
          <Tab label="YARN" value="yarn" />
          <Tab label="PNPM" value="pnpm" />
        </TabList>
      </Box>
      <TabPanel value="npm">{children[0]}</TabPanel>
      <TabPanel value="yarn">{children[1]}</TabPanel>
      <TabPanel value="pnpm">{children[2]}</TabPanel>
    </TabContext>
  )
}
