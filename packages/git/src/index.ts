import childProcess from 'child_process'
import path from 'path'
import memoizee from 'memoizee'
import {
  getConfigDirname,
  getRecord,
  HaetaeRecord,
  HaetaePreRecord,
} from '@haetae/core'
import { glob } from '@haetae/utils'
import serialize from 'serialize-javascript'

// todo: git submodule test

export const name = '@haetae/git'

export interface ExecOptions {
  uid?: number | undefined
  gid?: number | undefined
  cwd?: string | URL | undefined
  env?: NodeJS.ProcessEnv | undefined
  /**
   * @default true
   */
  windowsHide?: boolean | undefined
  /**
   * @default 0
   */
  timeout?: number | undefined
  shell?: string | undefined
  maxBuffer?: number | undefined
  killSignal?: NodeJS.Signals | number | undefined
}

export const execAsync = (
  command: string,
  options: ExecOptions = {},
): Promise<string> =>
  new Promise((resolve, reject) => {
    childProcess.exec(command, options, (err, stdout, stderr) => {
      if (stdout) {
        resolve(stdout)
      }
      reject(err || stderr)
    })
  })

export interface ChangedFilesOptions {
  gitSha?: string | Promise<string>
  rootDir?: string
  includeUntracked?: boolean
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
export const changedFiles = memoizee(
  async ({
    gitSha = process.env.HAETAE_GIT_GITSHA ||
      getRecord().then(
        (r) => ((r as GitPatchedHaetaeRecord) || {})[name]?.gitSha,
      ),
    rootDir = getConfigDirname(),
    includeUntracked = true,
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
          await execAsync('git ls-files --others --exclude-standard', {
            cwd: rootDir,
          })
        )
          .trim()
          .split('\n'),
      )
    }

    if (!gitSha) {
      throw new Error('gitSha is invalid.')
    }

    res.push(
      ...(
        await execAsync(`git diff --name-only ${gitSha}`, {
          cwd: rootDir,
        })
      )
        .trim()
        .split('\n'),
    )
    return res.map((filename) => path.join(rootDir, filename))
  },
  {
    normalizer: serialize,
  },
)

export interface RecordOptions {
  gitSha?: string | Promise<string>
  rootDir?: string
  includeUntracked: boolean
}

/**
 * @memoized
 */
export const record = memoizee(
  async ({
    rootDir = getConfigDirname(),
    gitSha = process.env.HAETAE_GIT_GITSHA ||
      execAsync('git rev-parse --verify HEAD', { cwd: rootDir }).then((res) =>
        res.trim(),
      ),
  }: RecordOptions): Promise<HaetaePreRecord> => {
    if (!gitSha) {
      throw new Error('gitSha is invalid.')
    }
    return {
      [name]: {
        gitSha,
      },
    }
  },
  {
    normalizer: serialize,
  },
)

export interface BranchOptions {
  rootDir?: string
}

export const branch = memoizee(
  async ({ rootDir = getConfigDirname() }: BranchOptions = {}) =>
    execAsync('git branch --show-current', {
      cwd: rootDir,
    }),
)
