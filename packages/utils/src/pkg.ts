import { parsePkg, Rec } from '@haetae/common'
import { dirname } from 'dirname-filename-esm'

const pkgName = '@haetae/utils'

export const pkg = parsePkg({
  name: pkgName,
  rootDir: dirname(import.meta),
})

export const recordDataSpecVersion = 1

export interface RecordData extends Rec {
  [pkgName]: {
    files?: Record<string, string>
    specVersion: number
  }
}

export interface RecordDataOptions {
  files?: Record<string, string>
  specVersion?: number
}

// It's async for future compatibility
export async function recordData({
  files,
  specVersion = recordDataSpecVersion,
}: RecordDataOptions = {}): Promise<RecordData> {
  return {
    [pkgName]: {
      files,
      specVersion,
    },
  }
}
