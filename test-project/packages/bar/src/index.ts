import { doubleNumbers } from '@haetae/test-project-foo'
// import { doubleNumbers } from '../../foo/src/index'

export const run = () => {
  const value = doubleNumbers([1, 2, 3])
  return value
}

console.log(run())
