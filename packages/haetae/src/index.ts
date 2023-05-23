import { parsePkg } from '@haetae/common'
import { dirname } from 'dirname-filename-esm'
import {
  HaetaeConfig,
  HaetaePreConfig,
  RootRecordData,
  configure as coreConfigure,
} from '@haetae/core'
import * as git from '@haetae/git'

export * as core from '@haetae/core'
export * as utils from '@haetae/utils'
export * as js from '@haetae/javascript'
export * as git from '@haetae/git'
export * as cli from '@haetae/cli'

export const pkg = parsePkg({ name: 'haetae', rootDir: dirname(import.meta) })

export const defaultRootRecordData: RootRecordData = async <D = unknown>(
  recordDataFromCommand: D | null,
) => {
  if (await git.initialized()) {
    return {
      ...(await git.recordData()),
      ...recordDataFromCommand,
    }
  }
  return recordDataFromCommand
}

export function configure<D = unknown, E = unknown>(
  haetaePreConfig: HaetaePreConfig<D | unknown, E | unknown>,
): HaetaeConfig<D, E> {
  return coreConfigure({
    recordData: defaultRootRecordData,
    ...haetaePreConfig,
  })
}
