import childProcess from 'child_process'
import path from 'path'
import memoizee from 'memoizee'
import {
  getConfigDirnameFromEnvVar,
  getRecord,
  HaetaeRecord,
  HaetaePreRecord,
} from '@haetae/core'
import serialize from 'serialize-javascript'
import fs from 'fs'

export const { name } = (() => {
  const content = fs.readFileSync(
    path.join(__dirname, '..', 'package.json'),
    'utf8',
  )
  return JSON.parse(content)
})()

interface ExecOptions {
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

export interface LoadByGitChangedOptions {
  gitSha?: string | Promise<string>
  rootDir?: string
  includeUntracked: boolean
}

type GitPatchedHaetaeRecord = HaetaeRecord & {
  [name: string]: { gitSha: string }
}

/**
 * @returns
 *   - a array of changed file path.
 *   - an empth array if no change was made
 *   - null if gitSha is not given
 */

/**
 * @memoized
 */
export const loadByGitChanged = memoizee(
  async ({
    gitSha = process.env.HAETAE_GIT_GITSHA ||
      getRecord().then(
        (r) => ((r as GitPatchedHaetaeRecord) || {})[name]?.gitSha,
      ),
    rootDir = getConfigDirnameFromEnvVar(),
    includeUntracked = true,
  }: LoadByGitChangedOptions): Promise<string[]> => {
    if (!gitSha) {
      // gitSha =
      //   // Getting root(parentless) branch's initial commit
      //   await execAsync('git rev-list --max-parents=0 HEAD', {
      //     cwd: rootDir,
      //   }).then((res) => res.trim())
      // todo: glob(['**'])
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

export interface RecordGitOptions {
  gitSha?: string | Promise<string>
  rootDir?: string
  includeUntracked: boolean
}

/**
 * @memoized
 */
export const recordGit = memoizee(
  async ({
    rootDir = getConfigDirnameFromEnvVar(),
    gitSha = process.env.HAETAE_GIT_GITSHA ||
      execAsync('git rev-parse --verify HEAD', { cwd: rootDir }).then((res) =>
        res.trim(),
      ),
  }: RecordGitOptions): Promise<HaetaePreRecord> => {
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

// ;(async (): Promise<void> => {
// TODO: git submodule test
// TODO: memoization
//   console.log(await loadChanged({ gitSha: '3f8b7b9' }))
// })()
