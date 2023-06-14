import { PromiseOr, toAbsolutePath } from '@haetae/common'
import * as core from '@haetae/core'
import isEqual from 'lodash.isequal'
import pickBy from 'lodash.pickby'
import memoizee from 'memoizee'
import multimatch from 'multimatch'
import filterAsync from 'node-filter-async'
import fs from 'node:fs/promises'
import serialize from 'serialize-javascript'
import upath from 'upath'
import { glob, hash } from './utils.js'
import { recordData } from './pkg.js'

// eslint-disable-next-line @typescript-eslint/naming-convention
const _hash = hash

// eslint-disable-next-line @typescript-eslint/naming-convention
const _glob = glob

export interface ChangedFilesOptions {
  rootDir?: string
  renew?: readonly string[]
  hash?: (filename: string) => PromiseOr<string>
  filterByExistence?: boolean
  keepRemovedFiles?: boolean
  reserveRecordData?: boolean
  previousFiles?: Record<string, string>
  glob?: boolean
}

export const changedFiles = memoizee(
  async (
    files: readonly string[],
    {
      rootDir = core.getConfigDirname(),
      hash = (filename) => _hash([filename], { rootDir }),
      renew = files,
      filterByExistence = false,
      keepRemovedFiles = true,
      reserveRecordData = true,
      previousFiles,
      glob = true,
    }: ChangedFilesOptions = {},
  ): Promise<string[]> => {
    /* eslint-disable no-param-reassign */
    rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
    files = files.map((f) =>
      upath.isAbsolute(f) ? upath.relative(rootDir, f) : f,
    )
    renew = renew.map((f) =>
      upath.isAbsolute(f) ? upath.relative(rootDir, f) : f,
    )
    // `previousFiles` are filtered by `files`
    const matchedPrevFiles = pickBy(previousFiles || {}, (_, file) =>
      glob ? isEqual([file], multimatch([file], files)) : files.includes(file),
    )
    /* eslint-enable no-param-reassign */
    const toRenew = new Set<string>(
      glob
        ? [
            ...multimatch(files, renew),
            ...multimatch(Object.keys(matchedPrevFiles), renew),
          ]
        : renew,
    )

    const filesData: Record<string, string> = {}

    const exists = async (file: string) => {
      try {
        await fs.access(upath.resolve(rootDir, file))
        return true
      } catch {
        return false
      }
    }
    const targets = [
      ...new Set(
        [
          ...(glob ? await _glob(files, { rootDir }) : files),
          ...Object.keys(matchedPrevFiles),
        ].map((f) => (upath.isAbsolute(f) ? upath.relative(rootDir, f) : f)),
      ),
    ]

    const result = await filterAsync(targets, async (file) => {
      if (await exists(file)) {
        if (!toRenew.has(file) && !matchedPrevFiles[file]) {
          // This is a new file and hash is not needed to be calculated as not to be recorded
          return true
        }
        const hashed = await hash(file)
        if (toRenew.has(file)) {
          filesData[file] = hashed
        } else if (matchedPrevFiles[file]) {
          filesData[file] = matchedPrevFiles[file]
        }
        return matchedPrevFiles[file] !== hashed
      }
      if (matchedPrevFiles[file]) {
        if (keepRemovedFiles && !toRenew.has(file)) {
          filesData[file] = matchedPrevFiles[file]
        }
        return !filterByExistence
      }
      return false
    })

    if (reserveRecordData) {
      core.reserveRecordData(await recordData({ files: filesData }))
    }
    return result.map((file) => upath.resolve(rootDir, file))
  },
  {
    normalizer: serialize,
  },
)
