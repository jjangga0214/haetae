// const { config } = require('../dist/index')
const path = require('path')

const config = (obj) => obj

module.exports = config({
  commands: {
    test: {
      // all filespaths should be absolute paths
      target: ({ prevRecord }) => ['hello.ts', 'there.ts'],
      env: ({ coreVersion }) => ({
        nodeVersion: process.version,
        os: process.platform,
        coreVersion,
      }),
      save: ({ prevRecord }) => ({
        hello: 'there',
      }),
    },
    lint: {
      target: ({ prevRecord }) => [],
      save: ({ prevRecord }) => prevRecord,
    },
  },
  storeFile: path.join(__dirname, 'haetae.store.example.json'),
})

// module.exports = {
//   commands: {
//     test: {
//       // all filespaths should be absolute paths
//       target: (previousRecord) =>
//         loadByGlob(['*.ts']).filter(dependsOn(loadGitChanged())), // can be string[], or string
//       env: (haetaeVersion) =>
//         // ${Node Version}-${OS}-${Custom Env Var}
//         `${process.version}-${process.platform}-${process.env.FOO}`,
//       save: (previousRecord) => recordByGit(previousRecord), // default
//     },
//     lint: {
//       run: () => glob(['*.ts']).filter(is(gitChanged())),
//       finally: (previousRecord) => recordByGit(previousRecord),
//     },
//   },
// }
