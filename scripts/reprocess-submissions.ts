/**
 * Reprocess Injected Submissions Script
 * 
 * This script takes all injected submissions for the test user and processes them
 * through the complete workflow:
 * 1. Fetch submission from database
 * 2. Get problem test cases
 * 3. Submit to Judge0 for execution
 * 4. Update submission with execution results
 * 5. If failed, send to AI service for error classification
 * 6. Update BKT states based on actual results
 * 
 * Usage: npx ts-node scripts/reprocess-submissions.ts [limit]
 * Example: npx ts-node scripts/reprocess-submissions.ts 10
 */

import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

// Configuration
const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com'
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || ''
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'https://educode-ai-service-162585155042.us-central1.run.app'
const TEST_USER_EMAIL = 'test@example.com'

// Judge0 Language IDs
const LANGUAGE_MAP: Record<string, number> = {
  'javascript': 63,
  'python': 71,
  'java': 62,
  'cpp': 54,
  'c': 50,
  'csharp': 51,
  'go': 60,
  'rust': 73,
  'typescript': 74,
}

// BKT Parameters
const BKT_PARAMS = {
  pInitial: 0.2,
  pTransit: 0.1,
  pSlip: 0.05,
  pGuess: 0.2,
}

interface Judge0Response {
  status: {
    id: number
    description: string
  }
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  message: string | null
  time: string | null
  memory: number | null
}

interface AIClassification {
  surface_error: string
  specific_error: string
  compiler_excerpt: string
  cognitive_cause: string
  bloom_level: string
  reasoning: string
  source: string
  confidence: number
}

async function submitToJudge0(code: string, language: string, input: string): Promise<Judge0Response> {
  const languageId = LANGUAGE_MAP[language.toLowerCase()]
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`)
  }

  // Create submission
  const createResponse = await axios.post(
    `${JUDGE0_URL}/submissions`,
    {
      source_code: Buffer.from(code).toString('base64'),
      language_id: languageId,
      stdin: Buffer.from(input || '').toString('base64'),
      cpu_time_limit: 5,
      memory_limit: 256000,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      params: {
        base64_encoded: 'true',
        fields: '*',
      },
    }
  )

  const token = createResponse.data.token

  // Poll for result
  let attempts = 0
  const maxAttempts = 20
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const resultResponse = await axios.get(
      `${JUDGE0_URL}/submissions/${token}`,
      {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        params: {
          base64_encoded: 'true',
          fields: '*',
        },
      }
    )

    const status = resultResponse.data.status.id
    // Status 1 = In Queue, 2 = Processing
    if (status > 2) {
      return resultResponse.data
    }
    
    attempts++
  }

  throw new Error('Judge0 execution timeout')
}

async function classifyError(
  code: string,
  language: string,
  compileOutput: string | null,
  stderr: string | null
): Promise<AIClassification | null> {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/errors/classify`,
      {
        code,
        language,
        compile_output: compileOutput,
        stderr,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    return response.data
  } catch (error) {
    console.error('AI classification failed:', error)
    return null
  }
}

function mapJudge0StatusToSubmissionStatus(statusId: number): string {
  // Judge0 status codes:
  // 3 = Accepted
  // 4 = Wrong Answer
  // 5 = Time Limit Exceeded
  // 6 = Compilation Error
  // 7 = Runtime Error (SIGSEGV)
  // 8 = Runtime Error (SIGXFSZ)
  // 9 = Runtime Error (SIGFPE)
  // 10 = Runtime Error (SIGABRT)
  // 11 = Runtime Error (NZEC)
  // 12 = Runtime Error (Other)
  // 13 = Internal Error
  // 14 = Exec Format Error

  if (statusId === 3) return 'accepted'
  if (statusId === 4) return 'wrong_answer'
  if (statusId === 5) return 'time_limit_exceeded'
  if (statusId === 6) return 'compilation_error'
  if (statusId >= 7 && statusId <= 12) return 'runtime_error'
  return 'runtime_error'
}

function updateBKTProbability(pKnown: number, isCorrect: boolean): number {
  const { pTransit, pSlip, pGuess } = BKT_PARAMS

  if (isCorrect) {
    // P(K_t | correct) = P(K_t-1) * (1 - pSlip) / [P(K_t-1) * (1 - pSlip) + (1 - P(K_t-1)) * pGuess]
    const numerator = pKnown * (1 - pSlip)
    const denominator = numerator + (1 - pKnown) * pGuess
    const pKnownGivenCorrect = numerator / denominator
    return Math.min(0.99, pKnownGivenCorrect + (1 - pKnownGivenCorrect) * pTransit)
  } else {
    // P(K_t | incorrect) = P(K_t-1) * pSlip / [P(K_t-1) * pSlip + (1 - P(K_t-1)) * (1 - pGuess)]
    const numerator = pKnown * pSlip
    const denominator = numerator + (1 - pKnown) * (1 - pGuess)
    const pKnownGivenIncorrect = numerator / denominator
    return Math.max(0.01, pKnownGivenIncorrect + (1 - pKnownGivenIncorrect) * pTransit)
  }
}

