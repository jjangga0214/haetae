import { loadByGlob } from '@haetae/loader-glob'
import path from 'path'

interface LoadByJestGlobOptions {
  onTestMatchNotFound: () => void
  onTestPathIgnorePatternsNotFound: () => void
}
/**
 * Reads "testMatch" field from jest.config.js
 * It falls back to jest's default testMatch if it's not found in jest.config.js
 */
export async function loadByJestGlob(
  configPath: string,
  {
    onTestMatchNotFound = () => undefined,
    onTestPathIgnorePatternsNotFound = () => undefined,
  }: LoadByJestGlobOptions,
) {
  if (!configPath.endsWith('.js')) {
    throw new Error(
      'jest configuration file\'s extension should be ".js". (e.g. jest.config.js)',
    )
  }
  // eslint-disable-next-line import/no-dynamic-require,global-require,@typescript-eslint/no-var-requires
  const jestConfig = require(configPath)
  const jestConfigDirname = path.dirname(configPath)
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
    .map((pattern) => path.join(jestConfigDirname, ...pattern.split('/')))
    .concat(
      jestTestPathIgnorePatterns
        .map((pattern) => pattern.replace('<rootDir>/', ''))
        .map((pattern) => path.join(jestConfigDirname, ...pattern.split('/')))
        .map((pattern) => `!${pattern}`),
    )

  return loadByGlob(patterns, {
    rootDir: '',
  })
}
