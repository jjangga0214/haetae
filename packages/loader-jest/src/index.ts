import { loadByGlob } from '@haetae/loader-glob'
import path from 'path'

interface LoadJestTestMatchOptions {
  configPath: string
}
/**
 * Reads "testMatch" field from jest.config.js
 * It falls back to jest's default testMatch if it's not found in jest.config.js
 */
export async function loadJestTestMatch({
  configPath,
}: LoadJestTestMatchOptions) {
  if (!configPath.endsWith('.js')) {
    throw new Error(
      'jest configuration file\'s extension should be ".js". (e.g. jest.config.js)',
    )
  }
  // eslint-disable-next-line import/no-dynamic-require,global-require,@typescript-eslint/no-var-requires
  const jestConfig = require(configPath)
  const jestConfigDirname = path.dirname(configPath)
  const jestTestMatch: string[] = jestConfig.testMatch || [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ]
  return loadByGlob({
    // <rootDir> would be replaced by jestConfigDirname by loadByGlob
    patterns: jestTestMatch.map((pattern) => pattern.replace('<rootDir>/', '')),
    rootDir: jestConfigDirname,
  })
}
