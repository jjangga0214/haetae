import globby from 'globby'
import path from 'path'
import { getConfigDirname } from '@haetae/core'

export interface globOptions {
  rootDir?: string // This is a facade option for globbyOptions.cwd
  preConfiguredPatterns?: readonly string[]
  globbyOptions?: globby.GlobbyOptions
}

export async function glob(
  patterns: readonly string[],
  {
    rootDir = getConfigDirname(),
    preConfiguredPatterns = [
      `!${path.join('**', 'node_modules')}`,
      `!${path.join('**', 'jspm_packages')}`,
      `!${path.join('**', 'web_modules')}`, // Snowpack dependency directory (https://snowpack.dev/)
    ],
    globbyOptions = {
      cwd: rootDir,
      gitignore: true,
    },
  }: globOptions = {},
): Promise<string[]> {
  const globbyRes = await globby(
    [...(preConfiguredPatterns as readonly string[]), ...patterns],
    globbyOptions,
  )
  return globbyRes.map((p) => path.join(rootDir, p))
}
