import { glob } from '@haetae/utils'
import { getConfigDirnameFromEnvVar } from '@haetae/core'

import path from 'path'

export interface JestGlobOptions {
  onTestMatchNotFound: () => void
  onTestPathIgnorePatternsNotFound: () => void
}
/**
 * Reads "testMatch" field from jest.config.js
 * It falls back to jest's default testMatch if it's not found in jest.config.js
 */
export async function jestTests(
  configFile: string,
  {
    onTestMatchNotFound = () => undefined,
    onTestPathIgnorePatternsNotFound = () => undefined,
  }: JestGlobOptions,
) {
  if (!configFile) {
    const defaultConfigFilenames = [
      path.join(getConfigDirnameFromEnvVar(), 'jest.config.js'),
      path.join(getConfigDirnameFromEnvVar(), 'jest.config.ts'),
      path.join(getConfigDirnameFromEnvVar(), 'jest.config.cjs'),
      path.join(getConfigDirnameFromEnvVar(), 'jest.config.mjs'),
      path.join(getConfigDirnameFromEnvVar(), 'jest.config.json'),
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
  // eslint-disable-next-line import/no-dynamic-require,global-require,@typescript-eslint/no-var-requires
  const jestConfig = require(configFile)
  const jestgetConfigDirnameFromEnvVar = path.dirname(configFile)
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
    // Why split by '/' ?. Because jest.config.js should be written by '/' delimiter even on Windows/
    .map((pattern) =>
      path.join(jestgetConfigDirnameFromEnvVar, ...pattern.split('/')),
    )
    .concat(
      jestTestPathIgnorePatterns
        .map((pattern) => pattern.replace('<rootDir>/', ''))
        .map((pattern) =>
          path.join(jestgetConfigDirnameFromEnvVar, ...pattern.split('/')),
        )
        .map((pattern) => `!${pattern}`),
    )

  return glob(patterns, {
    rootDir: '',
  })
}
