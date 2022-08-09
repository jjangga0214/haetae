import { Tab, Tabs, Box } from '@mui/material'
import { TabPanel, TabContext } from '@mui/lab'
import { useCallback } from 'react'
import useSWR from 'swr'

enum PkgManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
}
const storageKey = 'PkgManager'

// eslint-disable-next-line func-names
export default function ({
  children,
}: {
  children: JSX.Element[]
}): JSX.Element {
  // Use SWR to sync every PkgManager choice.
  const { data, mutate } = useSWR(storageKey, (key) =>
    localStorage?.getItem(key),
  )
  const value = data || PkgManager.NPM

  const onChange = useCallback(
    (value: PkgManager) => {
      localStorage.setItem(storageKey, value)
      mutate(value, false)
    },
    [mutate],
  )

  return (
    <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={(_, _value) => onChange(_value)}>
          <Tab label="NPM" value={PkgManager.NPM} />
          <Tab label="YARN" value={PkgManager.YARN} />
          <Tab label="PNPM" value={PkgManager.PNPM} />
        </Tabs>
      </Box>
      <TabPanel value={PkgManager.NPM}>{children[0]}</TabPanel>
      <TabPanel value={PkgManager.YARN}>{children[1]}</TabPanel>
      <TabPanel value={PkgManager.PNPM}>{children[2]}</TabPanel>
    </TabContext>
  )
}
