import assert, { AssertionError } from 'assert/strict'
import { dirname } from 'dirname-filename-esm'
import {
  configure,
  setConfigFilename,
  localFileStore,
  createRecord,
  invokeEnv,
  invokeRun,
  invokeRootEnv,
  invokeRootRecordData,
  hashEnv,
} from '../src/index.js'

describe('localFileStore()', () => {
  test('when filename does not end with .json', () => {
    const store = localFileStore({ filename: '/path/to' })
    expect(store.localFileStore.filename).toBe('/path/to/store.json')
  })
  test('when filename ends with .json', () => {
    const store = localFileStore({ filename: '/path/to/store.json' })
    expect(store.localFileStore.filename).toBe('/path/to/store.json')
  })
  describe('when recordRemoval is given', () => {
    test('as undefined', () => {
      const store = localFileStore({ filename: '.' })
      expect(store.localFileStore.recordRemoval.age).toBe(
        Number.POSITIVE_INFINITY,
      )
      expect(store.localFileStore.recordRemoval.count).toBe(
        Number.POSITIVE_INFINITY,
      )
    })
    test('without age', () => {
      const store = localFileStore({
        filename: '.',
        recordRemoval: { count: 10 },
      })
      expect(store.localFileStore.recordRemoval.age).toBe(
        Number.POSITIVE_INFINITY,
      )
      expect(store.localFileStore.recordRemoval.count).toBe(10)
    })
    test('without count', () => {
      const store = localFileStore({
        filename: '.',
        recordRemoval: { age: 60 * 60 * 24 * 30 },
      })
      expect(store.localFileStore.recordRemoval.age).toBe(60 * 60 * 24 * 30)
      expect(store.localFileStore.recordRemoval.count).toBe(
        Number.POSITIVE_INFINITY,
      )
    })
    test('with age and count', () => {
      const store = localFileStore({
        filename: '.',
        recordRemoval: { age: 60 * 60 * 24 * 30, count: 10 },
      })
      expect(store.localFileStore.recordRemoval.age).toBe(60 * 60 * 24 * 30)
      expect(store.localFileStore.recordRemoval.count).toBe(10)
    })
    test('with negative age or count', () => {
      expect(() =>
        localFileStore({
          filename: '.',
          recordRemoval: { age: -1 },
        }),
      ).toThrow(AssertionError)
      expect(() =>
        localFileStore({
          filename: '.',
          recordRemoval: { count: -1 },
        }),
      ).toThrow(AssertionError)
    })
    test('with zero age or count', () => {
      expect(() =>
        localFileStore({
          filename: '.',
          recordRemoval: { count: 0, age: 0 },
        }),
      ).not.toThrow(AssertionError)
    })
  })
})

describe('configure(), invoke*(), createRecord()', () => {
  // eslint-disable-next-line jest/require-hook
  setConfigFilename({
    filename: 'haetae.config.js',
    cwd: dirname(import.meta),
    checkExistence: false,
  })
  const store = localFileStore()
  const config = configure({
    env: (env, { store }) => {
      assert(['foo', 'bar'].includes(env.envKey as string))
      expect(store.hello).toBe('world')
      return {
        ...env,
        rootEnv: true,
      }
    },
    recordData: (data, { env, store }) => {
      expect(env.rootEnv).toBe(true)
      expect(['foo', 'bar']).toContain(env.envKey as string)
      expect(['foo', 'bar']).toContain(data.dataKey as string)
      expect(store.hello).toBe('world')
      return {
        ...data,
        rootRecordData: true,
      }
    },
    commands: {
      foo: {
        env: {
          envKey: 'foo',
        },
        run: async ({ env, store }) => {
          expect(env).toStrictEqual({ envKey: 'foo' })
          expect(store.hello).toBe('world')
          return { dataKey: 'foo' }
        },
      },
      bar: {
        env: async ({ store }) => {
          expect(store.hello).toBe('world')
          return {
            envKey: 'bar',
          }
        },
        run: ({ env, store }) => {
          expect(env).toStrictEqual({ envKey: 'bar' })
          expect(store.hello).toBe('world')
          return { dataKey: 'bar' }
        },
      },
    },
    store: {
      ...store,
      hello: 'world',
    },
  })
  test('when `env` is given as an object', async () => {
    await expect(
      invokeEnv({
        command: 'foo',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config,
      }),
    ).resolves.toStrictEqual({
      envKey: 'foo',
    })
  })
  test('when `env` is given as a function', async () => {
    await expect(
      invokeEnv({
        command: 'bar',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config,
      }),
    ).resolves.toStrictEqual({
      envKey: 'bar',
    })
  })
  test('when `run` is given as an async function', async () => {
    await expect(
      invokeRun({
        command: 'foo',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config,
      }),
    ).resolves.toStrictEqual({ dataKey: 'foo' })
  })
  test('when `run` is given as a synchrounous function', async () => {
    await expect(
      invokeRun({
        command: 'bar',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config,
      }),
    ).resolves.toStrictEqual({ dataKey: 'bar' })
  })
  test('invokeRootEnv()', async () => {
    await expect(
      invokeRootEnv({
        env: { envKey: 'foo' },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config,
      }),
    ).resolves.toStrictEqual({ envKey: 'foo', rootEnv: true })
  })
  test('invokeRootRecordData()', async () => {
    await expect(
      invokeRootRecordData({
        env: { envKey: 'foo', rootEnv: true },
        recordData: { dataKey: 'foo' },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config,
      }),
    ).resolves.toStrictEqual({
      rootRecordData: true,
      dataKey: 'foo',
    })
  })
  test('createRecord()', async () => {
    const record = await createRecord({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config,
      command: 'foo',
    })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete record.time
    expect(record).toStrictEqual({
      env: {
        envKey: 'foo',
        rootEnv: true,
      },
      envHash: hashEnv({
        envKey: 'foo',
        rootEnv: true,
      }),
      data: {
        dataKey: 'foo',
        rootRecordData: true,
      },
    })
  })
})
