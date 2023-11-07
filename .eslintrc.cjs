module.exports = {
  extends: '@jjangga0214/eslint-config',
  settings: {
    react: {
      version: '18',
    },
  },
  ignorePatterns: [
    'dist',
    'test-project',
    'coverage',
    '.changeset',
    'CHANGELOG.md',
  ],
}
