import globby from 'globby'
import path from 'path'
import { configFileRootDir } from '@haetae/config'

interface LoadByGlobOptions {
  patterns: readonly string[]
  rootDir?: string
  fixedPatterns?: readonly string[]
}

export async function loadByGlob({
  patterns,
  rootDir = configFileRootDir,
  fixedPatterns = ['!**/node_modules'],
}: LoadByGlobOptions) {
  return globby(
    patterns
      .map((p) => (!rootDir ? p : path.join(rootDir, p)))
      .concat(fixedPatterns),
  )
}

// async function main() {
//   const res = await load({ patterns: ['../../**'] })
//   console.log(res)
// }

// main()
