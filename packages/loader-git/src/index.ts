import childProcess from 'child_process'
import path from 'path'
import { configFileRootDir } from '@haetae/config'

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

export interface LoadChangedOptions {
  gitSha?: string
  rootDir?: string
}

/**
 * @returns
 *   - a array of changed file path.
 *   - an empth array if no change was made
 *   - null if gitSha is not given
 */
export async function loadChanged({
  gitSha,
  rootDir = configFileRootDir,
}: LoadChangedOptions) {
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
//   console.log(await loadChanged({ gitSha: '3f8b7b9' }))
// })()
