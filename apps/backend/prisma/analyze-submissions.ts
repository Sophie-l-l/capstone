import { PrismaClient } from '@prisma/client'
import { recordSubmissionError, recordLogicError } from '../src/services/errorClassifier.service'

const prisma = new PrismaClient()

interface ErrorAnalysis {
  error_type: string
  category: string
  suggested_fix: string
  knowledge_components: string[]
  severity: string
}

async function analyzeSubmissions(limit: number = 10) {
  console.log(`🔍 Analyzing ${limit} submissions with AI service...\n`)
  
  // Get submissions with errors (not accepted)
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ['wrong_answer', 'runtime_error', 'compilation_error', 'time_limit_exceeded']
      }
    },
    take: limit,
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          knowledgeComponents: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  })

  console.log(`✅ Found ${submissions.length} error submissions to analyze\n`)

  let successCount = 0
  let errorCount = 0

  for (const submission of submissions) {
    try {
      console.log(`\n📝 Analyzing submission ${submission.id.substring(0, 8)}...`)
      console.log(`   Problem: ${submission.problem.title}`)
      console.log(`   Status: ${submission.status}`)
      console.log(`   Language: ${submission.language}`)
      
      // Check if error already exists
      const existingError = await prisma.submissionError.findUnique({
        where: { submissionId: submission.id }
      })

      if (existingError) {
        console.log(`   ℹ️  Error record already exists, skipping...`)
        successCount++
        continue
      }

      // Use the proper service functions that handle both error classification AND signature creation
      if (submission.status === 'wrong_answer') {
        // Use logic error recording for wrong_answer submissions
        console.log(`   Calling logic error classifier...`)
        
        await recordLogicError({
          submissionId: submission.id,
          language: submission.language,
          code: submission.code,
          failingInput: "sample input",
          expectedOutput: `Correct solution (${submission.totalTestCases} tests)`,
          actualOutput: `Failed ${submission.totalTestCases - submission.testCasesPassed} tests`,
          problemDescription: submission.problem.title
        })
        
        console.log(`   💾 Saved logic error with signature to database`)
      } else {
        // Use standard error recording for compiler/runtime errors
        console.log(`   Calling error classifier...`)
        
        await recordSubmissionError({
          submissionId: submission.id,
          language: submission.language,
          compileOutput: submission.compileOutput,
          stderr: submission.stderr,
          code: submission.code
        })
        
        console.log(`   💾 Saved error with signature to database`)
      }
      
      successCount++

    } catch (error) {
      errorCount++
      console.error(`   ❌ Failed to analyze:`, error instanceof Error ? error.message : error)
    }

    // Small delay to avoid overwhelming the AI service
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n\n📊 Analysis Summary:`)
  console.log(`   ✅ Successfully analyzed: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  
  // Show total error records
  const totalErrors = await prisma.submissionError.count()
  console.log(`\n📈 Total Error Records: ${totalErrors}`)
}

const limit = parseInt(process.argv[2] || '10')

analyzeSubmissions(limit)
  .then(async () => {
    await prisma.$disconnect()
    console.log('\n✅ Analysis complete!')
  })
  .catch(async (e) => {
    console.error('\n❌ Analysis failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
