#!/usr/bin/env node
import { createCommanderProgram } from './index'

async function main() {
  const program = await createCommanderProgram()
  if (program) {
    program.parse(process.argv)
  }
}

main()
