import fs from 'fs'
import assert from 'assert/strict'
import upath from 'upath'
import dependencyTree from 'dependency-tree'
import readPkgUp from 'read-pkg-up'
import findUp from 'find-up'
import yaml from 'yaml'
import { getConfigDirname } from '@haetae/core'
import { major, minor, patch, prerelease } from 'semver'

export { default as pkg } from './pkg'

export interface Edge {
  dependents: readonly string[]
  dependencies: readonly string[]
}

export interface GraphOptions {
  rootDir?: string
  edges: readonly Edge[]
}

export interface Graph {
  [dependent: string]: Set<string> // dependencies[]
}

// TODO: test
export function graph({
  rootDir = getConfigDirname(),
  edges,
}: GraphOptions): Graph {
  const depsGraph: Graph = {}
  const toAbsolute = (file: string) =>
    upath.isAbsolute(file) ? file : upath.join(rootDir, file)

  for (let { dependencies, dependents } of edges) {
    dependents = dependents
      .map((dependent) => toAbsolute(dependent))
      .map((dependent) => upath.normalize(dependent))
    dependencies = dependencies
      .map((dependency) => toAbsolute(dependency))
      .map((dependency) => upath.normalize(dependency))
    for (const dependent of dependents) {
      depsGraph[dependent] = depsGraph[dependent] || new Set<string>()
      for (const dependency of dependencies) {
        depsGraph[dependent].add(dependency)
      }
    }
  }
  return depsGraph
}

export interface DependsOnOptions {
  tsConfig?: string
  rootDir?: string
  // TODO: more options
  edges?: readonly Edge[] // you can manually specify additional dependency graph
}

// TODO: test
/**
 * @param edges // You can specify any dependency graph regardless of extension
 * [ // When foo depends on bar and baz.
 *   { 'dependents': ['path/to/foo.ts'], dependencies: ['path/to/bar.ts', 'path/to/baz.ts'],
 * ]
 */
export function dependsOn(
  filenames: readonly string[],
  { tsConfig, rootDir = getConfigDirname(), edges = [] }: DependsOnOptions = {},
) {
  // default option.tsConfig if exists
  if (fs.existsSync(upath.join(rootDir, 'tsconfig.json'))) {
    // eslint-disable-next-line no-param-reassign
    tsConfig = tsConfig || upath.join(rootDir, 'tsconfig.json')
  }
  const depsGraph = graph({
    rootDir,
    edges,
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
      if (depsGraph[target]?.has(filename)) {
        return true
      }
      if (target === filename) {
        return true
      }
    }
    return false
  }
}

export interface VersionOptions {
  rootDir?: string
}
export async function version(
  packageName: string,
  { rootDir = getConfigDirname() }: VersionOptions = {},
) {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const toVersionInfo = (version: string) => ({
    value: version,
    major: major(version),
    miner: minor(version),
    patch: patch(version),
    prerelease: prerelease(version),
  })
  try {
    const {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore // `readPkgUp`'s typing and implementation are mismatched. // ISSUE: https://github.com/sindresorhus/read-pkg-up/issues/21
      packageJson: { name, version },
    } = await readPkgUp({
      cwd: upath.dirname(require.resolve(packageName)),
    })
    assert(name, packageName)
    return toVersionInfo(version)
  } catch {
    try {
      /**
       * For yarn berry, it throws an error (by assertion of package name or 'not found' of package.json).
       * With yarn berry, we cannot access to the package.json of the other packages.
       * Note that access to package.json of the package itself is allowed even with yarn berry.
       * For example, source code of `foo` can read package.json of `foo` with yarn berry.
       * But, source code of `foo` can NOT read package.json of `bar` with yarn berry.
       * For npm, yarn classic, or pnpm, there is no such restriction.
       * So, yarn.lock can be fallback.
       * yarn v1(classic), v2(berry) and v3(berry) are all compaitible for parsing dependency version.
       */
      const yarnLockfilePath = await findUp('yarn.lock', { cwd: rootDir })
      assert(!!yarnLockfilePath)
      const yarnLockfile = fs.readFileSync(yarnLockfilePath, {
        encoding: 'utf8',
      })
      const depsLockJson = yaml.parse(yarnLockfile)
      for (const key in depsLockJson) {
        if (
          Object.prototype.hasOwnProperty.call(depsLockJson, key) &&
          key.startsWith(`${packageName}@`)
        ) {
          const { version } = depsLockJson[key]
          return toVersionInfo(version)
        }
      }
      throw new Error(' ')
    } catch {
      throw new Error(`Version for package ${packageName} cannot be resolved.`)
    }
  }
}
