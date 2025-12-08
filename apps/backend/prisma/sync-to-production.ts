/**
 * Sync problems from local to production using backend service
 * This runs through the backend which already has production DB credentials
 */

import { PrismaClient } from '@prisma/client';

// Local database (Docker)
const localPrisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:postgres@localhost:5432/educode'
});

// Production database (Cloud SQL via proxy on port 5433)
const prodPrisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres:EduCode2025SecureDB!@localhost:5433/educode'
});

async function syncProblems() {
  console.log('🔄 Syncing Problems from Local to Production');
  console.log('=============================================\n');
  
  // Get all problems from local
  console.log('📥 Fetching problems from local Docker database...');
  const localProblems = await localPrisma.problem.findMany({
    select: {
      title: true,
      description: true,
      difficulty: true,
      inputFormat: true,
      outputFormat: true,
      constraints: true,
      topics: true,
      knowledgeComponents: true,
      timeLimit: true,
      memoryLimit: true,
      acceptanceRate: true,
      totalSubmissions: true,
      source: true
    }
  });
  
  console.log(`✅ Found ${localProblems.length} problems locally\n`);
  
  // Check production
  console.log('📊 Checking production database...');
  const prodCount = await prodPrisma.problem.count();
  console.log(`   Current production problems: ${prodCount}\n`);
  
  // Import to production
  console.log('📤 Importing to production...');
  let imported = 0;
  let skipped = 0;
  
  for (const problem of localProblems) {
    try {
      await prodPrisma.problem.create({
        data: problem
      });
      imported++;
      
      if (imported % 10 === 0) {
        console.log(`   Progress: ${imported}/${localProblems.length}`);
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        skipped++; // Duplicate - already exists
      } else {
        console.error(`❌ Error importing "${problem.title}":`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Sync complete!`);
  console.log(`   Imported: ${imported} problems`);
  console.log(`   Skipped: ${skipped} problems (already existed)`);
  
  // Final counts
  const finalProdCount = await prodPrisma.problem.count();
  console.log(`   Total in production: ${finalProdCount}\n`);
  
  // Show distribution
  const distribution = await prodPrisma.$queryRaw`
    SELECT difficulty, COUNT(*) as count 
    FROM problems 
    GROUP BY difficulty 
    ORDER BY difficulty
  `;
  
  console.log('📊 Production Database Distribution:');
  console.table(distribution);
}

async function main() {
  try {
    await syncProblems();
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

main();
