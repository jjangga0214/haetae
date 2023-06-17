import { AssertionError } from 'assert/strict'
import { dirname } from 'dirname-filename-esm'
import {
  configure,
  setConfigFilename,
  localStore,
  invokeEnv,
  invokeRun,
} from '../src/index.js'

describe('localStore()', () => {
  test('when filename does not end with .json', () => {
    const store = localStore({ filename: '/path/to' })
    expect(store.localStore.filename).toBe('/path/to/store.json')
  })
  test('when filename ends with .json', () => {
    const store = localStore({ filename: '/path/to/store.json' })
    expect(store.localStore.filename).toBe('/path/to/store.json')
  })
  describe('when recordRemoval is given', () => {
    test('as undefined', () => {
      const store = localStore({ filename: '.' })
      expect(store.localStore.recordRemoval.age).toBe(Number.POSITIVE_INFINITY)
      expect(store.localStore.recordRemoval.count).toBe(
        Number.POSITIVE_INFINITY,
      )
    })
    test('without age', () => {
      const store = localStore({ filename: '.', recordRemoval: { count: 10 } })
      expect(store.localStore.recordRemoval.age).toBe(Number.POSITIVE_INFINITY)
      expect(store.localStore.recordRemoval.count).toBe(10)
    })
    test('without count', () => {
      const store = localStore({
        filename: '.',
        recordRemoval: { age: 60 * 60 * 24 * 30 },
      })
      expect(store.localStore.recordRemoval.age).toBe(60 * 60 * 24 * 30)
      expect(store.localStore.recordRemoval.count).toBe(
        Number.POSITIVE_INFINITY,
      )
    })
    test('with age and count', () => {
      const store = localStore({
        filename: '.',
        recordRemoval: { age: 60 * 60 * 24 * 30, count: 10 },
      })
      expect(store.localStore.recordRemoval.age).toBe(60 * 60 * 24 * 30)
      expect(store.localStore.recordRemoval.count).toBe(10)
    })
    test('with negative age or count', () => {
      const store = localStore({
        filename: '.',
        recordRemoval: { age: -1 },
      })
      expect(store.localStore.recordRemoval.age).toBe(-1)
      expect(() =>
        localStore({
          filename: '.',
          recordRemoval: { count: -1 },
        }),
      ).toThrow(AssertionError)
    })
    test('with zero age or count', () => {
      expect(() =>
        localStore({
          filename: '.',
          recordRemoval: { count: 0, age: 0 },
        }),
      ).not.toThrow(AssertionError)
    })
  })
})

describe('configure()', () => {
  describe("when commands' env and run are given with different types", () => {
    // eslint-disable-next-line jest/require-hook
    setConfigFilename({
      filename: 'haetae.config.js',
      cwd: dirname(import.meta),
      checkExistence: false,
    })
    const config = configure({
      commands: {
        foo: {
          env: {
            FOO: 'foo',
          },
          run: async () => ({ hello: 'world' }),
        },
        bar: {
          env: () => ({
            BAR: 'bar',
          }),
          run: () => ({ hello2: 'world2' }),
        },
      },
    })
    test('when env is given as an object', async () => {
      await expect(
        invokeEnv({
          command: 'foo',
          config,
        }),
      ).resolves.toStrictEqual({
        FOO: 'foo',
      })
    })
    test('when env is given as a function', async () => {
      await expect(
        invokeEnv({
          command: 'bar',
          config,
        }),
      ).resolves.toStrictEqual({
        BAR: 'bar',
      })
    })
    test('when run is given as an async function', async () => {
      await expect(
        invokeRun({
          command: 'foo',
          config,
        }),
      ).resolves.toStrictEqual({ hello: 'world' })
    })
    test('when run is given as a synchrounous function', async () => {
      await expect(
        invokeRun({
          command: 'bar',
          config,
        }),
      ).resolves.toStrictEqual({ hello2: 'world2' })
    })
  })
})
