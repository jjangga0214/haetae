// const { config } = require('../dist/index')
const path = require('path')

const config = (obj) => obj

module.exports = config({
  commands: {
    test: {
      // all filespaths should be absolute paths
      target: () => ['hello.ts', 'there.ts'],
      env: (haetaeVersion) =>
        // ${Node Version}-${OS}-${haetaeVersion}
        `${process.version}-${process.platform}-${haetaeVersion}`,
      save: (previousRecord) => ({
        hello: 'there',
      }),
    },
    lint: {
      target: () => [],
      save: (previousRecord) => previousRecord,
    },
  },
  storeFile: path.join(__dirname, 'haetae.store.example.json'),
})
