import { AssertionError } from 'assert/strict'
import path from 'path'
import { configure } from '../src/index'

describe('configure()', () => {
  describe('when storeFile is given', () => {
    test('as absolute file path, it is not modified.', () => {
      const posixStoreFile = '/path/to/haetae.store.json'
      const posixConfig = configure({ commands: {}, storeFile: posixStoreFile })
      expect(posixConfig.storeFile).toBe(posixStoreFile)

      const winStoreFile = 'C:\\path\\to\\haetae.store.json'
      const winConfig = configure({ commands: {}, storeFile: winStoreFile })
      expect(winConfig.storeFile).toBe(winStoreFile)
    })

    test('as relative posix file path, it might be modified to platform compatible relative path.', () => {
      const storeFile = '../path/to/haetae.store.json'
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(
        path.join('..', 'path', 'to', 'haetae.store.json'),
      )
    })

    test('as relative Windows file path, it is not modified.', () => {
      const storeFile = '..path\\to\\haetae.store.json'
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(storeFile)
    })

    test('as absolute dir path, it is modified to absolute file path.', () => {
      const storeFile = __dirname
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(path.join(storeFile, 'haetae.store.json'))
    })

    test('as relative dir path, it is modified to relative file path.', () => {
      const storeFile = '..'
      const config = configure({ commands: {}, storeFile })
      expect(config.storeFile).toBe(path.join(storeFile, 'haetae.store.json'))
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
