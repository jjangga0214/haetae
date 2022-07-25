import upath from 'upath'
import globby from 'globby'
import childProcess from 'child_process'
import { getConfigDirname } from '@haetae/core'
import hasha from 'hasha'

export { default as pkg } from './pkg'

export interface GlobOptions {
  rootDir?: string // This is a facade option for globbyOptions.cwd
  globbyOptions?: globby.GlobbyOptions
}

export async function glob(
  patterns: readonly string[],
  {
    rootDir = getConfigDirname(),
    globbyOptions = {
      cwd: rootDir,
      gitignore: true,
    },
  }: GlobOptions = {},
): Promise<string[]> {
  const res = await globby(patterns, globbyOptions)
  return res.map((file) =>
    upath.isAbsolute(file) ? file : upath.resolve(rootDir, file),
  )
}

export interface ExecOptions {
  uid?: number | undefined
  gid?: number | undefined
  cwd?: string | URL | undefined
  env?: NodeJS.ProcessEnv | undefined
  /**
   * @default true
   */
  windowsHide?: boolean | undefined
  /**
   * @default 0
   */
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

export interface HashFilesOptions {
  algorithm?: hasha.AlgorithmName
  rootDir?: string
}

// TODO: glob patterns and directories
/**
 * The order of files affects to the final hash.
 * For example, `hashFile(['foo.ts', 'bar.ts'])` !== `hashFile(['bar.ts', 'foo.ts'])`
 */
export async function hashFiles(
  files: string[],
  { algorithm = 'sha256', rootDir = getConfigDirname() }: HashFilesOptions = {},
): Promise<string> {
  const hashes = await Promise.all(
    files
      .map((file) =>
        upath.isAbsolute(file) ? file : upath.resolve(rootDir, file),
      )
      .map((file) => hasha.fromFile(file, { algorithm })),
  )
  return hasha.async(hashes.join('\n'), { algorithm })
}
