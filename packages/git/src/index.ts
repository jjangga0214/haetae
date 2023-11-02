import fs from 'node:fs/promises'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import { dirname } from 'dirname-filename-esm'
import upath from 'upath'
import filterAsync from 'node-filter-async'
import { findUp } from 'find-up'
import * as core from '@haetae/core'
import { $ } from '@haetae/utils'
import { Rec, parsePkg, toAbsolutePath } from '@haetae/common'
import assert from 'node:assert/strict'

const pkgName = '@haetae/git'
const $$ = $({ stdio: 'pipe' })

export const pkg = parsePkg({
  name: pkgName,
  rootDir: dirname(import.meta),
})

// todo: git submodule test

export interface RecordData extends Rec {
  [pkgName]: { commit: string; branch: string; specVersion: number }
}
async function resolveRootDir(rootDir?: string): Promise<string> {
  if (!rootDir) {
    const gitDir = await findUp('.git', {
      cwd: core.getConfigDirname(),
      type: 'directory',
    })
    return gitDir ? upath.dirname(gitDir) : core.getConfigDirname()
  }
  return toAbsolutePath({
    path: rootDir,
    rootDir: core.getConfigDirname,
  })
}

export interface InstalledOptions {
  rootDir?: string
}

export async function installed({
  rootDir = core.getConfigDirname(),
}: InstalledOptions = {}): Promise<boolean> {
  // eslint-disable-next-line no-param-reassign
  rootDir = await resolveRootDir(rootDir)
  try {
    const { stdout, failed } = await $$({ cwd: rootDir })`git --version`
    return !!stdout && !failed
  } catch {
    return false
  }
}

export interface InitializedOptions {
  rootDir?: string
}

// @throws when git is not installed
export async function initialized({
  rootDir = core.getConfigDirname(),
}: InitializedOptions = {}): Promise<boolean> {
  // eslint-disable-next-line no-param-reassign
  rootDir = await resolveRootDir(rootDir)
  try {
    const { stdout, failed } = await $$({
      cwd: rootDir,
    })`git rev-parse --is-inside-work-tree`
    return stdout === 'true' && !failed
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
  rootDir = await resolveRootDir(rootDir)
  const { stdout, failed } = await $$({
    cwd: rootDir,
  })`git branch --show-current`
  assert(!failed)
  return stdout
}

export interface CommitOptions {
  rootDir?: string
}

export async function commit({
  rootDir = core.getConfigDirname(),
}: CommitOptions = {}): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = await resolveRootDir(rootDir)
  const { stdout, failed } = await $$({
    cwd: rootDir,
  })`git rev-parse --verify HEAD`
  assert(!failed)
  return stdout
}

// This is to avoid naming collision for `recordData`.
// eslint-disable-next-line @typescript-eslint/naming-convention
const _branch = branch
// eslint-disable-next-line @typescript-eslint/naming-convention
const _commit = commit

export interface RecordDataOptions {
  commit?: string
  branch?: string
  specVersion?: number
}

export const recordDataSpecVersion = 1

export async function recordData(
  options: RecordDataOptions = {},
): Promise<RecordData> {
  const commit = options.commit || (await _commit())
  const branch = options.branch || (await _branch())
  const specVersion = options.specVersion || recordDataSpecVersion

  if (!(await commit)) {
    throw new Error('Cannot get commit ID of HEAD.')
  }
  return {
    [pkgName]: {
      commit: (await commit) as string,
      branch: (await branch) || ('detached HEAD' as string),
      specVersion,
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
  rootDir = await resolveRootDir(rootDir)
  const files = []
  const { stdout, failed } = await $$({
    cwd: rootDir,
  })`git ls-files --others --exclude-standard`
  assert(!failed)
  files.push(...stdout.split('\n'))
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
  rootDir = await resolveRootDir(rootDir)
  const { stdout, failed } = await $$({
    cwd: rootDir,
  })`git ls-files --others --exclude-standard --ignored`
  assert(!failed)
  return stdout
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
  filterByExistence?: boolean
  reserveRecordData?: boolean | typeof core.reserveRecordData
}

export const changedFiles = memoizee(
  async ({
    from,
    to,
    rootDir,
    includeUntracked = true,
    includeIgnored = false,
    filterByExistence = true,
    reserveRecordData = true,
  }: ChangedFilesOptions = {}): Promise<string[]> => {
    // eslint-disable-next-line no-param-reassign
    rootDir = await resolveRootDir(rootDir)

    if (from === undefined) {
      const config = await core.getConfig()
      const record = await config.store.getRecord<RecordData>()
      // eslint-disable-next-line no-param-reassign
      from = record?.data?.[pkg.name]?.commit
    }

    if (!(await installed())) {
      throw new Error(
        'git is not installed on the system, or $PATH is not set.',
      )
    }
    if (!(await initialized())) {
      throw new Error('git is not initialized. This is not a git repository.')
    }

    let result = []

    if (from) {
      const { stdout, failed } = await $$({
        cwd: rootDir,
      })`git --no-pager diff --name-only ${from} ${to || ''}`
      assert(!failed)
      result.push(...stdout.split('\n'))
    } else {
      const { stdout, failed } = await $$({
        cwd: rootDir,
      })`git ls-tree --full-tree --name-only -r ${to || 'HEAD'}`
      assert(!failed)
      result.push(...stdout.split('\n'))
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

    if (filterByExistence) {
      result = await filterAsync(result, async (f) => {
        try {
          await fs.access(f) // Check if the file exists
          return true
        } catch {
          return false
        }
      })
    }

    result = [...new Set(result)] // this removes duplicates

    if (reserveRecordData === true) {
      core.reserveRecordData(await recordData())
    } else if (typeof reserveRecordData === 'function') {
      reserveRecordData(await recordData())
    }
    return result
  },
  {
    normalizer: serialize,
  },
)
