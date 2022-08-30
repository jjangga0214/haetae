import { config, pathsToModuleNameMapper } from '@jjangga0214/jest-config'
// const path = require('path')
// import tsConfig from './tsconfig.json'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const tsConfig = require('./tsconfig.json')

export default {
  ...config,
  // Monorepo configuration
  // projects: ['<rootDir>/packages/*'], // ISSUE: https://github.com/facebook/jest/issues/12230
  // An array of directory names to be searched recursively up from the requiring module's location
  // moduleDirectories: [
  //   __dirname,
  //   path.join(__dirname, 'node_modules'),
  //   'node_modules',
  // ],
  // A preset that is used as a base for Jest's configuration
  // preset: 'ts-jest',
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/', 'test-project'],
  // A map from regular expressions to paths to transformers
  // transform: { '^.+\\.(t|j)sx?$': ['@swc/jest'] },
  // transform: { '^.+\\.tsx?$': ['esbuild-jest'] },
  // transform: { '^.+\\.tsx?$': ['ts-jest'] },
  moduleNameMapper: {
    ...config.moduleNameMapper,
    ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
      prefix: '<rootDir>/packages/',
    }),
  },
}
