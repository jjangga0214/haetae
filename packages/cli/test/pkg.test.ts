import { AssertionError } from 'assert'

describe('pkg export', () => {
  test('without assertion error', async () => {
    await expect(import('../src/pkg')).resolves.not.toThrow(AssertionError)
  })
})
