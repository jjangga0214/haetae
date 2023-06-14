import { parsePkg, Rec } from '@haetae/common'
import { dirname } from 'dirname-filename-esm'

const pkgName = '@haetae/utils'

export const pkg = parsePkg({
  name: pkgName,
  rootDir: dirname(import.meta),
})

export interface RecordData extends Rec {
  [pkgName]: {
    files?: Record<string, string>
    pkgVersion: string
  }
}

export interface RecordDataOptions {
  files?: Record<string, string>
  pkgVersion?: string
}

// It's async for future compatibility
export async function recordData({
  files,
  pkgVersion = pkg.version.value,
}: RecordDataOptions = {}): Promise<RecordData> {
  return {
    [pkgName]: {
      files,
      pkgVersion,
    },
  }
}
