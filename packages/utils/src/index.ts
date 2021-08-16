import { getConfigDirnameFromEnvVar } from '@haetae/core'
import path from 'path'
import fs from 'fs'

import dependencyTree from 'dependency-tree'

export interface DependsOnOptions {
  tsConfig?: string
  rootDir?: string
  // TODO: more options
}

export async function dependsOn(
  filenames: readonly string[],
  { tsConfig, rootDir = getConfigDirnameFromEnvVar() }: DependsOnOptions = {},
) {
  // default option.tsConfig if exists
  if (fs.existsSync(path.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = tsConfig || path.join(rootDir, 'tsconfig.json')
  }
  return (target: string): boolean => {
    // This includes target file itself as well.
    const deepDepsList = dependencyTree.toList({
      directory: rootDir,
      filename: target,
      tsConfig,
    })
    for (const filename of filenames) {
      if (deepDepsList.includes(filename)) {
        return true
      }
    }
    return false
  }
}

// TODO: unlink

// async function main() {
//   const rootDir = path.join(__dirname, '..', '..', '..', 'test-project')
//   const filename = path.join(
//     rootDir,
//     'packages',
//     'bar',
//     'test',
//     'unit',
//     'index.test.ts',
//   )
//   const tsConfig = path.join(rootDir, 'tsconfig.json')
//   const deepDepsList = dependencyTree.toList({
//     directory: rootDir,
//     filename,
//     tsConfig,
//   })
//   console.log(rootDir)
//   console.log(filename)
//   console.log(tsConfig)
//   console.log(deepDepsList)
// }

// main()

// // /media/jjangga/SHARE/haetae/test-project
// // /media/jjangga/SHARE/haetae/test-project/packages/bar/test/unit/index.test.ts
// // /media/jjangga/SHARE/haetae/test-project/tsconfig.json
