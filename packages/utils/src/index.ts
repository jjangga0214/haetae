import upath from 'upath'
import globby from 'globby'
import childProcess from 'child_process'
import { getConfigDirname } from '@haetae/core'
import hasha from 'hasha'
import { parsePkg, toAbsolutePath } from '@haetae/common'

export const pkg = parsePkg({ name: '@haetae/utils', rootDir: __dirname })

export interface GlobOptions {
  rootDir?: string
  globbyOptions?: globby.GlobbyOptions
}

export async function glob(
  patterns: readonly string[],
  { rootDir = getConfigDirname(), globbyOptions = {} }: GlobOptions = {},
): Promise<string[]> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname() })
  // eslint-disable-next-line no-param-reassign
  globbyOptions.cwd = globbyOptions.cwd || rootDir
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-param-reassign
  globbyOptions.gitignore =
    globbyOptions.gitignore === undefined ? true : globbyOptions.gitignore
  const res = await globby(patterns, globbyOptions)
  return res.map((f) => toAbsolutePath({ path: f, rootDir }))
}

export interface ExecOptions {
  uid?: number | undefined
  gid?: number | undefined
  cwd?: string | URL | undefined
  env?: NodeJS.ProcessEnv | undefined
  windowsHide?: boolean | undefined
  timeout?: number | undefined
  shell?: string | undefined
  maxBuffer?: number | undefined
  killSignal?: NodeJS.Signals | number | undefined
  /**
   * Customized options (not for childProcess.exec)
   */
  trim?: boolean
}

export async function exec(
  command: string,
  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  options: ExecOptions = { trim: true },
): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  options.cwd = options.cwd || getConfigDirname()
  return new Promise((resolve, reject) => {
    childProcess.exec(command, options, (error, stdout, stderr) => {
      if (stdout) {
        resolve(options.trim ? stdout.trim() : stdout)
      }
      reject(error || options.trim ? stderr.trim() : stderr)
    })
  })
}

export interface HashOptions {
  algorithm?: hasha.AlgorithmName // "md5" | "sha1" | "sha256" | "sha512"
  rootDir?: string
}

// TODO: glob patterns and directories
export async function hash(
  files: readonly string[],
  { algorithm = 'sha256', rootDir = getConfigDirname() }: HashOptions = {},
): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname() })
  const hashes = await Promise.all(
    [...files] // Why copy by destructing the array? => To avoid modifying the original array when `sort()`.
      .sort()
      .map((file) =>
        upath.isAbsolute(file) ? file : upath.join(rootDir, file),
      )
      .map((file) => upath.normalize(file))
      .map((file) => hasha.fromFile(file, { algorithm })),
  )
  return hasha.async(hashes.join('\n'), { algorithm })
}

export interface DepsEdge {
  dependents: readonly string[]
  dependencies: readonly string[]
}

export interface GraphOptions {
  edges: readonly DepsEdge[]
  rootDir?: string
}

export interface DepsGraph {
  [dependent: string]: Set<string> // dependencies[]
}

export function graph({
  rootDir = getConfigDirname(),
  edges,
}: GraphOptions): DepsGraph {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname() })
  const depsGraph: DepsGraph = {}

  for (let { dependents, dependencies } of edges) {
    dependents = dependents.map((dependent) =>
      toAbsolutePath({ path: dependent, rootDir }),
    )
    dependencies = dependencies.map((dependency) =>
      toAbsolutePath({ path: dependency, rootDir }),
    )

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
  dependent: string
  dependencies: readonly string[] | Set<string>
  graph: DepsGraph
  rootDir?: string
}

export function dependsOn({
  dependent,
  dependencies,
  graph,
  rootDir = getConfigDirname(),
}: DependsOnOptions): boolean {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: getConfigDirname() })
  // eslint-disable-next-line no-param-reassign
  dependent = toAbsolutePath({ path: dependent, rootDir })
  // eslint-disable-next-line no-param-reassign
  dependencies = [...dependencies].map((d) =>
    toAbsolutePath({
      path: d,
      rootDir,
    }),
  )

  if (!graph[dependent]) {
    return false
  }
  const queue = [...graph[dependent]]
  for (const dependency of queue) {
    if (dependencies.includes(dependency)) {
      return true
    }
    if (graph[dependency]) {
      queue.push(...graph[dependency])
    }
  }
  return false
}
