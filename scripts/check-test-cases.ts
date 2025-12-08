#!/usr/bin/env npx ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database tables...\n');

  // Check problem_sets
  const problemSets = await prisma.problemSet.findMany();
  console.log('📚 Problem Sets:', problemSets.length);
  
  // Check problem_set_items
  const problemSetItems = await prisma.problemSetItem.findMany({
    include: {
      problem: { select: { title: true } },
      problemSet: { select: { title: true } }
    }
  });
  console.log('📋 Problem Set Items:', problemSetItems.length);
  if (problemSetItems.length > 0) {
    problemSetItems.slice(0, 5).forEach(item => {
      console.log(`  - ${item.problemSet.title} > ${item.problem.title}`);
    });
  }

  // Check problems and their test cases
  const problems = await prisma.problem.findMany({
    include: {
      testCases: true,
      _count: {
        select: { testCases: true }
      }
    },
    orderBy: { title: 'asc' }
  });

  console.log('\n📝 Problems:', problems.length);
  
  const withTestCases = problems.filter(p => p._count.testCases > 0);
  const withoutTestCases = problems.filter(p => p._count.testCases === 0);

  console.log(`  ✅ With test cases: ${withTestCases.length}`);
  console.log(`  ❌ Without test cases: ${withoutTestCases.length}\n`);

  if (withTestCases.length > 0) {
    console.log('Problems WITH test cases:');
    withTestCases.forEach(p => {
      console.log(`  ✅ ${p.title} (${p._count.testCases} test cases)`);
    });
  }

  if (withoutTestCases.length > 0) {
    console.log('\n⚠️  Problems WITHOUT test cases:');
    withoutTestCases.forEach(p => {
      console.log(`  ❌ ${p.title} [${p.difficulty}]`);
    });
  }

  // Summary statistics
  console.log('\n📊 Summary:');
  console.log(`  Total problems: ${problems.length}`);
  console.log(`  With test cases: ${withTestCases.length} (${((withTestCases.length/problems.length)*100).toFixed(1)}%)`);
  console.log(`  Without test cases: ${withoutTestCases.length} (${((withoutTestCases.length/problems.length)*100).toFixed(1)}%)`);
  console.log(`  Total test cases: ${problems.reduce((sum, p) => sum + p._count.testCases, 0)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
