import path from 'path'
import {
  setConfigFilename,
  getConfig,
  getStore,
  invokeEnv,
  invokeTarget,
  invokeSave,
  mapStore,
  getRecord,
} from '@haetae/core'

describe('index', () => {
  const configFilename = path.join(__dirname, 'haetae.config.example.js')
  setConfigFilename(configFilename)

  it('getConfig', async () => {
    expect.hasAssertions()

    const targetList = (await getConfig()).commands.test.target()
    expect(targetList).toStrictEqual(['hello.ts', 'there.ts'])
  })

  it('getStore', async () => {
    expect.hasAssertions()

    expect((await getStore()).version).toBe('0.0.1')
    expect((await getStore()).commands.test[0].time).toBe(
      '2021-08-16T08:59:07.409Z',
    )
  })

  it('invokeEnv', async () => {
    expect.hasAssertions()

    const haetaeEnv = await invokeEnv({
      command: 'test',
    })

    expect(haetaeEnv).toStrictEqual({
      os: 'linux',
      coreVersion: '0.0.1',
    })
  })

  it('invokeTarget', async () => {
    expect.hasAssertions()

    const targetList = await invokeTarget({
      command: 'test',
    })

    expect(targetList).toStrictEqual(['hello.ts', 'there.ts'])
  })

  it('invokeSave', async () => {
    expect.hasAssertions()
    const preRecord = await invokeSave({
      command: 'test',
    })
    expect(preRecord).toStrictEqual({
      '@haetae/git': {
        gitSha: '77c033b',
      },
    })
  })
  it('mapStore', async () => {
    expect.hasAssertions()
    const originalStore = await getStore()
    const originalRecord = await getRecord({
      command: 'test',
    })
    const newStore = await mapStore({
      command: 'test',
    })
    const newRecord = await getRecord({
      command: 'test',
      store: newStore,
    })
    expect(originalRecord?.time !== newRecord?.time).toBe(true)
    const newStore2 = await mapStore({
      command: 'test',
      record: newRecord,
      store: originalStore,
    })
    expect(newStore2).toStrictEqual(newStore)
  })
})
