module.exports = {
  extends: '@jjangga0214/eslint-config',
  rules: {
    'unicorn/no-await-expression-member': 'off',
  },
  settings: {
    react: {
      version: '18',
    },
  },
  ignorePatterns: [
    '**/tmp.*',
    'dist',
    'test-project',
    'coverage',
    '.changeset',
    'CHANGELOG.md',
  ],
}
