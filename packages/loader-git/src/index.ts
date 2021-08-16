import childProcess from 'child_process'
import path from 'path'
import { getConfigDirnameFromEnvVar } from '@haetae/core'

function execAsync(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, {}, (err, stdout, stderr) => {
      if (stdout) {
        resolve(stdout)
      }
      reject(err || stderr)
    })
  })
}

export interface LoadByGitChangedOptions {
  gitSha?: string
  rootDir?: string
}

/**
 * @returns
 *   - a array of changed file path.
 *   - an empth array if no change was made
 *   - null if gitSha is not given
 */
export async function loadByGitChanged({
  gitSha, // TODO: get default param from config, record
  rootDir = getConfigDirnameFromEnvVar(),
}: LoadByGitChangedOptions) {
  if (!gitSha) {
    return null
  }

  const command = `git diff --name-only ${gitSha}`
  const res = await execAsync(command)
  return res
    .trim()
    .split('\n')
    .map((filename) => path.join(rootDir, filename))
}

// ;(async (): Promise<void> => {
// TODO: git submodule test
// TODO: memoization
//   console.log(await loadChanged({ gitSha: '3f8b7b9' }))
// })()
