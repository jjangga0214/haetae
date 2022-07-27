import { AssertionError } from 'assert/strict'
import { configure } from '../src/index'

describe('configure()', () => {
  describe('when storeFile is given', () => {
    test('as Windows legacy back-slash path, it is modified to slash path.', () => {
      const winAbsStoreFile = 'C:\\path\\to\\haetae.store.json'
      const winConfig = configure({ commands: {}, storeFile: winAbsStoreFile })
      expect(winConfig.storeFile).toBe('C:/path/to/haetae.store.json')

      const winRelStoreFile = '..\\path\\to\\\\haetae.store.json'
      const config = configure({ commands: {}, storeFile: winRelStoreFile })
      expect(config.storeFile).toBe('../path/to/haetae.store.json')
    })

    test('as a relative file path, it is stil a relative path.', () => {
      const storeFile = '../path/to/haetae.store.json'
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(storeFile)
    })

    test('as non-json path, it is modified to json file path.', () => {
      const storeFile = '<rootDir>'
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(`${storeFile}/haetae.store.json`)
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
