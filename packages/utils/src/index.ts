import childProcess from 'node:child_process'
import fs from 'node:fs/promises'
import memoizee from 'memoizee'
import serialize from 'serialize-javascript'
import filterAsync from 'node-filter-async'
import upath from 'upath'
import { globby, Options as GlobbyOptions } from 'globby'
import multimatch from 'multimatch'
import hasha from 'hasha'
import { dirname } from 'dirname-filename-esm'
import isEqual from 'lodash.isequal'
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

export interface GlobOptions extends Omit<GlobbyOptions, 'cwd'> {
  rootDir?: string // A facade option for `globbyOptions.cwd`
}

export async function glob(
  patterns: readonly string[],
  options: GlobOptions = {},
): Promise<string[]> {
  const rootDir = toAbsolutePath({
    path: options.rootDir || '.',
    rootDir: core.getConfigDirname,
  })
  // Why `walkUpCountMax` is needed? REF: https://github.com/sindresorhus/globby/issues/168
  const walkUpCountMax = { value: 0 }
  // eslint-disable-next-line no-param-reassign
  patterns = patterns
    .map((p) => upath.normalizeSafe(p))
    .map((p) => {
      const walkUpCount =
        (p.match(/\.{2}\//g) || []).length - (p.match(/\.{3}\//g) || []).length
      if (walkUpCountMax.value < walkUpCount) {
        walkUpCountMax.value = walkUpCount
      }
      return upath.resolve(rootDir, p)
    })

  const res = await globby(patterns, {
    cwd: upath.resolve(rootDir, '../'.repeat(walkUpCountMax.value)),
    ...options,
  })
  return [...new Set(res.map((f) => upath.resolve(rootDir, f)))]
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _glob = glob

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
  glob?: boolean
}

// TODO: glob patterns and directories
export async function hash(
  files: readonly string[],
  {
    algorithm = 'sha256',
    rootDir = core.getConfigDirname(),
    glob = true,
  }: HashOptions = {},
): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  if (glob) {
    // eslint-disable-next-line no-param-reassign
    files = await _glob(files, { rootDir })
  }
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
  glob?: boolean
}

export interface DepsGraph {
  [dependent: string]: Set<string> // dependencies[]
}

export async function graph({
  edges,
  rootDir = core.getConfigDirname(),
  glob = true,
}: GraphOptions): Promise<DepsGraph> {
  // eslint-disable-next-line no-param-reassign
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  const depsGraph: DepsGraph = {}

  for (let { dependents, dependencies } of edges) {
    dependents = dependents.map((dep) => upath.resolve(rootDir, dep))
    dependencies = dependencies.map((dep) => upath.resolve(rootDir, dep))
    if (glob) {
      dependents = await _glob(dependents, {
        rootDir,
      })
      dependencies = await _glob(dependencies, {
        rootDir,
      })
    }

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
  glob?: boolean
}

export async function dependsOn({
  dependent,
  dependencies,
  graph,
  rootDir = core.getConfigDirname(),
  glob = true,
}: DependsOnOptions): Promise<boolean> {
  /* eslint-disable no-param-reassign */
  rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
  dependent = upath.resolve(rootDir, dependent)
  dependencies = [...dependencies].map((dep) => upath.resolve(rootDir, dep))
  /* eslint-enable no-param-reassign */

  if (!graph[dependent]) {
    return false
  }

  // Consider any file depends on itself.
  // This is beneficial for using with changedFiles() for testing (e.g. git.changedFiles() or utils.changedFiles())
  if (glob) {
    if (isEqual([dependent], multimatch([dependent], dependencies))) {
      return true
    }
  } else if (dependencies.includes(dependent)) {
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
      if (glob) {
        if (isEqual([dependency], multimatch([dependency], dependencies))) {
          return true
        }
      } else if (dependencies.includes(dependency)) {
        return true
      }
    }
  }
  return false
}

export interface DependOnOptions {
  dependents: readonly string[]
  dependencies: readonly string[]
  graph: DepsGraph
  rootDir?: string
  glob?: boolean
}

export async function dependOn({
  dependents,
  dependencies,
  graph,
  rootDir,
  glob,
}: DependOnOptions): Promise<string[]> {
  return filterAsync(dependents, (dependent) =>
    dependsOn({
      dependent,
      dependencies,
      graph,
      rootDir,
      glob,
    }),
  )
}

export interface ChangedFilesOptions {
  rootDir?: string
  renew?: readonly string[]
  hash?: (filename: string) => PromiseOr<string>
  filterByExistence?: boolean
  reserveRecordData?: boolean
  previousRecord?: core.HaetaeRecord<RecordData, Rec>
  glob?: boolean
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const _hash = hash

export const changedFiles = memoizee(
  async (
    files: readonly string[],
    {
      rootDir = core.getConfigDirname(),
      hash = (filename) => _hash([filename], { rootDir }),
      renew = files,
      filterByExistence = false,
      reserveRecordData = true,
      previousRecord,
      glob = true,
    }: ChangedFilesOptions = {},
  ): Promise<string[]> => {
    /* eslint-disable no-param-reassign */
    rootDir = toAbsolutePath({ path: rootDir, rootDir: core.getConfigDirname })
    files = files.map((file) => upath.relative(rootDir, file))
    renew = renew.map((file) => upath.relative(rootDir, file))
    if (glob) {
      files = await _glob(files, { rootDir })
      renew = await _glob(renew, { rootDir })
    }
    previousRecord = previousRecord || (await core.getRecord<RecordData>())
    /* eslint-enable no-param-reassign */
    const previousFiles = previousRecord?.data[pkgName]?.files || {}
    const filesData: Record<string, string> = {}

    const result = await filterAsync(files, async (file) => {
      if (filterByExistence) {
        try {
          await fs.access(file) // Check if the file exists.
        } catch {
          filesData[file] = previousFiles[file]
          return false
        }
      }
      const hashed = await hash(file)
      if (renew.includes(file)) {
        filesData[file] = hashed
      } else {
        filesData[file] = previousFiles[file]
      }
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
