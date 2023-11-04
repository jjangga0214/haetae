import useSWR from 'swr'

enum PkgManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
}

const storageKey = 'PkgManager'

export default function PkgManagerTabs({
  children,
}: {
  children: JSX.Element[]
}): JSX.Element {
  // Use SWR to sync every PkgManager choice.
  const { data } = useSWR(storageKey, (key) => localStorage?.getItem(key))
  const value = data || PkgManager.NPM

  return (
    <>
      {value === PkgManager.NPM ? children[0] : undefined}
      {value === PkgManager.YARN ? children[1] : undefined}
      {value === PkgManager.PNPM ? children[2] : undefined}
    </>
  )
}
