import fs from 'node:fs'
import upath from 'upath'
import dependencyTree from 'dependency-tree'
import { dirname } from 'dirname-filename-esm'
import { parsePkg, toAbsolutePath } from '@haetae/common'
import * as core from '@haetae/core'
import * as utils from '@haetae/utils'

export { version } from './version.js'
// export { version, VersionOptions } from './version.js' TODO: export error of interface

export const pkg = parsePkg({
  name: '@haetae/javascript',
  rootDir: dirname(import.meta),
})

export interface DependsOnOptions {
  dependent: string
  dependencies: readonly string[] | Set<string>
  tsConfig?: string
  rootDir?: string
  additionalGraph?: utils.DepsGraph
}

interface GraphOptions {
  entrypoint: string
  tsConfig?: string
  rootDir?: string
}

export function graph({
  entrypoint,
  rootDir = core.getConfigDirname(),
  tsConfig,
}: GraphOptions): utils.DepsGraph {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  if (tsConfig) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = upath.resolve(rootDir, tsConfig)
  } else if (fs.existsSync(upath.resolve(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = upath.resolve(rootDir, 'tsconfig.json')
  }
  const baseTree = dependencyTree({
    // All absolute paths by default
    directory: rootDir,
    filename: upath.resolve(rootDir, entrypoint),
  })
  const queue: dependencyTree.Tree[] = [baseTree]
  const rawGraph: Record<string, string[]> = {}
  for (const tree of queue) {
    for (const [dependent, subTree] of Object.entries(tree)) {
      // If not already visited
      if (!rawGraph[dependent]) {
        rawGraph[dependent] = Object.keys(subTree)
        queue.push(subTree)
      }
    }
  }
  const result: Record<string, Set<string>> = {}
  for (const [dependent, directDependencies] of Object.entries(rawGraph)) {
    result[dependent] = new Set(directDependencies)
  }
  return result
}

export function dependsOn({
  dependent,
  dependencies,
  tsConfig, // TODO: automatic default tsconfig.json resolution by find-up
  rootDir = core.getConfigDirname(),
  additionalGraph = utils.graph({ edges: [], rootDir }),
}: DependsOnOptions): boolean {
  const jsGraph = graph({
    entrypoint: dependent,
    rootDir,
    tsConfig,
  })

  const mergedGraph = utils.mergeGraphs([jsGraph, additionalGraph])

  return utils.dependsOn({
    dependent,
    dependencies,
    graph: mergedGraph,
    rootDir,
  })
}
