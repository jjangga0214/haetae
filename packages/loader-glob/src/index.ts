import globby from 'globby'
import path from 'path'

interface LoadByGlobOptions {
  patterns: readonly string[]
  cwd?: string
  fixedPatterns?: readonly string[]
}

export async function loadByGlob({
  patterns,
  cwd,
  fixedPatterns = ['!**/node_modules'],
}: LoadByGlobOptions) {
  return globby(
    patterns.map((p) => (!cwd ? p : path.join(cwd, p))).concat(fixedPatterns),
  )
}

// async function main() {
//   const res = await load({ patterns: ['../../**'] })
//   console.log(res)
// }

// main()
