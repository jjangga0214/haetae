import { Tab, Tabs, Box } from '@mui/material'
import { TabPanel, TabContext } from '@mui/lab'
import { useCallback } from 'react'
import useSWR from 'swr'

enum ProjectType {
  ESM = 'esm',
  CJS = 'cjs',
  ESM_TS = 'esm-typescript',
  CJS_TS = 'cjs-typescript',
}
const storageKey = 'ProjectType'

export default function ProjectTypeTabs({
  children,
}: {
  children: JSX.Element[]
}): JSX.Element {
  // Use SWR to sync every ProjectType choice.
  const { data, mutate } = useSWR(storageKey, (key) =>
    localStorage?.getItem(key),
  )
  const value = data || ProjectType.ESM

  const onChange = useCallback(
    (value: ProjectType) => {
      localStorage.setItem(storageKey, value)
      mutate(value, false)
    },
    [mutate],
  )

  return (
    <TabContext value={value}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={(_, _value) => onChange(_value)}>
          <Tab label="ESM" value={ProjectType.ESM} />
          <Tab label="CJS" value={ProjectType.CJS} />
          <Tab label="ESM + Typescript" value={ProjectType.ESM_TS} />
          <Tab label="CJS + Typescript" value={ProjectType.CJS_TS} />
        </Tabs>
      </Box>
      <TabPanel value={ProjectType.ESM}>{children[0]}</TabPanel>
      <TabPanel value={ProjectType.CJS}>{children[1]}</TabPanel>
      <TabPanel value={ProjectType.ESM_TS}>{children[2]}</TabPanel>
      <TabPanel value={ProjectType.CJS_TS}>{children[3]}</TabPanel>
    </TabContext>
  )
}
