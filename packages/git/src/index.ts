import path from 'path'
import { getConfigDirname, getRecord } from '@haetae/core'
import { glob, exec } from '@haetae/utils'
import pkg from './pkg'

export { default as pkg } from './pkg'
// todo: git submodule test

export interface GitHaetaeRecordData {
  [pkg.name]: { commit: string; branch: string }
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

/**
 * Check if this is a git repository.
 */
export async function isInitialized({ rootDir = getConfigDirname() } = {}) {
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

/**
 * @returns branch name. return falsy if it's detached HEAD.
 */
export async function branch({
  rootDir = getConfigDirname(),
}: BranchOptions = {}): Promise<string> {
  return exec('git branch --show-current', {
    cwd: rootDir,
  })
}

// This is to avoid naming collision for `recordData`.
// eslint-disable-next-line @typescript-eslint/naming-convention
const _branch = branch

export interface RecordOptions {
  commit?: string | Promise<string | undefined | void>
  branch?: string | Promise<string>
}

export async function recordData({
  commit = exec('git rev-parse --verify HEAD', {
    cwd: getConfigDirname(),
  }).catch(() => {}),
  branch = _branch(),
}: RecordOptions = {}): Promise<GitHaetaeRecordData> {
  if (!(await commit)) {
    throw new Error('Cannot get commit ID of HEAD.')
  }
  return {
    [pkg.name]: {
      commit: (await commit) as string,
      branch: (await branch) || ('detached HEAD' as string),
    },
  }
}

export interface ChangedFilesOptions {
  from?: string | Promise<string | undefined | null | void>
  to?: string | Promise<string | undefined | null | void>
  rootDir?: string
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

    return res.map((filename) => path.join(rootDir, filename))
  } catch (error) {
    return fallback(error as Error)
  }
}
