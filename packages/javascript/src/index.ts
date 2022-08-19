import fs from 'fs'
import upath from 'upath'
import dependencyTree from 'dependency-tree'
import { getConfigDirname } from '@haetae/core'
import { DepsGraph, graph } from '@haetae/utils'
import { RootDirOption } from './version'

export { default as pkg } from './pkg'
export { version, RootDirOption } from './version'

export interface DependsOnOptions extends RootDirOption {
  tsConfig?: string
  additionalGraph?: DepsGraph // you can manually specify additional dependency graph
}

/**
 * @param rootDir has to be absolute path
 * @param edges // You can specify any dependency graph regardless of extension
 * [ // When foo depends on bar and baz.
 *   { 'dependents': ['path/to/foo.ts'], dependencies: ['path/to/bar.ts', 'path/to/baz.ts'],
 * ]
 */
export function dependsOn(
  filenames: readonly string[],
  {
    tsConfig,
    rootDir = getConfigDirname(),
    additionalGraph = graph({ edges: [], rootDir }),
  }: DependsOnOptions = {},
) {
  // default option.tsConfig if exists
  if (fs.existsSync(upath.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = tsConfig || upath.join(rootDir, 'tsconfig.json')
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _filenames = filenames
    .map((filename) =>
      upath.isAbsolute(filename) ? filename : upath.join(rootDir, filename),
    )
    .map((filename) => upath.normalize(filename))

  return (target: string): boolean => {
    // This includes target file itself as well.
    const deepDepsList = dependencyTree.toList({
      directory: rootDir,
      filename: target,
      tsConfig,
    })
    for (const filename of _filenames) {
      if (deepDepsList.includes(filename)) {
        return true
      }
      if (additionalGraph[target]?.has(filename)) {
        return true
      }
      if (target === filename) {
        return true
      }
    }
    return false
  }
}
