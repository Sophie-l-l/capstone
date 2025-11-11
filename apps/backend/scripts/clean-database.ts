/**
 * Clean Database Script
 * 
 * This script will delete ALL data from:
 * - Submissions
 * - SubmissionErrors
 * - ErrorSignatures
 * - ErrorClusters
 * 
 * ⚠️ WARNING: This is IRREVERSIBLE! Use only in development.
 * 
 * Usage:
 *   npx ts-node scripts/clean-database.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Step 1: Delete all submissions (will cascade to submission_errors)
    console.log('📝 Deleting all submissions...');
    const deletedSubmissions = await prisma.submission.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSubmissions.count} submissions`);
    console.log('   ✅ Cascade deleted submission_errors');

    // Step 2: Delete all error signatures
    console.log('\n🔍 Deleting all error signatures...');
    const deletedSignatures = await prisma.errorSignature.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSignatures.count} error signatures`);

    // Step 3: Delete all error clusters
    console.log('\n📊 Deleting all error clusters...');
    const deletedClusters = await prisma.errorCluster.deleteMany({});
    console.log(`   ✅ Deleted ${deletedClusters.count} error clusters`);

    console.log('\n✨ Database cleanup complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Submissions: ${deletedSubmissions.count} deleted`);
    console.log(`   • Error Signatures: ${deletedSignatures.count} deleted`);
    console.log(`   • Error Clusters: ${deletedClusters.count} deleted`);
    console.log(`   • Submission Errors: deleted via cascade`);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