async function reprocessSubmission(submissionId: string): Promise<boolean> {
  try {
    // Fetch submission with problem and test cases
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: {
          include: {
            testCases: true,
          },
        },
      },
    })

    if (!submission || !submission.problem) {
      console.error(`❌ Submission ${submissionId} not found or has no problem`)
      return false
    }

    console.log(`\n📝 Processing submission ${submissionId.substring(0, 8)}... for problem "${submission.problem.title}"`)

    // Use first test case for execution
    const testCase = submission.problem.testCases[0]
    if (!testCase) {
      console.error(`❌ No test cases found for problem ${submission.problem.title}`)
      return false
    }

    // Submit to Judge0
    console.log(`  ⚙️  Executing on Judge0...`)
    const judge0Result = await submitToJudge0(
      submission.code,
      submission.language,
      testCase.input
    )

    const status = mapJudge0StatusToSubmissionStatus(judge0Result.status.id)
    const isAccepted = status === 'accepted'
    
    // Decode base64 outputs
    const stdout = judge0Result.stdout ? Buffer.from(judge0Result.stdout, 'base64').toString('utf-8') : null
    const stderr = judge0Result.stderr ? Buffer.from(judge0Result.stderr, 'base64').toString('utf-8') : null
    const compileOutput = judge0Result.compile_output ? Buffer.from(judge0Result.compile_output, 'base64').toString('utf-8') : null

    // Check test cases
    let passedCount = 0
    if (isAccepted && stdout?.trim() === testCase.output.trim()) {
      passedCount = submission.problem.testCases.length // Assume all pass if first passes
    }

    console.log(`  📊 Status: ${status}, Passed: ${passedCount}/${submission.problem.testCases.length}`)

    // Update submission
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        testCasesPassed: passedCount,
        totalTestCases: submission.problem.testCases.length,
        runtime: judge0Result.time ? parseFloat(judge0Result.time) * 1000 : null, // Convert to ms
        memory: judge0Result.memory,
        compileOutput,
        stderr,
        judgeStatusId: judge0Result.status.id,
      },
    })

    // If failed, classify with AI service
    if (!isAccepted && (compileOutput || stderr)) {
      console.log(`  🤖 Classifying error with AI service...`)
      const classification = await classifyError(
        submission.code,
        submission.language,
        compileOutput,
        stderr
      )

      if (classification) {
        // Find or create error signature
        const errorKey = `${classification.surface_error}_${classification.specific_error}`
        let signature = await prisma.errorSignature.findFirst({
          where: {
            surfaceError: classification.surface_error,
            specificError: classification.specific_error,
          },
        })

        if (!signature) {
          const hash = Buffer.from(`${classification.surface_error}_${classification.specific_error}`).toString('base64').substring(0, 64)
          signature = await prisma.errorSignature.create({
            data: {
              hash,
              surfaceError: classification.surface_error,
              specificError: classification.specific_error,
              cognitiveCause: classification.cognitive_cause,
              bloomLevel: classification.bloom_level,
            },
          })
        }

        // Create or update error record
        await prisma.submissionError.upsert({
          where: { submissionId },
          create: {
            submissionId,
            signatureId: signature.id,
            compileOutput,
            stderr,
            language: submission.language,
          },
          update: {
            signatureId: signature.id,
            compileOutput,
            stderr,
          },
        })

        console.log(`  ✅ Error classified: ${classification.surface_error} - ${classification.cognitive_cause}`)
      }
    }

    // Update BKT states
    const kcs = submission.problem.knowledgeComponents
    for (const kcName of kcs) {
      const kc = await prisma.knowledgeComponent.findUnique({
        where: { name: kcName },
      })

      if (kc) {
        const currentState = await prisma.bKTState.findUnique({
          where: {
            userId_kcId: {
              userId: submission.userId,
              kcId: kc.id,
            },
          },
        })

        if (currentState) {
          const newPKnown = updateBKTProbability(currentState.pKnown, isAccepted)
          await prisma.bKTState.update({
            where: {
              userId_kcId: {
                userId: submission.userId,
                kcId: kc.id,
              },
            },
            data: {
              pKnown: newPKnown,
              lastUpdated: new Date(),
            },
          })
        }
      }
    }

    console.log(`  ✅ Submission reprocessed successfully`)
    return true

  } catch (error) {
    console.error(`❌ Failed to reprocess submission ${submissionId}:`, error)
    return false
  }
}

async function main() {
  try {
    console.log('🚀 Starting submission reprocessing...\n')

    // Get test user
    const testUser = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL },
    })

    if (!testUser) {
      console.error(`❌ Test user ${TEST_USER_EMAIL} not found`)
      process.exit(1)
    }

    console.log(`👤 Test user: ${testUser.email} (${testUser.id})`)

    // Get limit from command line
    const limit = process.argv[2] ? parseInt(process.argv[2]) : undefined
    
    // Fetch all submissions for test user
    const submissions = await prisma.submission.findMany({
      where: {
        userId: testUser.id,
      },
      orderBy: {
        submittedAt: 'asc',
      },
      take: limit,
    })

    console.log(`📦 Found ${submissions.length} submissions to reprocess`)
    
    if (!JUDGE0_API_KEY) {
      console.error('❌ JUDGE0_API_KEY not set in environment')
      process.exit(1)
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i]
      console.log(`\n[${i + 1}/${submissions.length}] Processing submission ${submission.id.substring(0, 8)}...`)
      
      const success = await reprocessSubmission(submission.id)
      if (success) {
        successCount++
      } else {
        failCount++
      }

      // Rate limiting - wait between submissions
      if (i < submissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Reprocessing complete!')
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
