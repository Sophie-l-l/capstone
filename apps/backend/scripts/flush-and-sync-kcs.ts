import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function flushAndSyncKCs() {
  console.log('\n🔄 FLUSHING AND SYNCING KNOWLEDGE COMPONENTS\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get all unique KCs from problems
    const problems = await prisma.problem.findMany({
      select: { id: true, title: true, knowledgeComponents: true }
    });

    console.log(`\n📚 Found ${problems.length} problems`);

    // Collect all unique KCs
    const allKCs = new Set<string>();
    problems.forEach(p => {
      p.knowledgeComponents.forEach(kc => {
        if (kc && kc.trim()) {
          allKCs.add(kc.trim());
        }
      });
    });

    console.log(`\n🔍 Found ${allKCs.size} unique knowledge components in problems:`);
    Array.from(allKCs).sort().forEach(kc => console.log(`   - ${kc}`));

    // Step 2: Check current KnowledgeComponent table
    const existingKCs = await prisma.knowledgeComponent.findMany();
    console.log(`\n📊 Current KnowledgeComponent table has ${existingKCs.length} entries`);

    // Step 3: Delete ALL existing KCs from the table
    console.log('\n🗑️  Flushing KnowledgeComponent table...');
    
    // First, need to delete all BKTState records that reference these KCs
    const bktCount = await prisma.bKTState.count();
    if (bktCount > 0) {
      console.log(`   ⚠️  Found ${bktCount} BKT states - deleting to prevent foreign key violations...`);
      await prisma.bKTState.deleteMany({});
      console.log(`   ✅ Deleted ${bktCount} BKT states`);
    }

    const deleteResult = await prisma.knowledgeComponent.deleteMany({});
    console.log(`   ✅ Deleted ${deleteResult.count} knowledge components`);

    // Step 4: Insert all KCs from problems
    console.log('\n➕ Creating new KnowledgeComponent entries...');
    
    let created = 0;
    for (const kcName of Array.from(allKCs).sort()) {
      await prisma.knowledgeComponent.create({
        data: {
          name: kcName,
          description: `Knowledge component: ${kcName}`
        }
      });
      created++;
      console.log(`   ✅ Created: ${kcName}`);
    }

    console.log(`\n✨ Successfully created ${created} knowledge components`);

    // Step 5: Verify the sync
    const finalKCs = await prisma.knowledgeComponent.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📈 SYNC COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total problems: ${problems.length}`);
    console.log(`Unique KCs in problems: ${allKCs.size}`);
    console.log(`KCs in database: ${finalKCs.length}`);
    console.log(`BKT states cleared: ${bktCount} (will be recreated on next submissions)`);
    console.log('='.repeat(60));

    console.log('\n✅ KnowledgeComponent table is now perfectly synced with problems!');
    console.log('💡 BKT states will be automatically created when students submit solutions.');

    // Show mapping
    console.log('\n📋 Problems and their KCs:');
    problems.forEach(p => {
      if (p.knowledgeComponents.length > 0) {
        console.log(`   - ${p.title}: [${p.knowledgeComponents.join(', ')}]`);
      }
    });

  } catch (error) {
    console.error('\n❌ Error during sync:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

flushAndSyncKCs().catch(console.error);
