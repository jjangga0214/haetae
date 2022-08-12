import { AssertionError } from 'assert/strict'
import upath from 'upath'
import { configure, setStoreFilename } from '../src/index'

describe('configure()', () => {
  describe('when storeFile is given', () => {
    // eslint-disable-next-line jest/no-hooks
    afterEach(() => {
      // eslint-disable-next-line unicorn/no-null
      setStoreFilename(null)
    })
    if (process.platform === 'win32') {
      test('as Windows legacy back-slash path, it is modified to slash path.', () => {
        const winConfig = configure({
          commands: {},
          storeFile: 'C:\\path\\to\\haetae.store.json',
        })
        expect(winConfig.storeFile).toBe('C:/path/to/haetae.store.json')

        const config = configure({
          commands: {},
          storeFile: '..\\path\\to\\\\haetae.store.json',
        })
        expect(config.storeFile).toBe('../path/to/haetae.store.json')
      })
    }

    test('as a relative file path, it becomes a absolute path.', () => {
      const storeFile = '../path/to/haetae.store.json'
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(upath.resolve(storeFile))
    })

    test('as non-json path, it is modified to json file path.', () => {
      const storeFile = '<rootDir>'
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(
        upath.resolve(`${storeFile}/.haetae/store.json`),
      )
    })
  })

  describe('when storeFile is already set', () => {
    // eslint-disable-next-line jest/no-hooks
    afterEach(() => {
      // eslint-disable-next-line unicorn/no-null
      setStoreFilename(null)
    })
    test('given storeFile is ignored', () => {
      const storeFile = '<rootDir>'
      setStoreFilename(storeFile)
      const config = configure({ commands: {}, storeFile: '<anotherDir>' })
      expect(config.storeFile).toBe(
        upath.resolve(`${storeFile}/.haetae/store.json`),
      )
    })

    test('storeFile is resolved without given value', () => {
      const storeFile = '<rootDir>'
      setStoreFilename(storeFile)
      const config = configure({ commands: {} })
      expect(config.storeFile).toBe(
        upath.resolve(`${storeFile}/.haetae/store.json`),
      )
    })
  })

  describe('when recordRemoval is given', () => {
    test('as undefined', () => {
      const config = configure({ commands: {} })
      expect(config.recordRemoval.age).toBe(Number.POSITIVE_INFINITY)
      expect(config.recordRemoval.count).toBe(Number.POSITIVE_INFINITY)
    })
    test('without age', () => {
      const config = configure({ commands: {}, recordRemoval: { count: 10 } })
      expect(config.recordRemoval.age).toBe(Number.POSITIVE_INFINITY)
      expect(config.recordRemoval.count).toBe(10)
    })
    test('without count', () => {
      const config = configure({
        commands: {},
        recordRemoval: { age: 60 * 60 * 24 * 30 },
      })
      expect(config.recordRemoval.age).toBe(60 * 60 * 24 * 30)
      expect(config.recordRemoval.count).toBe(Number.POSITIVE_INFINITY)
    })
    test('with age and count', () => {
      const config = configure({
        commands: {},
        recordRemoval: { age: 60 * 60 * 24 * 30, count: 10 },
      })
      expect(config.recordRemoval.age).toBe(60 * 60 * 24 * 30)
      expect(config.recordRemoval.count).toBe(10)
    })
    test('with negative age or count', () => {
      expect(() =>
        configure({
          commands: {},
          recordRemoval: { age: -1 },
        }),
      ).toThrow(AssertionError)
      expect(() =>
        configure({
          commands: {},
          recordRemoval: { count: -1 },
        }),
      ).toThrow(AssertionError)
    })
    test('with zero age or count', () => {
      expect(() =>
        configure({
          commands: {},
          recordRemoval: { age: 0 },
        }),
      ).not.toThrow(AssertionError)
      expect(() =>
        configure({
          commands: {},
          recordRemoval: { count: 0 },
        }),
      ).not.toThrow(AssertionError)
    })
  })
})
