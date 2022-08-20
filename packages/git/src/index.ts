import upath from 'upath'
import { getConfigDirname, getRecord } from '@haetae/core'
import { glob, exec } from '@haetae/utils'
import pkg from './pkg'

type PromiseOr<T> = Promise<T> | T

export { default as pkg } from './pkg'
// todo: git submodule test

export interface GitHaetaeRecordData {
  [pkg.name]: { commit: string; branch: string; pkgVersion: string }
}

/**
 * Check if git is installed on the system.
 */
export async function installed({
  rootDir = getConfigDirname(),
} = {}): Promise<boolean> {
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
export async function initialized({
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

export async function untrackedFiles({
  rootDir = getConfigDirname(),
}: RootDirOption = {}): Promise<string[]> {
  return (
    await exec('git ls-files --others --exclude-standard', {
      cwd: rootDir,
    })
  )
    .split('\n')
    .filter((f) => f) // this removes empty string
    .map((f) => (upath.isAbsolute(f) ? f : upath.join(rootDir, f)))
}

export async function ignoredFiles({
  rootDir = getConfigDirname(),
}: RootDirOption = {}): Promise<string[]> {
  return (
    await exec('git ls-files --others --exclude-standard --ignored', {
      cwd: rootDir,
    })
  )
    .split('\n')
    .filter((f) => f) // this removes empty strings
    .map((f) => (upath.isAbsolute(f) ? f : upath.join(rootDir, f)))
}

export interface ChangedFilesOptions extends RootDirOption {
  from?: string | Promise<string | undefined | null | void>
  to?: string | Promise<string | undefined | null | void>
  includeUntracked?: boolean
  includeIgnored?: boolean
  // When commit ID is not given,
  // or commit ID cannot be found from record,
  // or `git diff` fails (e.g. by forced push)
  fallback?: (error?: Error) => PromiseOr<string[]> | never
}

/**
 * @returns
 *   - an array of changed filename.
 *   - an empth array if no change was made
 *   - every filenames if `commit` is not given
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _from = await from
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _to = await to
  if (!(await installed())) {
    throw new Error('git is not installed on the system, or $PATH is not set.')
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
      return await fallback()
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
}
