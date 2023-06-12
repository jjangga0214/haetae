import fs from 'node:fs'
import upath from 'upath'
import dependencyTree from 'dependency-tree'
import { dirname } from 'dirname-filename-esm'
import { parsePkg, toAbsolutePath } from '@haetae/common'
import filterAsync from 'node-filter-async'
import * as core from '@haetae/core'
import * as utils from '@haetae/utils'

export { version } from './version.js'
export type { VersionOptions } from './version.js' // We should separate type export to avoid swc's complaining

export const pkg = parsePkg({
  name: '@haetae/javascript',
  rootDir: dirname(import.meta),
})

interface GraphOptions {
  entrypoint: string
  tsConfig?: string
  rootDir?: string
}

// Why async even though it doesn't use any async operation?
// That's to prevent breaking change from sync to async in the future.
export async function graph({
  entrypoint,
  rootDir = core.getConfigDirname(),
  tsConfig,
}: GraphOptions): Promise<utils.DepsGraph> {
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

export interface DependsOnOptions {
  dependent: string
  dependencies: readonly string[]
  tsConfig?: string
  rootDir?: string
  additionalGraph?: utils.DepsGraph
  glob?: boolean
}

export async function dependsOn({
  dependent,
  dependencies,
  tsConfig, // TODO: automatic default tsconfig.json resolution by find-up
  rootDir = core.getConfigDirname(),
  additionalGraph,
  glob = true,
}: DependsOnOptions): Promise<boolean> {
  // eslint-disable-next-line no-param-reassign
  additionalGraph =
    additionalGraph || (await utils.graph({ edges: [], rootDir }))
  const jsGraph = await graph({
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
    glob,
  })
}

export interface DependOnOptions {
  dependents: readonly string[]
  dependencies: readonly string[]
  tsConfig?: string
  rootDir?: string
  additionalGraph?: utils.DepsGraph
  glob?: boolean
}

export async function dependOn({
  dependents,
  dependencies,
  tsConfig, // TODO: automatic default tsconfig.json resolution by find-up
  rootDir,
  additionalGraph,
  glob,
}: DependOnOptions): Promise<string[]> {
  return filterAsync(dependents, (dependent) =>
    dependsOn({
      dependent,
      dependencies,
      tsConfig,
      rootDir,
      additionalGraph,
      glob,
    }),
  )
}
