import { configure } from 'haetae'

export default configure({
  commands: {
    foo: {
      run: () => ({ hello: 'world' }),
    },
  },
})
