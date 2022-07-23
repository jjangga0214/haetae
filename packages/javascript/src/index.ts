import { getConfigDirname } from '@haetae/core'
import path from 'path'
import fs from 'fs'
import dependencyTree from 'dependency-tree'

export { default as pkg } from './pkg'

export interface DependencyRelationship {
  dependents: readonly string[] | string
  dependencies: readonly string[] | string
}

export interface ToIndexedDependencyRelationshipsOptions {
  rootDir?: string
  relationships: readonly DependencyRelationship[]
}

export interface IndexedDependencyRelationships {
  [dependent: string]: Set<string> // dependencies[]
}

// TODO: test
export function toIndexedDependencyRelationships({
  rootDir = getConfigDirname(),
  relationships,
}: ToIndexedDependencyRelationshipsOptions): IndexedDependencyRelationships {
  const absoluteGraph: IndexedDependencyRelationships = {}
  const toAbsolute = (file: string) =>
    path.isAbsolute(file) ? file : path.join(rootDir, file)

  for (let { dependencies, dependents } of relationships) {
    dependents = Array.isArray(dependents) ? dependents : [dependents]
    dependencies = Array.isArray(dependencies) ? dependencies : [dependencies]
    dependents = dependents.map((dependent) => toAbsolute(dependent))
    dependencies = dependencies.map((dependency) => toAbsolute(dependency))
    for (const dependent of dependents) {
      absoluteGraph[dependent] = absoluteGraph[dependent] || new Set<string>()
      for (const dependency of dependencies) {
        absoluteGraph[dependent].add(dependency)
      }
    }
  }
  return absoluteGraph
}

export interface DependsOnOptions {
  tsConfig?: string
  rootDir?: string
  // TODO: more options
  relationships?: readonly DependencyRelationship[] // you can manually specify additional dependency graph
}

// TODO: test
/**
 * @param relationships // You can specify any dependency graph regardless of extension
 * [ // When foo depends on bar and baz.
 *   { 'dependents': ['path/to/foo.ts'], dependencies: ['path/to/bar.ts', 'path/to/baz.ts'],
 * ]
 */
export function dependsOn(
  filenames: readonly string[],
  {
    tsConfig,
    rootDir = getConfigDirname(),
    relationships = [],
  }: DependsOnOptions = {},
) {
  // default option.tsConfig if exists
  if (fs.existsSync(path.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = tsConfig || path.join(rootDir, 'tsconfig.json')
  }
  const indexedRelationships = toIndexedDependencyRelationships({
    rootDir,
    relationships,
  })

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
      if (indexedRelationships[target]?.has(filename)) {
        return true
      }
    }
    return false
  }
}

export const packageName = '@haetae/javascript'
