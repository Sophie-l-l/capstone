import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const prisma = new PrismaClient()

/**
 * Enhanced submission import with error classification and BKT updates
 * 
 * Usage: npx ts-node import-submissions-enhanced.ts <jsonl-file> [max-submissions]
 * Example: npx ts-node import-submissions-enhanced.ts data/sample-200.jsonl 100
 */

// Sample error messages for different statuses
const ERROR_TEMPLATES = {
  compilation_error: [
    "error: expected ';' before '}' token",
    "error: 'cout' was not declared in this scope",
    "error: incompatible types when assigning to type 'int' from type 'char*'",
    "SyntaxError: invalid syntax",
    "IndentationError: expected an indented block"
  ],
  runtime_error: [
    "Traceback (most recent call last):\n  File \"solution.py\", line 10, in <module>\n    print(arr[10])\nIndexError: list index out of range",
    "Exception in thread \"main\" java.lang.NullPointerException\n\tat Solution.main(Solution.java:15)",
    "Segmentation fault (core dumped)",
    "ZeroDivisionError: division by zero"
  ],
  time_limit_exceeded: [],
  wrong_answer: []
}

async function importSubmissionsEnhanced(jsonlFilePath: string, maxSubmissions?: number) {
  console.log(`📂 Reading JSONL file: ${jsonlFilePath}`)
  console.log(`🎯 Max submissions: ${maxSubmissions || 'unlimited'}`)
  
  const fileStream = fs.createReadStream(jsonlFilePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let lineNumber = 0
  let importedCount = 0
  let errorCount = 0

  // Get test user (created by seed script)
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })

  if (!testUser) {
    throw new Error('Test user not found! Please run: npx prisma db seed')
  }

  console.log(`👤 Using test user: ${testUser.email} (ID: ${testUser.id})`)

  // Get available problems
  const problems = await prisma.problem.findMany({
    select: { id: true, title: true, knowledgeComponents: true }
  })
  
  if (problems.length === 0) {
    throw new Error('No problems found! Please run seed script first: npx prisma db seed')
  }

  console.log(`📝 Found ${problems.length} problems in database`)

  // Get all KCs for BKT initialization
  const allKCs = await prisma.knowledgeComponent.findMany()
  console.log(`🧠 Found ${allKCs.length} Knowledge Components`)

  // Language mapping
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

  const getRandomProblem = () => {
    return problems[Math.floor(Math.random() * problems.length)]!
  }

  const normalizeLanguage = (lang: string): string => {
    return languageMap[lang] || 'cpp'
  }

  const getRandomOutcome = (): string => {
    const rand = Math.random()
    if (rand < 0.40) return 'accepted'
    if (rand < 0.70) return 'wrong_answer'
    if (rand < 0.85) return 'runtime_error'
    if (rand < 0.95) return 'compilation_error'
    return 'time_limit_exceeded'
  }

  const getErrorMessage = (status: string): string | null => {
    const templates = ERROR_TEMPLATES[status as keyof typeof ERROR_TEMPLATES]
    if (!templates || templates.length === 0) return null
    return templates[Math.floor(Math.random() * templates.length)]!
  }

  for await (const line of rl) {
    lineNumber++
    
    if (!line.trim()) continue
    if (maxSubmissions && importedCount >= maxSubmissions) {
      console.log(`\n🎯 Reached max submissions limit (${maxSubmissions})`)
      break
    }

    try {
      const data = JSON.parse(line)
      
      console.log(`Processing line ${lineNumber}...`)
      
      const status = getRandomOutcome()
      const problem = getRandomProblem()
      const totalTests = Math.floor(Math.random() * 5) + 3 // 3-8 test cases
      const passedTests = status === 'accepted' 
        ? totalTests 
        : Math.floor(Math.random() * totalTests)
      
      // Create timestamp (spread over last 60 days for more realistic history)
      const daysAgo = Math.floor(Math.random() * 60)
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - daysAgo)
      
      // Generate error messages for non-accepted submissions
      const compileOutput = status === 'compilation_error' ? getErrorMessage(status) : null
      const stderr = ['runtime_error', 'compilation_error'].includes(status) 
        ? getErrorMessage(status) || 'Error occurred during execution'
        : null

      const submission = await prisma.submission.create({
        data: {
          userId: testUser.id,
          problemId: problem.id,
          code: data.source || '',
          language: normalizeLanguage(data.language),
          status: status,
          testCasesPassed: passedTests,
          totalTestCases: totalTests,
          runtime: status === 'accepted' ? Math.random() * 1000 : null,
          memory: status === 'accepted' ? Math.floor(Math.random() * 50000) + 10000 : null,
          submittedAt: timestamp,
          compileOutput: compileOutput,
          stderr: stderr,
          judgeStatusId: null
        }
      })

      console.log(`Created submission ${submission.id}, updating BKT...`)

      // Update BKT states for problem's KCs
      const isCorrect = status === 'accepted'
      for (const kcName of problem.knowledgeComponents) {
        const kc = allKCs.find(k => k.name === kcName)
        if (kc) {
          // Find or create BKT state
          let bktState = await prisma.bKTState.findUnique({
            where: {
              userId_kcId: {
                userId: testUser.id,
                kcId: kc.id
              }
            }
          })

          if (!bktState) {
            // Initialize new BKT state
            bktState = await prisma.bKTState.create({
              data: {
                userId: testUser.id,
                kcId: kc.id,
                pKnown: 0.3, // Initial low mastery
                attempts: 0,
                corrects: 0
              }
            })
          }

          // Simple BKT update (you can make this more sophisticated)
          const S = 0.05 // Slip probability
          const G = 0.2  // Guess probability
          const T = 0.1  // Learn probability
          
          let P_L = bktState.pKnown
          
          if (isCorrect) {
            // P(L|correct) = P(L) * (1-S) / (P(L)*(1-S) + (1-P(L))*G)
            const numerator = P_L * (1 - S)
            const denominator = P_L * (1 - S) + (1 - P_L) * G
            P_L = numerator / denominator
          } else {
            // P(L|incorrect) = P(L) * S / (P(L)*S + (1-P(L))*(1-G))
            const numerator = P_L * S
            const denominator = P_L * S + (1 - P_L) * (1 - G)
            P_L = numerator / denominator
          }
          
          // Apply transition probability
          P_L = P_L + (1 - P_L) * T
          
          // Update attempts and corrects
          const newAttempts = bktState.attempts + 1
          const newCorrects = bktState.corrects + (isCorrect ? 1 : 0)
          
          await prisma.bKTState.update({
            where: { id: bktState.id },
            data: { 
              pKnown: Math.min(P_L, 0.99), // Cap at 0.99
              attempts: newAttempts,
              corrects: newCorrects,
              lastUpdated: new Date()
            }
          })
        }
      }

      importedCount++
      if (importedCount % 10 === 0) {
        console.log(`✅ Imported ${importedCount} submissions...`)
      }

    } catch (error) {
      errorCount++
      console.error(`❌ Error on line ${lineNumber}:`, error instanceof Error ? error.message : error)
      
      if (errorCount > 20) {
        console.error('Too many errors, stopping import.')
        break
      }
    }
  }

  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Successfully imported: ${importedCount} submissions`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total lines processed: ${lineNumber}`)
  console.log(`\n🧠 BKT States Initialized`)
  
  // Show summary stats
  const stats = await prisma.submission.groupBy({
    by: ['status'],
    where: { userId: testUser.id },
    _count: true
  })
  
  console.log(`\n📈 Submission Status Distribution:`)
  stats.forEach(stat => {
    console.log(`   ${stat.status}: ${stat._count} (${((stat._count / importedCount) * 100).toFixed(1)}%)`)
  })
  
  const bktCount = await prisma.bKTState.count({
    where: { userId: testUser.id }
  })
  console.log(`\n🎯 BKT States created: ${bktCount}`)
}

// Main execution
const args = process.argv.slice(2)
const jsonlFile = args[0]
const maxSubmissions = args[1] ? parseInt(args[1]) : undefined

if (!jsonlFile) {
  console.error('Usage: npx ts-node import-submissions-enhanced.ts <jsonl-file> [max-submissions]')
  console.error('Example: npx ts-node import-submissions-enhanced.ts data/sample-200.jsonl 100')
  process.exit(1)
}

const fullPath = path.resolve(jsonlFile)

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`)
  process.exit(1)
}

importSubmissionsEnhanced(fullPath, maxSubmissions)
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✅ Import complete! Database disconnected.')
    console.log('\n🚀 Next steps:')
    console.log('   1. Login as test@example.com / password123')
    console.log('   2. View dashboard to see imported submission history')
    console.log('   3. Check Knowledge Component mastery levels')
  })
  .catch(async (e) => {
    console.error('❌ Import failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
