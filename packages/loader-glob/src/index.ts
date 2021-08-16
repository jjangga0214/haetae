import globby from 'globby'
import path from 'path'
import { getConfigDirnameFromEnvVar } from '@haetae/core'

interface LoadByGlobOptions {
  rootDir?: string
  fixedPatterns?: readonly string[]
}

export async function loadByGlob(
  patterns: readonly string[],
  {
    rootDir = getConfigDirnameFromEnvVar(),
    // This also prevents yarn workspace or lerna's sub node_modules
    fixedPatterns = [`!${path.join('**', 'node_modules')}`],
  }: LoadByGlobOptions,
) {
  const absolutePatterns = patterns
    .map((pattern) => {
      if (rootDir) {
        if (pattern.startsWith('!')) {
          return `!${path.join(rootDir, pattern.replace('!', ''))}`
        }
        return path.join(rootDir, pattern)
      }
      return pattern
    })
    .concat(fixedPatterns)

  return globby(absolutePatterns)
}
