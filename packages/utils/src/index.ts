import fs from 'fs'
import path from 'path'
import globby from 'globby'
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
      reject(error || stderr)
    })
  })
}

export const { version: packageVersion } = (() => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'package.json'), {
    encoding: 'utf8',
  })
  return JSON.parse(content) as { version: string }
})()

export const packageName = '@haetae/utils'
