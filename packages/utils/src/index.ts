import upath from 'upath'
import globby from 'globby'
import childProcess from 'child_process'
import { getConfigDirname } from '@haetae/core'
import hasha from 'hasha'

export { default as pkg } from './pkg'

export interface GlobOptions {
  rootDir?: string
  globbyOptions?: globby.GlobbyOptions
}

export async function glob(
  patterns: readonly string[],
  { rootDir = getConfigDirname(), globbyOptions = {} }: GlobOptions = {},
): Promise<string[]> {
  // eslint-disable-next-line no-param-reassign
  globbyOptions.cwd = globbyOptions.cwd || rootDir
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-param-reassign
  globbyOptions.gitignore =
    globbyOptions.gitignore === undefined ? true : globbyOptions.gitignore
  const res = await globby(patterns, globbyOptions)
  return res
    .map((file) => (upath.isAbsolute(file) ? file : upath.join(rootDir, file)))
    .map((file) => upath.normalize(file))
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
/**
 * The order of files affects to the final hash.
 * For example, `hashFile(['foo.ts', 'bar.ts'])` !== `hashFile(['bar.ts', 'foo.ts'])`
 */
export async function hash(
  files: readonly string[],
  { algorithm = 'sha256', rootDir = getConfigDirname() }: HashOptions = {},
): Promise<string> {
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
  const depsGraph: DepsGraph = {}
  const toAbsolute = (file: string) =>
    upath.isAbsolute(file) ? file : upath.join(rootDir, file)

  for (let { dependents, dependencies } of edges) {
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
