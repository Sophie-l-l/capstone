// Script to find and remove submissions with "Unknown" surface_error
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findAndRemoveUnknownSubmissions() {
  console.log('🔍 Searching for error signatures with "Unknown" surface_error...\n')
  
  try {
    // Find all error signatures with "Unknown" surfaceError
    const unknownErrors = await prisma.errorSignature.findMany({
      where: {
        surfaceError: 'Unknown'
      }
    })
    
    console.log(`❌ Found ${unknownErrors.length} error signatures with "Unknown" surface_error\n`)
    
    if (unknownErrors.length === 0) {
      console.log('✅ No "Unknown" error signatures found!')
    } else {
      // Display details
      console.log('Details:')
      unknownErrors.forEach((error: any, index: number) => {
        console.log(`\n${index + 1}. ErrorSignature ID: ${error.id}`)
        console.log(`   Hash: ${error.hash}`)
        console.log(`   Surface Error: ${error.surfaceError}`)
        console.log(`   Specific Error: ${error.specificError}`)
        console.log(`   Cognitive Cause: ${error.cognitiveCause}`)
        console.log(`   Bloom Level: ${error.bloomLevel}`)
        console.log(`   Created: ${error.createdAt}`)
      })
      
      // Delete these error signatures (this will cascade delete SubmissionErrors via onDelete: Cascade)
      console.log(`\n🗑️  Deleting ${unknownErrors.length} error signatures with "Unknown" surface_error...`)
      
      const deleteResult = await prisma.errorSignature.deleteMany({
        where: {
          surfaceError: 'Unknown'
        }
      })
      
      console.log(`✅ Deleted ${deleteResult.count} error signatures with "Unknown" surface_error`)
    }
    
    // Check for any other invalid surface errors
    console.log('\n🔍 Checking for other potentially invalid surface errors...')
    
    const validSurfaceErrors = [
      'Lexical',
      'Syntax',
      'Semantic/Type',
      'Semantic/Link',
      'Link/Binding',
      'Runtime/Exception',
      'Functional/Logic',
      'Quality/Non-Functional',
      'Concurrency/Timing',
      'Environment/Deployment',
      'Security/Weakness',
      'Build/Configuration'
    ]
    
    const allErrors = await prisma.errorSignature.findMany({
      select: {
        surfaceError: true
      },
      distinct: ['surfaceError']
    })
    
    const invalidErrors = allErrors.filter((e: any) => !validSurfaceErrors.includes(e.surfaceError))
    
    if (invalidErrors.length > 0) {
      console.log('\n⚠️  Found other invalid surface errors:')
      invalidErrors.forEach((e: any) => {
        console.log(`   - "${e.surfaceError}"`)
      })
      
      // Count how many submissions have each invalid error
      for (const error of invalidErrors) {
        const count = await prisma.errorSignature.count({
          where: { surfaceError: error.surfaceError }
        })
        console.log(`     (${count} error signatures)`)
      }
    } else {
      console.log('✅ All remaining surface errors are valid!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findAndRemoveUnknownSubmissions()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
