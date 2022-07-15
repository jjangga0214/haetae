import { getConfigDirname } from '@haetae/core'
import path from 'path'
import fs from 'fs'
import dependencyTree from 'dependency-tree'

export interface DependsOnOptions {
  tsConfig?: string
  rootDir?: string
  // TODO: more options
}

export async function dependsOn(
  filenames: readonly string[] | Promise<readonly string[]>,
  { tsConfig, rootDir = getConfigDirname() }: DependsOnOptions = {},
) {
  // default option.tsConfig if exists
  if (fs.existsSync(path.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = tsConfig || path.join(rootDir, 'tsconfig.json')
  }
  const resolvedFilenames = await filenames
  return (target: string): boolean => {
    // This includes target file itself as well.
    const deepDepsList = dependencyTree.toList({
      directory: rootDir,
      filename: target,
      tsConfig,
    })
    for (const filename of resolvedFilenames) {
      if (deepDepsList.includes(filename)) {
        return true
      }
    }
    return false
  }
}

export const { name: packageName, version: packageVersion } = (() => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'package.json'), {
    encoding: 'utf8',
  })
  return JSON.parse(content)
})()
