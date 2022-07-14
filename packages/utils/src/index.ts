import globby from 'globby'
import path from 'path'
import childProcess from 'child_process'
import { getConfigDirname } from '@haetae/core'

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
  return res.map((p) => path.join(rootDir, p))
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
}

export async function exec(
  command: string,
  options: ExecOptions = {},
): Promise<string> {
  // eslint-disable-next-line no-param-reassign
  options.cwd = options.cwd || getConfigDirname()
  return new Promise((resolve, reject) => {
    childProcess.exec(command, options, (error, stdout, stderr) => {
      if (stdout) {
        resolve(stdout)
      }
      reject(error || stderr)
    })
  })
}
