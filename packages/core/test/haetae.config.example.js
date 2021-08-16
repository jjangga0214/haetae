// const { config } = require('#config/index')

const config = (obj) => obj

module.exports = config({
  commands: {
    test: {
      // all filespaths should be absolute paths
      target: () => ['hello.ts'],
      env: (haetaeVersion) =>
        // ${Node Version}-${OS}-${haetaeVersion}
        `${process.version}-${process.platform}-${haetaeVersion}`,
      save: (previousRecord) => previousRecord, // default
    },
    lint: {
      target: () => [],
      save: (previousRecord) => previousRecord,
    },
  },
})
