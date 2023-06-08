import { name, depName } from '../src/index.js'

describe('name', () => {
  test('basic usage', () => {
    expect(name).toBe('index')
  })
})

describe('depName', () => {
  test('basic usage', () => {
    expect(depName).toBe('hello')
  })
})
