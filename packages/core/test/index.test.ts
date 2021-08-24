import path from 'path'
import {
  getConfig,
  getStore,
  invokeEnv,
  invokeTarget,
  invokeSave,
  HaetaeConfig,
  HaetaeStore,
  mapStore,
  version,
} from '#core'

describe('index', () => {
  const configFilename = path.join(__dirname, 'haetae.config.example.js')
  const storeFilename = path.join(__dirname, 'haetae.store.example.json')
  const config: Promise<HaetaeConfig> = getConfig({
    filename: configFilename,
  })
  const store: Promise<HaetaeStore> = getStore({
    filename: storeFilename,
  })
  it('getConfig', async () => {
    expect.hasAssertions()

    const targetList = (await config).commands.test.target({})
    expect(targetList).toStrictEqual(['hello.ts', 'there.ts'])
  })

  it('getStore', async () => {
    expect.hasAssertions()

    expect((await store).version).toStrictEqual('0.0.1')
    expect((await store).commands.test[0].time).toStrictEqual(
      '2021-08-16T08:59:07.409Z',
    )
  })

  it('invokeEnv', async () => {
    expect.hasAssertions()

    const haetaeEnv = await invokeEnv({
      command: 'test',
      config,
    })

    expect(haetaeEnv).toStrictEqual({
      nodeVersion: process.version,
      os: process.platform,
      coreVersion: version,
    })
  })

  it('invokeTarget', async () => {
    expect.hasAssertions()

    const targetList = await invokeTarget({
      command: 'test',
      config,
      store,
    })

    expect(targetList).toStrictEqual(['hello.ts', 'there.ts'])
  })

  // issue: an jest(not our application) error appears
  /* eslint-disable jest/no-commented-out-tests */
  // it('invokeSave', async () => {
  //   expect.hasAssertions()
  //   const newPreRecord = await invokeSave({
  //     command: 'test',
  //     config,
  //     store,
  //   })
  //   expect(newPreRecord).toStrictEqual({
  //     hello: 'there',
  //   })
  //   const newStore = await mapStore({
  //     command: 'test',
  //     preRecord: newPreRecord,
  //     config,
  //     store,
  //   })
  //   console.log(newStore)
  // })
  /* eslint-enable jest/no-commented-out-tests */
})
