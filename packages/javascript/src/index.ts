import { getConfigDirname } from '@haetae/core'
import path from 'path'
import fs from 'fs'
import dependencyTree from 'dependency-tree'

export interface DependsOnOptions {
  tsConfig?: string
  rootDir?: string
  // TODO: more options
  graph?: Record<string, string[]> // you can manually specify additional dependency graph
}

/**
 *
 * @param graph // You can specify any dependency graph regardless of extension
 * { // When foo depends on bar and baz.
 *   'path/to/foo.ts': ['path/to/bar.ts', 'path/to/baz.ts'],
 * }
 */
export function dependsOn(
  filenames: readonly string[],
  { tsConfig, rootDir = getConfigDirname(), graph = {} }: DependsOnOptions = {},
) {
  // default option.tsConfig if exists
  if (fs.existsSync(path.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = tsConfig || path.join(rootDir, 'tsconfig.json')
  }
  const absoluteGraph: Record<string, string[]> = {}
  for (let file in graph) {
    if (Object.prototype.hasOwnProperty.call(graph, file)) {
      const deps = graph[file]
      if (!path.isAbsolute(file)) {
        file = path.join(rootDir, file)
      }
      absoluteGraph[file] = deps.map((dep) => {
        if (!path.isAbsolute(dep)) {
          return path.join(rootDir, dep)
        }
        return dep
      })
    }
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
      if (absoluteGraph[filename].includes(target)) {
        return true
      }
    }
    return false
  }
}

export const { version: packageVersion } = (() => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'package.json'), {
    encoding: 'utf8',
  })
  return JSON.parse(content) as { version: string }
})()

export const packageName = '@haetae/javascript'
