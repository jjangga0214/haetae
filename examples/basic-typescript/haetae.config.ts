/* eslint-disable import/no-extraneous-dependencies */
import { $, configure, utils, git, js, pkg, core } from 'haetae'
import url from 'node:url'
import semver from 'semver'

export default configure({
  env: async (env, { store }) => ({
    ...env,
    hihi: store.hi(),
    haetaeConfig: await utils.hash(
      await js.deps({ entrypoint: url.fileURLToPath(import.meta.url) }),
      // await js.deps({ entrypoint: 'haetae.config.ts' }),
    ),
  }),
  recordData: async (data, { store }) => ({
    hihi: store.hi(),
    ...data,
  }),
  commands: {
    myTest: {
      env: async ({ store }) => ({
        hi: store.hi(),
        jest: await js.majorVersion('jest'),
        jestSharableConfig: await js.majorVersion('@jjangga0214/jest-config'),
        jestConfig: await utils.hash(['../../jest.config.js']),
        node: semver.major(process.version),
        haetae: pkg.version.major,
        typescript: await js.untilMinorVersion('typescript'),
        tsConfig: await utils.hash(['tsconfig.json', '../../tsconfig.json']),
        t: 5,
      }),
      run: async ({ store }) => {
        console.log(store.hi())
        const changedFiles = await git.changedFiles({
          rootDir: '../../',
        })
        console.log('changedFiles:', changedFiles)
        const previousRecord = await store.getRecord()
        console.log('previousRecord:', previousRecord)
        const changedHashFiles = await utils.changedFiles(['.env'], {})
        console.log('changedHashFiles:', changedHashFiles)
        changedFiles.push(...changedHashFiles)
        const testFiles = await utils.glob(['test/**/*.test.ts'])
        const additionalGraph = await utils.graph({
          edges: [
            {
              dependents: ['src/index.ts'],
              dependencies: ['.env'],
            },
          ],
        })
        console.log('testFiles:', testFiles)
        const affectedTestFiles = await js.dependOn({
          dependents: testFiles,
          dependencies: changedFiles,
          additionalGraph,
          tsConfig: 'tsconfig.json',
        })
        console.log('affectedTestFiles:', affectedTestFiles)

        if (affectedTestFiles.length > 0) {
          const stdout = await $`pnpm test:haetae ${affectedTestFiles}`
          console.log(stdout)
        }
      },
    },
    myGreeting: {
      run: () => ({ hello: 'world' }),
    },
  },
  store: {
    ...core.localFileStore(),
    hi: () => 'hi',
  },
})
