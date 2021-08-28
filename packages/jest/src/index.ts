import { glob } from '@haetae/utils'
import { getConfigDirname } from '@haetae/core'

import path from 'path'

export interface TestFilesOptions {
  onTestMatchNotFound?: () => void
  onTestPathIgnorePatternsNotFound?: () => void
}
/**
 * Reads "testMatch" field from jest.config.js
 * It falls back to jest's default testMatch if it's not found in jest.config.js
 */
export async function testFiles(
  configFile?: string, // jest config file. e.g. jest.config.js
  {
    onTestMatchNotFound = () => undefined,
    onTestPathIgnorePatternsNotFound = () => undefined,
  }: TestFilesOptions = {},
) {
  if (!configFile) {
    const defaultConfigFilenames = [
      path.join(getConfigDirname(), 'jest.config.js'),
      path.join(getConfigDirname(), 'jest.config.ts'),
      path.join(getConfigDirname(), 'jest.config.cjs'),
      path.join(getConfigDirname(), 'jest.config.mjs'),
      path.join(getConfigDirname(), 'jest.config.json'),
    ]
    // todo: iterate various kinds of config files
    // eslint-disable-next-line prefer-destructuring, no-param-reassign
    configFile = defaultConfigFilenames[0]
  }

  if (!configFile.endsWith('.js')) {
    throw new Error(
      'jest configuration file\'s extension should be ".js". (e.g. jest.config.js)',
    )
  }
  const jestConfig = await import(configFile)
  delete jestConfig.default
  const jestConfigDirname = path.dirname(configFile)
  if (!jestConfig.testMatch) {
    onTestMatchNotFound()
  }
  const jestTestMatch: string[] = jestConfig.testMatch || [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ]

  if (!jestConfig.testPathIgnorePatterns) {
    onTestPathIgnorePatternsNotFound()
  }

  const jestTestPathIgnorePatterns: string[] =
    jestConfig.testPathIgnorePatterns || [['/node_modules/']]

  const patterns = jestTestMatch
    .map((pattern) => pattern.replace('<rootDir>/', ''))
    // Why split by '/' ?. Because field values for paths in jest.config.js are written with '/' delimiter even on Windows
    .map((pattern) => path.join(jestConfigDirname, ...pattern.split('/')))
    .concat(
      jestTestPathIgnorePatterns
        .map((pattern) => pattern.replace('<rootDir>/', ''))
        .map((pattern) => path.join(jestConfigDirname, ...pattern.split('/')))
        .map((pattern) => `!${pattern}`),
    )

  return glob(patterns, {
    rootDir: jestConfigDirname,
  })
}
