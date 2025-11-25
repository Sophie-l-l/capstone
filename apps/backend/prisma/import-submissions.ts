import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const prisma = new PrismaClient()

/**
 * Import historical submission data from JSONL file
 * 
 * Expected JSONL format (one JSON object per line):
 * {"submission_id": 12345, "language": "Python 3", "source": "print('hello')"}
 * 
 * The script will:
 * - Assign all submissions to the test user
 * - Randomly distribute submissions across available problems
 * - Generate realistic test outcomes (40% accepted, 30% wrong answer, etc.)
 * - Spread submission timestamps over the last 30 days
 */
async function importSubmissions(jsonlFilePath: string) {
  console.log(`📂 Reading JSONL file: ${jsonlFilePath}`)
  
  const fileStream = fs.createReadStream(jsonlFilePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let lineNumber = 0
  let importedCount = 0
  let errorCount = 0

  // Get the test user ID
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })

  if (!testUser) {
    throw new Error('Test user not found! Please run the seed script first.')
  }

  console.log(`👤 Using test user ID: ${testUser.id}`)

  // Get available problem IDs to randomly assign
  const problems = await prisma.problem.findMany({
    select: { id: true }
  })
  
  if (problems.length === 0) {
    throw new Error('No problems found! Please run the seed script first.')
  }

  console.log(`📝 Found ${problems.length} problems in database`)

  // Language mapping from submission format to Judge0 format
  const languageMap: Record<string, string> = {
    'GNU C++': 'cpp',
    'GNU C++11': 'cpp',
    'GNU C++14': 'cpp',
    'GNU C++17': 'cpp',
    'MS C++': 'cpp',
    'Python 2': 'python',
    'Python 3': 'python',
    'PyPy 2': 'python',
    'PyPy 3': 'python',
    'Java 8': 'java',
    'Java 11': 'java',
    'C# 8': 'csharp',
    'Go': 'go',
    'JavaScript': 'javascript',
    'Rust': 'rust',
    'Kotlin': 'kotlin'
  }

  // Helper to get random problem
  const getRandomProblem = (): string => {
    return problems[Math.floor(Math.random() * problems.length)]!.id
  }

  // Helper to normalize language
  const normalizeLanguage = (lang: string): string => {
    return languageMap[lang] || 'cpp' // Default to cpp
  }

  // Helper to generate random submission outcome
  const getRandomOutcome = (): string => {
    const outcomes = ['accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error']
    const weights = [0.4, 0.3, 0.2, 0.1] // 40% accepted, 30% wrong answer, etc.
    const rand = Math.random()
    let cumulative = 0
    for (let i = 0; i < outcomes.length; i++) {
      cumulative += weights[i]!
      if (rand < cumulative) return outcomes[i]!
    }
    return 'accepted'
  }

  for await (const line of rl) {
    lineNumber++
    
    if (!line.trim()) {
      continue // Skip empty lines
    }

    try {
      const data = JSON.parse(line)
      
      // Handle the actual JSONL format: {submission_id, language, source}
      const status = getRandomOutcome()
      const totalTests = Math.floor(Math.random() * 10) + 1 // Random 1-10 test cases
      const passedTests = status === 'accepted' 
        ? totalTests 
        : Math.floor(Math.random() * totalTests) // Random pass count
      
      // Create a submission timestamp (spread over last 30 days)
      const daysAgo = Math.floor(Math.random() * 30)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - daysAgo)
      
      const submission = await prisma.submission.create({
        data: {
          userId: testUser.id,
          problemId: getRandomProblem(),
          code: data.source || '',
          language: normalizeLanguage(data.language),
          status: status,
          testCasesPassed: passedTests,
          totalTestCases: totalTests,
          runtime: status === 'accepted' ? Math.random() * 1000 : null, // Random runtime in ms
          memory: status === 'accepted' ? Math.floor(Math.random() * 50000) + 10000 : null, // Random memory in KB
          submittedAt: timestamp,
          compileOutput: status === 'compilation_error' ? 'Compilation failed' : null,
          stderr: ['runtime_error', 'compilation_error'].includes(status) 
            ? 'Error occurred during execution' 
            : null,
          judgeStatusId: null
        }
      })

      importedCount++
      console.log(`✅ Imported submission ${importedCount} (line ${lineNumber}): ${normalizeLanguage(data.language)} - ${status}`)

    } catch (error) {
      errorCount++
      console.error(`❌ Error on line ${lineNumber}:`, error instanceof Error ? error.message : error)
      
      if (errorCount > 10) {
        console.error('Too many errors, stopping import.')
        break
      }
    }
  }

  console.log(`\n📊 Import complete:`)
  console.log(`   ✅ Successfully imported: ${importedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total lines processed: ${lineNumber}`)
}

// Main execution
const args = process.argv.slice(2)
const jsonlFile = args[0]

if (!jsonlFile) {
  console.error('Usage: ts-node import-submissions.ts <path-to-jsonl-file>')
  console.error('Example: ts-node prisma/import-submissions.ts ./dump-original.jsonl')
  process.exit(1)
}

const fullPath = path.resolve(jsonlFile)

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`)
  process.exit(1)
}

importSubmissions(fullPath)
  .then(async () => {
    await prisma.$disconnect()
    console.log('✅ Disconnected from database')
  })
  .catch(async (e) => {
    console.error('❌ Import failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
