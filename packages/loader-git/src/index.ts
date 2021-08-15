import childProcess from 'child_process'

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
}

/**
 * @returns
 *   - a array of changed file path.
 *   - an empth array if no change was made
 *   - null if gitSha is not given
 */
export async function loadChanged({ gitSha }: LoadChangedOptions) {
  if (!gitSha) {
    return null
  }

  const command = `git diff --name-only ${gitSha}`
  const res = await execAsync(command)
  return res.trim().split('\n')
}
