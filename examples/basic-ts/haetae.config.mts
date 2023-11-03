import { configure } from 'haetae'

export default configure({
  commands: {
    foo: {
      run: () => {
        console.log('foo')
      },
    },
    bassss: {
      run: () => ({ hello: 'world' }),
    },
  },
})
