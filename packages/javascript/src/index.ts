import fs from 'fs'
import upath from 'upath'
import dependencyTree from 'dependency-tree'
import { getConfigDirname } from '@haetae/core'
import { DepsGraph, graph } from '@haetae/utils'

export { default as pkg } from './pkg'
export { VersionOptions, version } from './version'

export interface DependsOnOptions {
  rootDir?: string
  tsConfig?: string
  additionalGraph?: DepsGraph // you can manually specify additional dependency graph
}

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
