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

async function main() {
  console.log('🔍 Checking PRODUCTION database...\n');

  try {
    // Check problems and their test cases
    const problems = await prisma.problem.findMany({
      include: {
        testCases: true
      },
      orderBy: { title: 'asc' }
    });

    console.log('📝 Total Problems:', problems.length);
    
    const withTestCases = problems.filter(p => p.testCases.length > 0);
    const withoutTestCases = problems.filter(p => p.testCases.length === 0);

    console.log(`  ✅ With test cases: ${withTestCases.length}`);
    console.log(`  ❌ Without test cases: ${withoutTestCases.length}\n`);

    if (withTestCases.length > 0) {
      console.log('✅ Problems WITH test cases:');
      withTestCases.forEach(p => {
        console.log(`  • ${p.title} (${p.testCases.length} test cases) [${p.difficulty}]`);
      });
    }

    if (withoutTestCases.length > 0) {
      console.log('\n❌ Problems WITHOUT test cases:');
      withoutTestCases.forEach(p => {
        console.log(`  • ${p.title} [${p.difficulty}] - ID: ${p.id}`);
      });
      
      console.log(`\n⚠️  WARNING: ${withoutTestCases.length} problems need test cases!`);
      console.log('   These problems will incorrectly accept ANY code as passing.\n');
    }

    // Summary
    console.log('📊 Summary:');
    console.log(`  Total problems: ${problems.length}`);
    console.log(`  With test cases: ${withTestCases.length} (${((withTestCases.length/problems.length)*100).toFixed(1)}%)`);
    console.log(`  Without test cases: ${withoutTestCases.length} (${((withoutTestCases.length/problems.length)*100).toFixed(1)}%)`);
    console.log(`  Total test cases: ${problems.reduce((sum, p) => sum + p.testCases.length, 0)}`);

  } catch (error: any) {
    console.error('❌ Error connecting to database:', error.message);
    console.error('\n💡 Make sure Cloud SQL Proxy is running:');
    console.error('   ./cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
