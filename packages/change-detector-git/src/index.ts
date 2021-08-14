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

interface HaetaeConfig {
  gitSha?: string
}

interface DetectChangeOptions {
  config: HaetaeConfig
}

async function detectChange({ config }: DetectChangeOptions) {
  // if (!config.gitSha) {
  //   // // 'git name-rev --name-only HEAD'
  //   // const currentBranchName = ''
  //   // // If you want to list all the files currently being tracked under the branch master, you could use this command:
  //   // const command = `git ls-tree -r ${currentBranchName} --name-only`
  //   return '*'
  // }

  const command = `git diff --name-only ${config.gitSha}`
  const res = await execAsync(command)
  return res.trim().split('\n')
}

async function main() {
  const res = await detectChange({ config: { gitSha: '3f8b7b9' } })
  console.log(res)
}

main()
