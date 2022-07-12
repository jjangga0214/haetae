import path from 'path'
import fs from 'fs'
import {
  getConfigDirname,
  getRecord,
  HaetaeRecord,
  HaetaePreRecord,
} from '@haetae/core'
import { glob, exec } from '@haetae/utils'

// todo: git submodule test

export const { name } = (() => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'package.json'),
    'utf8',
  )
  return JSON.parse(content)
})()

export interface ChangedFilesOptions {
  gitSha?: string | Promise<string>
  rootDir?: string
  includeUntracked?: boolean
  includeIgnored?: boolean
  fallback?: () => string[] | Promise<string[]>
}

export type GitPatchedHaetaeRecord = HaetaeRecord & {
  [name: string]: { gitSha: string }
}

/**
 * @returns
 *   - an array of changed filename.
 *   - an empth array if no change was made
 *   - every filenames if gitSha is not given
 * @memoized
 */
export const changedFiles = async ({
  gitSha = process.env.HAETAE_GIT_GITSHA ||
    getRecord().then(
      (r) => ((r as GitPatchedHaetaeRecord) || {})[name]?.gitSha,
    ),
  rootDir = getConfigDirname(),
  includeUntracked = true,
  includeIgnored = false,
  fallback = () =>
    // list of every files when gitSha is not given or cannot be found on record
    glob(['**'], {
      rootDir,
    }),
}: ChangedFilesOptions = {}): Promise<string[]> => {
  if (!(await gitSha)) {
    return fallback()
  }
  const res = []
  if (includeUntracked) {
    // untracked changes
    res.push(
      ...(
        await exec(
          `git ls-files --others${includeIgnored ? '' : ' --exclude-standard'}`,
          {
            cwd: rootDir,
          },
        )
      )
        .trim()
        .split('\n'),
    )
  }

  res.push(
    ...(
      await exec(`git diff --name-only ${gitSha}`, {
        cwd: rootDir,
      })
    )
      .trim()
      .split('\n'),
  )
  return res.map((filename) => path.join(rootDir, filename))
}

export interface RecordOptions {
  gitSha?: string | Promise<string>
  rootDir?: string
}

export async function record({
  rootDir = getConfigDirname(),
  gitSha = process.env.HAETAE_GIT_GITSHA ||
    exec('git rev-parse --verify HEAD', { cwd: rootDir }).then((res) =>
      res.trim(),
    ),
}: RecordOptions): Promise<HaetaePreRecord> {
  if (!gitSha) {
    throw new Error('gitSha is not given.')
  }
  return {
    [name]: {
      gitSha,
    },
  }
}

export interface BranchOptions {
  rootDir?: string
}

export async function branch({
  rootDir = getConfigDirname(),
}: BranchOptions = {}) {
  const res = await exec('git branch --show-current', {
    cwd: rootDir,
  })
  return res.trim()
}
