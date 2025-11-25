import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Update existing submissions with realistic synthetic error messages
 * This makes them ready for AI analysis without needing to call the API for every submission
 */
async function updateSubmissionsWithErrors() {
  console.log('🔧 Updating submissions with synthetic error messages...\n')
  
  // Compilation errors
  const compileErrors = await prisma.submission.updateMany({
    where: {
      status: 'compilation_error',
      compileOutput: null
    },
    data: {
      compileOutput: 'error: expected \';\' before return statement'
    }
  })
  console.log(`✅ Updated ${compileErrors.count} compilation_error submissions`)
  
  // Runtime errors
  const runtimeErrors = await prisma.submission.updateMany({
    where: {
      status: 'runtime_error',
      stderr: null
    },
    data: {
      stderr: 'Runtime Error: array index out of bounds at line 15'
    }
  })
  console.log(`✅ Updated ${runtimeErrors.count} runtime_error submissions`)
  
  // Wrong answer - these will use logic error API, no need to update
  const wrongAnswers = await prisma.submission.count({
    where: { status: 'wrong_answer' }
  })
  console.log(`ℹ️  ${wrongAnswers} wrong_answer submissions (will use logic error API)`)
  
  // TLE - no error message needed, rule-based handles it
  const tleCount = await prisma.submission.count({
    where: { status: 'time_limit_exceeded' }
  })
  console.log(`ℹ️  ${tleCount} time_limit_exceeded submissions (rule-based classification)`)
  
  console.log('\n✅ Update complete!')
}

updateSubmissionsWithErrors()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Update failed:', e)
    prisma.$disconnect()
    process.exit(1)
  })
