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
  dependencyCandidates: readonly string[],
  {
    tsConfig,
    rootDir = getConfigDirname(),
    additionalGraph = graph({ edges: [], rootDir }),
  }: DependsOnOptions = {},
): (target: string) => boolean {
  // default option.tsConfig if exists
  if (fs.existsSync(upath.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = tsConfig || upath.join(rootDir, 'tsconfig.json')
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _dependencyCandidates = dependencyCandidates
    .map((dc) => (upath.isAbsolute(dc) ? dc : upath.join(rootDir, dc)))
    .map((dc) => upath.normalize(dc))

  return (dependentCandidate: string): boolean => {
    // This includes target file itself as well.
    const deepDepsList = dependencyTree.toList({
      directory: rootDir,
      filename: dependentCandidate,
      tsConfig,
    })
    console.log(deepDepsList)
    for (const dependencyCandidate of _dependencyCandidates) {
      if (
        deepDepsList.includes(dependencyCandidate) ||
        // TODO: deep graph search
        additionalGraph[dependentCandidate]?.has(dependencyCandidate) ||
        dependentCandidate === dependencyCandidate
      ) {
        return true
      }
    }
    return false
  }
}
