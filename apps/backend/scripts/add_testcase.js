#!/usr/bin/env node
// add_testcase.js
// Usage: node scripts/add_testcase.js --problemId=<id> --input='<input>' --output='<output>' [--hidden]

const { PrismaClient } = require('@prisma/client')
// Minimal argv parser to avoid extra dependencies
const rawArgs = process.argv.slice(2)
const argv = {}
rawArgs.forEach(a => {
  if (a.startsWith('--')) {
    const eq = a.indexOf('=')
    if (eq > -1) {
      const key = a.substring(2, eq)
      const val = a.substring(eq + 1)
      argv[key] = val
    } else {
      argv[a.substring(2)] = true
    }
  }
})

async function main() {
  const prisma = new PrismaClient()
  const problemId = argv.problemId || argv.p
  const input = argv.input || argv.i || ''
  const output = argv.output || argv.o || ''
  const hidden = argv.hidden || argv.h || false

  if (!problemId) {
    console.error('Missing --problemId')
    process.exit(2)
  }

  try {
    const tc = await prisma.testCase.create({
      data: {
        problemId,
        input,
        output,
        isHidden: hidden ? true : false,
        points: 10
      }
    })
    console.log('Created test case:', tc)
  } catch (e) {
    console.error('Failed to create test case:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
