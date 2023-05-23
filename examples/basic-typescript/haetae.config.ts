// eslint-disable-next-line import/no-extraneous-dependencies
import { utils, configure } from 'haetae'

export default configure({
  commands: {
    myAwesomeCommand: {
      run: async () => {
        const stdout = await utils.exec('echo hello, world!')
        console.log(stdout)
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
      },
    },
    myAnotherCommand: {
      run: async () => {
        const stdout = await utils.exec('echo hello, world!')
        console.log(stdout)
        return {
          hi: stdout,
        }
      },
      env: async () => ({
        NODE_ENV: process.env.NODE_ENV,
        ji: 's',
      }),
    },
  },
})
