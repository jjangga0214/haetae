const { config, pathsToModuleNameMapper } = require('@jjangga0214/jest-config')
const tsConfig = require('./tsconfig')

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  ...config,

  // Monorepo configuration
  projects: ['<rootDir>/packages/*'],
  // Use this configuration option to add custom reporters to Jest
  reporters: ['default', 'github-actions'],
  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['.', 'node_modules', 'src'],
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'ts'],
  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',
  // The test environment that will be used for testing
  testEnvironment: 'node',
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/', 'test-project'],
  // A map from regular expressions to paths to transformers
  // transform: { '^.+\\.(t|j)sx?$': ['@swc/jest'] },
  // transform: { '^.+\\.tsx?$': ['esbuild-jest'] },
  transform: { '^.+\\.tsx?$': ['ts-jest'] },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
      prefix: '<rootDir>/packages/',
    }),
  },
}
