import fs from 'node:fs/promises'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import { dirname } from 'dirname-filename-esm'
import upath from 'upath'
import filterAsync from 'node-filter-async'
import * as core from '@haetae/core'
import * as utils from '@haetae/utils'
import { Rec, parsePkg, toAbsolutePath } from '@haetae/common'

const pkgName = '@haetae/git'

export const pkg = parsePkg({
  name: pkgName,
  rootDir: dirname(import.meta),
})

// todo: git submodule test

export interface RecordData extends Rec {
  [pkgName]: { commit: string; branch: string; pkgVersion: string }
}

export interface InstalledOptions {
  rootDir?: string
}

export async function installed({
  rootDir = core.getConfigDirname(),
}: InstalledOptions = {}): Promise<boolean> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  try {
    await utils.exec('git --version', {
      cwd: rootDir,
    })
    return true
  } catch {
    return false
  }
}

export interface InitializedOptions {
  rootDir?: string
}

export async function initialized({
  rootDir = core.getConfigDirname(),
}: InitializedOptions = {}) {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  try {
    const res = await utils.exec('git rev-parse --is-inside-work-tree', {
      cwd: rootDir,
    })
    return res === 'true'
  } catch {
    return false
  }
}

export interface BranchOptions {
  rootDir?: string
}

export async function branch({
  rootDir = core.getConfigDirname(),
}: BranchOptions = {}): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  return utils.exec('git branch --show-current', {
    cwd: rootDir,
  })
}

export interface CommitOptions {
  rootDir?: string
}

export async function commit({
  rootDir = core.getConfigDirname(),
}: CommitOptions = {}): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  return utils.exec('git rev-parse --verify HEAD', {
    cwd: rootDir,
  })
}

// This is to avoid naming collision for `recordData`.
// eslint-disable-next-line @typescript-eslint/naming-convention
const _branch = branch
// eslint-disable-next-line @typescript-eslint/naming-convention
const _commit = commit

export interface RecordDataOptions {
  commit?: string
  branch?: string
  pkgVersion?: string
}

export async function recordData(
  options: RecordDataOptions = {},
): Promise<RecordData> {
  const commit = options.commit || (await _commit())
  const branch = options.branch || (await _branch())
  const pkgVersion = options.pkgVersion || pkg.version.value

  if (!(await commit)) {
    throw new Error('Cannot get commit ID of HEAD.')
  }
  return {
    [pkgName]: {
      commit: (await commit) as string,
      branch: (await branch) || ('detached HEAD' as string),
      pkgVersion,
    },
  }
}

export interface UntrackedFilesOptions {
  rootDir?: string
}

export async function untrackedFiles({
  rootDir = core.getConfigDirname(),
}: UntrackedFilesOptions = {}): Promise<string[]> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  const files = []
  try {
    files.push(
      ...(
        await utils.exec('git ls-files --others --exclude-standard', {
          cwd: rootDir,
        })
      ).split('\n'),
    )
  } catch (error) {
    // When there is no untracked files,
    // an error (with exactly empty string '') occurs, but it is not a problem.
    if (error !== '') {
      throw error
    }
  }
  return files
    .filter((f) => f) // this removes empty string
    .map((f) => toAbsolutePath({ path: f, rootDir }))
}

export interface IgnoredFilesOptions {
  rootDir?: string
}

export async function ignoredFiles({
  rootDir = core.getConfigDirname(),
}: IgnoredFilesOptions = {}): Promise<string[]> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  return (
    await utils.exec('git ls-files --others --exclude-standard --ignored', {
      cwd: rootDir,
    })
  )
    .split('\n')
    .filter((f) => f) // this removes empty strings
    .map((f) => toAbsolutePath({ path: f, rootDir }))
}

export interface ChangedFilesOptions {
  from?: string
  to?: string
  rootDir?: string
  includeUntracked?: boolean
  includeIgnored?: boolean
  checkExistence?: boolean
}

export const changedFiles = memoizee(
  async ({
    from,
    to,
    rootDir = core.getConfigDirname(),
    includeUntracked = true,
    includeIgnored = false,
    checkExistence = true,
  }: ChangedFilesOptions = {}): Promise<string[]> => {
    // eslint-disable-next-line no-param-reassign
    from =
      from ||
      (await core
        .getRecord<RecordData>()
        .then(
          (res?: core.HaetaeRecord<RecordData>) =>
            res?.data?.[pkg.name]?.commit,
        ))
    // eslint-disable-next-line no-param-reassign
    rootDir = toAbsolutePath({
      path: rootDir,
      rootDir: core.getConfigDirname,
    })
    if (!(await installed())) {
      throw new Error(
        'git is not installed on the system, or $PATH is not set.',
      )
    }
    if (!(await initialized())) {
      throw new Error('git is not initialized. This is not a git repository.')
    }
    const execute = (command: string): Promise<string[]> =>
      utils
        .exec(command, { cwd: rootDir })
        .then((res: string) => res.split('\n'))

    let result = []

    if (from) {
      try {
        result.push(
          ...(await execute(
            `git --no-pager diff --name-only ${from} ${to || ''}`.trim(),
          )),
        )
      } catch (error) {
        // When there is nothing to diff (e.g. when `_from` and `_to` are the same),
        // an error (with exactly empty string '') occurs but it is not a problem.
        if (error !== '') {
          throw error
        }
      }
    } else {
      result.push(
        ...(await utils.exec(
          `git ls-tree --full-tree --name-only -r ${to || 'HEAD'}`,
        )),
      )
    }

    if (includeUntracked) {
      result.push(...(await untrackedFiles({ rootDir })))
    }
    if (includeIgnored) {
      result.push(...(await ignoredFiles({ rootDir })))
    }
    result = result
      .filter((f) => f) // this removes empty string
      .map((f) => upath.resolve(rootDir, f))

    if (checkExistence) {
      result = await filterAsync(result, async (f) => {
        try {
          await fs.access(f)
          return true
        } catch {
          return false
        }
      })
    }

    return [...new Set(result)] // this removes duplicated files
  },
  {
    normalizer: serialize,
  },
)
