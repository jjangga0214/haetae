import fs from 'fs'
import upath from 'upath'
import dependencyTree from 'dependency-tree'
import { dirname } from 'dirname-filename-esm'
import { getConfigDirname } from '@haetae/core'
import { parsePkg, toAbsolutePath } from '@haetae/common'
import { DepsGraph, graph, dependsOn as graphDependsOn } from '@haetae/utils'

export * from './version.js'

export const pkg = parsePkg({
  name: '@haetae/javascript',
  rootDir: dirname(import.meta),
})

export interface DependsOnOptions {
  dependent: string
  dependencies: readonly string[] | Set<string>
  tsConfig?: string
  rootDir?: string
  additionalGraph?: DepsGraph
}

export function dependsOn({
  dependent,
  dependencies,
  tsConfig,
  rootDir = getConfigDirname(),
  additionalGraph = graph({ edges: [], rootDir }),
}: DependsOnOptions): boolean {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname() })
  if (tsConfig) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = toAbsolutePath({ path: tsConfig, rootDir })
  } else if (fs.existsSync(upath.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = upath.join(rootDir, 'tsconfig.json')
  }

  // eslint-disable-next-line no-param-reassign
  dependencies = [...dependencies].map((d) =>
    toAbsolutePath({ path: d, rootDir }),
  )

  // eslint-disable-next-line no-param-reassign
  dependent = toAbsolutePath({ path: dependent, rootDir })

  for (const dependency of dependencies) {
    if (dependent === dependency) {
      return true
    }
  }

  if (
    graphDependsOn({
      dependent,
      dependencies,
      graph: additionalGraph,
      rootDir,
    })
  ) {
    return true
  }

  // This includes target file (dependent) itself as well.
  const deepDepsList = dependencyTree.toList({
    directory: rootDir,
    filename: dependent,
    tsConfig,
  })

  for (const dependency of dependencies) {
    if (deepDepsList.includes(dependency)) {
      return true
    }
  }
  return false
}
