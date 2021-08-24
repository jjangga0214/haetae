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

export const execAsync = (command: string): Promise<string> =>
  new Promise((resolve, reject) => {
    childProcess.exec(command, {}, (err, stdout, stderr) => {
      if (stdout) {
        resolve(stdout)
      }
      reject(err || stderr)
    })
  })

export interface LoadByGitChangedOptions {
  gitSha?: string | Promise<string>
  rootDir?: string
}

type PatchedHaetaeRecord = HaetaeRecord & {
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
    gitSha = getRecord().then((r) => (r as PatchedHaetaeRecord)[name].gitSha),
    rootDir = getConfigDirnameFromEnvVar(),
  }: LoadByGitChangedOptions): Promise<string[]> => {
    if (!gitSha) {
      throw new Error('gitSha is invalid.')
    }

    const command = `git diff --name-only ${gitSha}`
    const res = await execAsync(command)
    return res
      .trim()
      .split('\n')
      .map((filename) => path.join(rootDir, filename))
  },
  {
    normalizer: serialize,
  },
)

interface RecordGitOptions {
  gitSha?: string | Promise<string>
}

/**
 * @memoized
 */
export const recordGit = memoizee(
  async ({
    gitSha = execAsync('git rev-parse --verify HEAD').then((res) => res.trim()), // TODO: get default param from config, record
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
