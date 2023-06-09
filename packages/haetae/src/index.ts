import { parsePkg, Rec } from '@haetae/common'
import { dirname } from 'dirname-filename-esm'
import * as core from '@haetae/core'
import * as git from '@haetae/git'

export * as core from '@haetae/core'
export * as utils from '@haetae/utils'
export * as js from '@haetae/javascript'
export * as git from '@haetae/git'
export * as cli from '@haetae/cli'

export { $, $Exec } from '@haetae/utils'

export const pkg = parsePkg({ name: 'haetae', rootDir: dirname(import.meta) })

export const defaultRootRecordData: core.RootRecordData<
  Rec,
  Rec | (Rec & git.RecordData)
> = async (recordDataFromCommand: Rec) => {
  if (await git.initialized()) {
    return {
      ...(await git.recordData()),
      ...recordDataFromCommand,
    }
  }
  return recordDataFromCommand
}

export function configure<D extends Rec, E extends Rec>(
  haetaePreConfig: core.HaetaePreConfig,
): core.HaetaeConfig<D, E> {
  return core.configure({
    recordData: defaultRootRecordData,
    ...haetaePreConfig,
  })
}
