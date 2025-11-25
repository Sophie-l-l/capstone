import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as readline from 'readline'

const prisma = new PrismaClient()

// Language mapping
const langMap: Record<string, string> = {
  'GNU C++': 'cpp', 'GNU C++11': 'cpp', 'GNU C++14': 'cpp', 'GNU C++17': 'cpp',
  'MS C++': 'cpp', 'Python 2': 'python', 'Python 3': 'python',
  'PyPy 2': 'python', 'PyPy 3': 'python', 'Java 8': 'java', 'Java 11': 'java'
}

async function quickImport(filePath: string, limit: number = 200) {
  console.log(`📂 Importing ${limit} submissions from: ${filePath}\n`)
  
  // Get test user
  const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } })
  if (!user) throw new Error('Test user not found!')
  
  // Get problems
  const problems = await prisma.problem.findMany({ select: { id: true } })
  if (problems.length === 0) throw new Error('No problems found!')
  
  console.log(`✅ Found ${problems.length} problems\n`)
  
  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  let count = 0
  const outcomes = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error']
  
  for await (const line of rl) {
    if (count >= limit) break
    if (!line.trim()) continue
    
    try {
      const data = JSON.parse(line)
      const status = outcomes[Math.floor(Math.random() * outcomes.length)]!
      const totalTests = Math.floor(Math.random() * 10) + 1
      const passedTests = status === 'accepted' ? totalTests : Math.floor(Math.random() * totalTests)
      
      const daysAgo = Math.floor(Math.random() * 30)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - daysAgo)
      
      await prisma.submission.create({
        data: {
          userId: user.id,
          problemId: problems[Math.floor(Math.random() * problems.length)]!.id,
          code: data.source || '',
          language: langMap[data.language] || 'cpp',
          status,
          testCasesPassed: passedTests,
          totalTestCases: totalTests,
          runtime: status === 'accepted' ? Math.random() * 1000 : null,
          memory: status === 'accepted' ? Math.floor(Math.random() * 50000) + 10000 : null,
          submittedAt: timestamp,
        }
      })
      
      count++
      if (count % 50 === 0) console.log(`✅ Imported ${count}/${limit}...`)
      
    } catch (err) {
      console.error(`⚠️  Skipped line ${count + 1}`)
    }
  }
  
  console.log(`\n🎉 Successfully imported ${count} submissions!`)
}

const file = process.argv[2] || 'prisma/data/dump-original.jsonl'
const limit = parseInt(process.argv[3] || '200')

quickImport(file, limit)
  .finally(() => prisma.$disconnect())
