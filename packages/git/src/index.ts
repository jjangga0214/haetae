import upath from 'upath'
import { getConfigDirname, getRecord } from '@haetae/core'
import { glob, exec } from '@haetae/utils'
import { PromiseOr, parsePkg, toAbsolutePath } from '@haetae/common'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import { dirname } from 'dirname-filename-esm'

export const pkg = parsePkg({
  name: '@haetae/git',
  rootDir: dirname(import.meta),
})

// todo: git submodule test

export interface GitHaetaeRecordData {
  [pkg.name]: { commit: string; branch: string; pkgVersion: string }
}

export interface InstalledOptions {
  rootDir?: string
}

export async function installed({
  rootDir = getConfigDirname(),
}: InstalledOptions = {}): Promise<boolean> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname })
  try {
    await exec('git --version', {
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
  rootDir = getConfigDirname(),
}: InitializedOptions = {}) {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname })
  try {
    const res = await exec('git rev-parse --is-inside-work-tree', {
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
  rootDir = getConfigDirname(),
}: BranchOptions = {}): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname })
  return exec('git branch --show-current', {
    cwd: rootDir,
  })
}

export interface CommitOptions {
  rootDir?: string
}

export async function commit({
  rootDir = getConfigDirname(),
}: CommitOptions = {}): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname })
  return exec('git rev-parse --verify HEAD', {
    cwd: rootDir,
  })
}

// This is to avoid naming collision for `recordData`.
// eslint-disable-next-line @typescript-eslint/naming-convention
const _branch = branch
// eslint-disable-next-line @typescript-eslint/naming-convention
const _commit = commit

export interface RecordDataOptions {
  commit?: PromiseOr<string>
  branch?: PromiseOr<string>
  pkgVersion?: string
}

export async function recordData({
  commit = _commit(),
  branch = _branch(),
  pkgVersion = pkg.version.value,
}: RecordDataOptions = {}): Promise<GitHaetaeRecordData> {
  if (!(await commit)) {
    throw new Error('Cannot get commit ID of HEAD.')
  }
  return {
    [pkg.name]: {
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
  rootDir = getConfigDirname(),
}: UntrackedFilesOptions = {}): Promise<string[]> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname })
  return (
    await exec('git ls-files --others --exclude-standard', {
      cwd: rootDir,
    })
  )
    .split('\n')
    .filter((f) => f) // this removes empty string
    .map((f) => toAbsolutePath({ path: f, rootDir }))
}

export interface IgnoredFilesOptions {
  rootDir?: string
}

export async function ignoredFiles({
  rootDir = getConfigDirname(),
}: IgnoredFilesOptions = {}): Promise<string[]> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname })
  return (
    await exec('git ls-files --others --exclude-standard --ignored', {
      cwd: rootDir,
    })
  )
    .split('\n')
    .filter((f) => f) // this removes empty strings
    .map((f) => toAbsolutePath({ path: f, rootDir }))
}

export interface ChangedFilesOptions {
  from?: string | Promise<string | undefined | null | void>
  to?: string | Promise<string | undefined | null | void>
  rootDir?: string
  includeUntracked?: boolean
  includeIgnored?: boolean
  fallback?: (error?: Error) => PromiseOr<string[]> | never
}

export const changedFiles = memoizee(
  async ({
    from = getRecord<GitHaetaeRecordData>()
      .then(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (res) => res?.data![pkg.name]?.commit,
      )
      .catch(() => {}),
    to = 'HEAD',
    rootDir = getConfigDirname(),
    includeUntracked = true,
    includeIgnored = false,
    fallback = () => glob(['**'], { rootDir }),
  }: ChangedFilesOptions = {}): Promise<string[]> => {
    // eslint-disable-next-line no-param-reassign
    rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname })
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _from = await from
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _to = await to
    if (!(await installed())) {
      throw new Error(
        'git is not installed on the system, or $PATH is not set.',
      )
    }
    if (!(await initialized())) {
      throw new Error('git is not initialized. This is not a git repository.')
    }
    const execute = (command: string): Promise<string[]> =>
      exec(command, { cwd: rootDir }).then((res) => res.split('\n'))

    const result = []
    try {
      if (_from && _to) {
        result.push(...(await execute(`git diff --name-only ${_from} ${_to}`)))
      } else if (!_from && _to) {
        result.push(
          ...(await exec(`git ls-tree --full-tree --name-only -r ${_to}`)),
        )
      } else {
        return fallback()
      }

      if (includeUntracked) {
        result.push(...(await untrackedFiles({ rootDir })))
      }
      if (includeIgnored) {
        result.push(...(await ignoredFiles({ rootDir })))
      }

      return result
        .filter((f) => f) // this removes empty string
        .map((f) => (upath.isAbsolute(f) ? f : upath.join(rootDir, f)))
    } catch (error) {
      return fallback(error as Error)
    }
  },
  {
    normalizer: serialize,
  },
)
