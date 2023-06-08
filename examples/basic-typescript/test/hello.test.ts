import { name } from '../src/hello.js'

describe('name', () => {
  test('basic usage', () => {
    expect(name).toBe('hello')
  })
})
