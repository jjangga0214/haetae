import upath from 'upath'
import { getConfigDirname, getRecord } from '@haetae/core'
import { glob, exec } from '@haetae/utils'
import pkg from './pkg'

export { default as pkg } from './pkg'
// todo: git submodule test

export interface GitHaetaeRecordData {
  [pkg.name]: { commit: string; branch: string; pkgVersion: string }
}

/**
 * Check if git is installed on the system.
 */
export async function isInstalled({ rootDir = getConfigDirname() } = {}) {
  try {
    await exec('git --version', {
      cwd: rootDir,
    })
    return true
  } catch {
    return false
  }
}

export interface RootDirOption {
  rootDir?: string
}

/**
 * Check if this is a git repository.
 */
export async function isInitialized({
  rootDir = getConfigDirname(),
}: RootDirOption = {}) {
  try {
    const res = await exec('git rev-parse --is-inside-work-tree', {
      cwd: rootDir,
    })
    return res === 'true'
  } catch {
    return false
  }
}

/**
 * @returns branch name. return falsy if it's detached HEAD.
 */
export async function branch({
  rootDir = getConfigDirname(),
}: RootDirOption = {}): Promise<string> {
  return exec('git branch --show-current', {
    cwd: rootDir,
  })
}

export async function commit({
  rootDir = getConfigDirname(),
}: RootDirOption = {}): Promise<string> {
  return exec('git rev-parse --verify HEAD', {
    cwd: rootDir,
  })
}

// This is to avoid naming collision for `recordData`.
// eslint-disable-next-line @typescript-eslint/naming-convention
const _branch = branch
// eslint-disable-next-line @typescript-eslint/naming-convention
const _commit = commit

export interface RecordOptions {
  commit?: string | Promise<string | undefined | void>
  branch?: string | Promise<string>
  pkgVersion?: string
}

export async function recordData({
  commit = _commit(),
  branch = _branch(),
  pkgVersion = pkg.version.value,
}: RecordOptions = {}): Promise<GitHaetaeRecordData> {
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

export interface ChangedFilesOptions extends RootDirOption {
  from?: string | Promise<string | undefined | null | void>
  to?: string | Promise<string | undefined | null | void>
  includeUntracked?: boolean
  includeIgnored?: boolean
  // When commit ID is not given,
  // or commit ID cannot be found from record,
  // or `git diff` fails (e.g. by forced push)
  fallback?: (error?: Error) => string[] | Promise<string[]> | never
}

/**
 * @returns
 *   - an array of changed filename.
 *   - an empth array if no change was made
 *   - every filenames if `commit` is not given
 * @memoized
 */
export const changedFiles = async ({
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
  if (!(await isInstalled())) {
    throw new Error('git is not installed on the system, or $PATH is not set.')
  }
  if (!(await isInitialized())) {
    throw new Error('git is not initialized. This is not a git repository.')
  }

  // When there is no record,
  // or the record does not have commit
  if (!(await from) || !(await to)) {
    return fallback()
  }

  try {
    const res = (
      await exec(`git diff --name-only ${from} ${to}`, {
        cwd: rootDir,
      })
    ).split('\n')

    if (includeUntracked) {
      // untracked changes
      res.push(
        ...(
          await exec(
            `git ls-files --others${
              includeIgnored ? '' : ' --exclude-standard'
            }`,
            {
              cwd: rootDir,
            },
          )
        ).split('\n'),
      )
    }

    return res.map((filename) => upath.join(rootDir, filename))
  } catch (error) {
    return fallback(error as Error)
  }
}
