import childProcess from 'node:child_process'
import fs from 'node:fs/promises'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import filterAsync from 'node-filter-async'
import upath from 'upath'
import { globby, Options as GlobbyOptions } from 'globby'
import hasha from 'hasha'
import { dirname } from 'dirname-filename-esm'
import * as core from '@haetae/core'
import { parsePkg, PromiseOr, Rec, toAbsolutePath } from '@haetae/common'

const pkgName = '@haetae/utils'

export const pkg = parsePkg({
  name: pkgName,
  rootDir: dirname(import.meta),
})

export interface RecordData extends Rec {
  [pkgName]: {
    files?: Record<string, string>
    pkgVersion: string
  }
}

export interface RecordDataOptions {
  files?: Record<string, string>
  pkgVersion?: string
}

// It's async for future compatibility
export async function recordData({
  files,
  pkgVersion = pkg.version.value,
}: RecordDataOptions = {}): Promise<RecordData> {
  return {
    [pkgName]: {
      files,
      pkgVersion,
    },
  }
}

export interface GlobOptions {
  rootDir?: string // A facade option for `globbyOptions.cwd`
  globbyOptions?: GlobbyOptions
}

export async function glob(
  patterns: readonly string[],
  { rootDir = core.getConfigDirname(), globbyOptions = {} }: GlobOptions = {},
): Promise<string[]> {
  /* eslint-disable no-param-reassign, @typescript-eslint/ban-ts-comment */
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  // @ts-ignore
  globbyOptions.cwd = globbyOptions.cwd || rootDir
  // @ts-ignore
  globbyOptions.gitignore =
    globbyOptions.gitignore === undefined ? true : globbyOptions.gitignore
  /* eslint-enable no-param-reassign, @typescript-eslint/ban-ts-comment */
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
  options?: ExecOptions,
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _options = {
    trim: true,
    cwd: options?.cwd || core.getConfigDirname(), // Why using `||` ? That's to avoid calling `core.getConfigDirname()` if possible.
    ...options,
  }

  return new Promise((resolve, reject) => {
    childProcess.exec(command, options, (error, stdout, stderr) => {
      if (stdout) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        resolve(_options.trim ? stdout.trim() : stdout)
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      reject(error || _options.trim ? stderr.trim() : stderr)
    })
  })
}

export interface $Exec extends ExecOptions {
  (
    statics: TemplateStringsArray,
    ...dynamics: readonly PromiseOr<
      string | number | PromiseOr<string | number>[]
    >[]
  ): Promise<string>
}

export const $: $Exec = async (statics, ...dynamics): Promise<string> => {
  const result: string[] = []
  const awaitedDynamics = await Promise.all(
    dynamics.map(async (el) => {
      const element = await el
      if (Array.isArray(element)) {
        return (await Promise.all(element)).join(' ')
      }
      return element
    }),
  )

  result.push(statics[0])
  for (const [index, element] of awaitedDynamics.entries()) {
    result.push(`${element}`, statics[index + 1])
  }

  const shellCommand = result.join('')

  return exec(shellCommand, {
    // Why not just passing $ itself? Because it causes an error.
    trim: $?.trim !== false,
    uid: $?.uid,
    gid: $?.gid,
    cwd: $?.cwd,
    env: $?.env,
    windowsHide: $?.windowsHide,
    timeout: $?.timeout,
    shell: $?.shell,
    maxBuffer: $?.maxBuffer,
    killSignal: $?.killSignal,
  })
}

export interface HashOptions {
  algorithm?: hasha.AlgorithmName // "md5" | "sha1" | "sha256" | "sha512"
  rootDir?: string
}

