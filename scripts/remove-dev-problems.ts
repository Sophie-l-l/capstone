#!/usr/bin/env npx ts-node
import { PrismaClient } from '@prisma/client';

// Connect to production database via proxy
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EduCode2025SecureDB!@localhost:5433/educode'
    }
  }
});

async function removeDevProblems() {
  console.log('🗑️  Removing "Dev Problem" entries...\n');

  try {
    // Find all problems named "Dev Problem"
    const devProblems = await prisma.problem.findMany({
      where: {
        title: 'Dev Problem'
      },
      include: {
        testCases: true,
        submissions: true
      }
    });

    console.log(`Found ${devProblems.length} "Dev Problem" entries:\n`);

    for (const problem of devProblems) {
      console.log(`📋 Problem ID: ${problem.id}`);
      console.log(`   - Test cases: ${problem.testCases.length}`);
      console.log(`   - Submissions: ${problem.submissions.length}`);
      
      // Delete test cases first (foreign key constraint)
      if (problem.testCases.length > 0) {
        await prisma.testCase.deleteMany({
          where: { problemId: problem.id }
        });
        console.log(`   ✅ Deleted ${problem.testCases.length} test cases`);
      }

      // Delete submissions
      if (problem.submissions.length > 0) {
        await prisma.submission.deleteMany({
          where: { problemId: problem.id }
        });
        console.log(`   ✅ Deleted ${problem.submissions.length} submissions`);
      }

      // Delete the problem
      await prisma.problem.delete({
        where: { id: problem.id }
      });
      console.log(`   ✅ Deleted problem\n`);
    }

    console.log(`\n✅ Successfully removed ${devProblems.length} "Dev Problem" entries`);

    // Show updated count
    const totalProblems = await prisma.problem.count();
    console.log(`📊 Total problems remaining: ${totalProblems}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  try {
    await removeDevProblems();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
