import { configure } from '../src/index'

describe('configure()', () => {
  describe('when storeFile is given', () => {
    it('is not modified when given as an Windows absolute path.', () => {
      const storeFile = 'C:\\users\\admin\\haetae.config.json'
      const config = configure({
        commands: {},
        storeFile,
      })
      expect(config.storeFile).toBe(storeFile)
    })
  })
})