// TODO: glob patterns and directories
export async function hash(
  files: readonly string[],
  { algorithm = 'sha256', rootDir = core.getConfigDirname() }: HashOptions = {},
): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  const hashes = await Promise.all(
    [...files] // Why copy by destructing the array? => To avoid modifying the original array when `sort()`.
      .sort()
      .map((file) => upath.resolve(rootDir, file))
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
  edges,
  rootDir = core.getConfigDirname(),
}: GraphOptions): DepsGraph {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  const depsGraph: DepsGraph = {}

  for (let { dependents, dependencies } of edges) {
    dependents = dependents.map((dep) => upath.resolve(rootDir, dep))
    dependencies = dependencies.map((dep) => upath.resolve(rootDir, dep))

    for (const dependent of dependents) {
      depsGraph[dependent] = depsGraph[dependent] || new Set<string>()
      for (const dependency of dependencies) {
        depsGraph[dependency] = depsGraph[dependency] || new Set<string>()
        if (dependent !== dependency) {
          depsGraph[dependent].add(dependency)
        }
      }
    }
  }
  return depsGraph
}

export function mergeGraphs(graphs: DepsGraph[]): DepsGraph {
  const result: DepsGraph = {}
  for (const graph of graphs) {
    for (const [dependent, directDeps] of Object.entries(graph)) {
      result[dependent] = result[dependent] || new Set()
      for (const dep of directDeps) {
        result[dependent].add(dep)
      }
    }
  }
  return result
}

export interface DependsOnOptions {
  dependent: string
  dependencies: readonly string[]
  graph: DepsGraph
  rootDir?: string
}

export function dependsOn({
  dependent,
  dependencies,
  graph,
  rootDir = core.getConfigDirname(),
}: DependsOnOptions): boolean {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  // eslint-disable-next-line no-param-reassign
  dependent = upath.resolve(rootDir, dependent)
  // eslint-disable-next-line no-param-reassign
  dependencies = [...dependencies].map((dep) => upath.resolve(rootDir, dep))

  if (!graph[dependent]) {
    return false
  }

  // Consider any file depends on itself.
  // This is beneficial for using with changedFiles() for testing (e.g. git.changedFiles() or utils.changedFiles())
  if (dependencies.includes(dependent)) {
    return true
  }
  const checkedDeps = new Set<string>() // To avoid infinite loop by circular dependencies.
  // `transitiveDepsQueue` stores dependencies of dependencies.. and so on.
  // Until either the function finds the matching dependency or the loop ends.
  const transitiveDepsQueue = [...graph[dependent]]
  for (const dependency of transitiveDepsQueue) {
    if (!checkedDeps.has(dependency)) {
      checkedDeps.add(dependency)
      transitiveDepsQueue.push(...(graph[dependency] || []))
      if (dependencies.includes(dependency)) {
        return true
      }
    }
  }
  return false
}

export interface ChangedFilesOptions {
  rootDir?: string
  hash?: (filename: string) => PromiseOr<string>
  filterByExistence?: boolean
  reserveRecordData?: boolean
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _hash = hash

export const changedFiles = memoizee(
  async (
    files: readonly string[],
    {
      rootDir = core.getConfigDirname(),
      hash = (filename) => _hash([filename], { rootDir }),
      filterByExistence = false,
      reserveRecordData = true,
    }: ChangedFilesOptions = {},
  ): Promise<string[]> => {
    // eslint-disable-next-line no-param-reassign
    rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
    // eslint-disable-next-line no-param-reassign
    files = files.map((file) => upath.relative(rootDir, file))
    const previousRecord = await core.getRecord<RecordData>()
    const previousFiles = previousRecord?.data[pkgName]?.files || {}
    const filesData: Record<string, string> = {}

    const result = await filterAsync(files, async (file) => {
      if (filterByExistence) {
        try {
          await fs.access(file)
        } catch {
          return false
        }
      }
      const hashed = await hash(file)
      filesData[file] = hashed
      return previousFiles[file] !== hashed
    })
    if (reserveRecordData) {
      core.reserveRecordData(await recordData({ files: filesData }))
    }
    return result.map((file) => upath.resolve(rootDir, file))
  },
  {
    normalizer: serialize,
  },
)
