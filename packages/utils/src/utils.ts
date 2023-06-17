import { PromiseOr, toAbsolutePath } from '@haetae/common'
import * as core from '@haetae/core'
import { globby, Options as GlobbyOptions } from 'globby'
import hasha from 'hasha'
import childProcess from 'node:child_process'
import upath from 'upath'

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
        (p.match(/^\.{2}\//g) || []).length + // starts with '../'
        (p.match(/\/\.{2}\//g) || []).length // '/../'
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
