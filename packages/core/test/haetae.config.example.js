const path = require('path')
// eslint-disable-next-line import/no-extraneous-dependencies
const { configure } = require('@haetae/core')

module.exports = configure({
  commands: {
    test: {
      target: () => ['hello.ts', 'there.ts'],
      env: () => ({
        coreVersion: '0.0.1',
        os: 'linux',
      }),
      save: () => ({
        '@haetae/git': {
          gitSha: '77c033b',
        },
      }),
      hello: () => ({
        hello: 'haetae',
        hi: 'there',
      }),
    },
    lint: {
      target: () => [],
      save: () => ({
        '@haetae/git': {
          gitSha: '080bdea',
        },
      }),
    },
  },
  storeFile: path.join(__dirname, 'haetae.store.example.json'),
})
