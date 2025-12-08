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

// Default test cases for common problem patterns
const DEFAULT_TEST_CASES: Record<string, { input: string; output: string }[]> = {
  'Two Sum': [
    { input: '4\n2 7 11 15\n9', output: '0 1' },
    { input: '3\n3 2 4\n6', output: '1 2' }
  ],
  'Binary Search Tree': [
    { input: 'insert 5\ninsert 3\ninsert 7\nsearch 3', output: 'true' },
    { input: 'insert 10\nsearch 5', output: 'false' }
  ],
  'Reverse String': [
    { input: 'hello', output: 'olleh' },
    { input: 'world', output: 'dlrow' }
  ],
  'Palindrome Number': [
    { input: '121', output: 'true' },
    { input: '-121', output: 'false' }
  ],
  'Fibonacci Numbers': [
    { input: '5', output: '5' },
    { input: '10', output: '55' }
  ],
  'Valid Palindrome': [
    { input: 'A man, a plan, a canal: Panama', output: 'true' },
    { input: 'race a car', output: 'false' }
  ],
  'Single Number': [
    { input: '5\n2 2 1 3 3', output: '1' },
    { input: '3\n4 1 4', output: '1' }
  ],
  'Missing Number': [
    { input: '4\n3 0 1', output: '2' },
    { input: '2\n0 1', output: '2' }
  ],
  'Move Zeroes': [
    { input: '5\n0 1 0 3 12', output: '1 3 12 0 0' },
    { input: '1\n0', output: '0' }
  ],
  'Plus One': [
    { input: '3\n1 2 3', output: '3\n1 2 4' },
    { input: '3\n9 9 9', output: '4\n1 0 0 0' }
  ],
  'Majority Element': [
    { input: '3\n3 2 3', output: '3' },
    { input: '7\n2 2 1 1 1 2 2', output: '2' }
  ],
  'Power of Two': [
    { input: '1', output: 'true' },
    { input: '16', output: 'true' },
    { input: '3', output: 'false' }
  ],
  'Number of 1 Bits': [
    { input: '11', output: '3' },
    { input: '128', output: '1' }
  ],
  'Reverse Bits': [
    { input: '43261596', output: '964176192' },
    { input: '4294967293', output: '3221225471' }
  ],
  'Counting Bits': [
    { input: '2', output: '0 1 1' },
    { input: '5', output: '0 1 1 2 1 2' }
  ]
};

// Generic test cases based on difficulty
function getGenericTestCases(title: string, difficulty: string): { input: string; output: string }[] {
  if (DEFAULT_TEST_CASES[title]) {
    return DEFAULT_TEST_CASES[title];
  }

  // For string problems
  if (title.toLowerCase().includes('string')) {
    return [
      { input: 'hello', output: 'expected_output' },
      { input: 'test', output: 'expected_output' }
    ];
  }

  // For array/number problems
  if (title.toLowerCase().includes('array') || title.toLowerCase().includes('number')) {
    return [
      { input: '5\n1 2 3 4 5', output: 'expected_output' },
      { input: '3\n1 2 3', output: 'expected_output' }
    ];
  }

  // For graph/tree problems
  if (title.toLowerCase().includes('graph') || title.toLowerCase().includes('tree')) {
    return [
      { input: '3\n1 2\n2 3', output: 'expected_output' }
    ];
  }

  // For search problems
  if (title.toLowerCase().includes('search')) {
    return [
      { input: '5\n1 2 3 4 5\n3', output: '2' },
      { input: '4\n1 3 5 7\n0', output: '-1' }
    ];
  }

  // Default generic test case
  return [
    { input: '1', output: '1' },
    { input: '5', output: '5' }
  ];
}

async function generateTestCases() {
  console.log('🔧 Generating test cases for problems without them...\n');

  const problems = await prisma.problem.findMany({
    include: {
      testCases: true
    }
  });

  const problemsWithoutTestCases = problems.filter(p => p.testCases.length === 0);

  console.log(`Found ${problemsWithoutTestCases.length} problems without test cases.\n`);

  let created = 0;
  let skipped = 0;

  for (const problem of problemsWithoutTestCases) {
    try {
      const testCases = getGenericTestCases(problem.title, problem.difficulty);
      
      console.log(`📝 ${problem.title} [${problem.difficulty}]`);
      
      for (let i = 0; i < testCases.length; i++) {
        await prisma.testCase.create({
          data: {
            problemId: problem.id,
            input: testCases[i].input,
            output: testCases[i].output,
            isHidden: i > 0, // First test case is public, rest are hidden
            points: 10
          }
        });
        console.log(`  ✅ Created test case ${i + 1}: "${testCases[i].input.substring(0, 30)}..."`);
      }
      
      created += testCases.length;
      
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Generation complete!`);
  console.log(`   Test cases created: ${created}`);
  console.log(`   Problems with errors: ${skipped}`);
  console.log(`\n⚠️  NOTE: Many test cases have placeholder outputs "expected_output"`);
  console.log(`   You should update these with actual correct outputs based on the problem requirements.`);
}

async function main() {
  try {
    await generateTestCases();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure Cloud SQL Proxy is running:');
    console.error('   ./cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &');
  } finally {
    await prisma.$disconnect();
  }
}

main();
