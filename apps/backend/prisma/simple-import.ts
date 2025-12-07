import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function simpleImport(jsonlFile: string, maxLines: number = 100) {
  console.log(`📂 Reading ${jsonlFile}...`)
  
  const content = fs.readFileSync(jsonlFile, 'utf-8')
  const lines = content.split('\n').filter(l => l.trim())
  
  console.log(`📝 Found ${lines.length} lines in file`)
  
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })
  
  if (!testUser) {
    throw new Error('Test user not found! Run: npx prisma db seed')
  }
  
  const problems = await prisma.problem.findMany({ select: { id: true } })
  
  console.log(`👤 User: ${testUser.email}`)
  console.log(`📝 Problems: ${problems.length}`)
  
  const languageMap: Record<string, string> = {
    'GNU C++': 'cpp', 'GNU C++11': 'cpp', 'GNU C++14': 'cpp', 'GNU C++17': 'cpp',
    'MS C++': 'cpp', 'Python 2': 'python', 'Python 3': 'python',
    'Java 8': 'java', 'Java 11': 'java', 'JavaScript': 'javascript'
  }
  
  const linesToProcess = Math.min(lines.length, maxLines)
  console.log(`\n⏳ Importing ${linesToProcess} submissions...\n`)
  
  for (let i = 0; i < linesToProcess; i++) {
    try {
      const line = lines[i]
      if (!line) continue
      
      const data = JSON.parse(line)
      const rand = Math.random()
      const status = rand < 0.4 ? 'accepted' : rand < 0.7 ? 'wrong_answer' : 'runtime_error'
      
      const problem = problems[Math.floor(Math.random() * problems.length)]
      const totalTests = 5
      const passedTests = status === 'accepted' ? 5 : Math.floor(Math.random() * 5)
      
      const daysAgo = Math.floor(Math.random() * 60)
      const submittedAt = new Date()
      submittedAt.setDate(submittedAt.getDate() - daysAgo)
      
      await prisma.submission.create({
        data: {
          userId: testUser.id,
          problemId: problem!.id,
          code: (data.source || '').substring(0, 10000), // Limit code size
          language: languageMap[data.language] || 'cpp',
          status,
          testCasesPassed: passedTests,
          totalTestCases: totalTests,
          submittedAt,
          runtime: status === 'accepted' ? Math.random() * 500 : null,
          memory: status === 'accepted' ? 50000 : null
        }
      })
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Imported ${i + 1} submissions...`)
      }
    } catch (e) {
      console.error(`❌ Error on line ${i}: ${e}`)
    }
  }
  
  console.log(`\n✅ Import complete! Imported ${linesToProcess} submissions.`)
  
  const stats = await prisma.submission.groupBy({
    by: ['status'],
    where: { userId: testUser.id },
    _count: true
  })
  
  console.log('\n📊 Status Distribution:')
  stats.forEach(s => console.log(`   ${s.status}: ${s._count}`))
  
  console.log('\n🚀 Login with: test@example.com / password123')
  
  await prisma.$disconnect()
}

const file = process.argv[2]
const max = process.argv[3] ? parseInt(process.argv[3]) : 100

if (!file) {
  console.error('Usage: npx ts-node simple-import.ts <jsonl-file> [max-count]')
  console.error('Example: npx ts-node prisma/simple-import.ts prisma/data/sample-200.jsonl 100')
  process.exit(1)
}

simpleImport(file, max).catch(console.error)
