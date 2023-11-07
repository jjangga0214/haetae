import { configure } from 'haetae'

export default configure({
  commands: {
    foo: {
      run: () => ({ hello: 'world' }),
    },
    bar: {
      env: {
        hi: 'there',
      },
      run: () => ({ hello: 'world' }),
    },
  },
})
