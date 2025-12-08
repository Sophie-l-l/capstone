/**
 * One-time migration script to sync all Knowledge Components from problems
 * to the KnowledgeComponent table for BKT tracking
 * 
 * Run with: npx ts-node scripts/sync-knowledge-components.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncKnowledgeComponents() {
  console.log("🔄 Starting Knowledge Component sync...\n");

  try {
    // Get all problems with their knowledge components
    const problems = await prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        knowledgeComponents: true
      }
    });

    console.log(`📊 Found ${problems.length} problems\n`);

    // Collect all unique KC names from all problems
    const allKCNames = new Set<string>();
    
    for (const problem of problems) {
      if (problem.knowledgeComponents && Array.isArray(problem.knowledgeComponents)) {
        for (const kcName of problem.knowledgeComponents) {
          if (kcName && typeof kcName === 'string' && kcName.trim()) {
            allKCNames.add(kcName.trim());
          }
        }
      }
    }

    console.log(`🔍 Found ${allKCNames.size} unique knowledge components across all problems:\n`);
    Array.from(allKCNames).sort().forEach((kc, i) => {
      console.log(`   ${i + 1}. ${kc}`);
    });
    console.log();

    // Check which KCs already exist in the table
    const existingKCs = await prisma.knowledgeComponent.findMany({
      select: { name: true }
    });
    const existingKCNames = new Set(existingKCs.map(kc => kc.name));

    console.log(`✅ ${existingKCNames.size} KCs already exist in database\n`);

    // Create missing KCs
    let created = 0;
    for (const kcName of allKCNames) {
      if (!existingKCNames.has(kcName)) {
        await prisma.knowledgeComponent.create({
          data: {
            name: kcName,
            description: `Knowledge component: ${kcName}`
          }
        });
        console.log(`   ➕ Created: ${kcName}`);
        created++;
      }
    }

    if (created === 0) {
      console.log("   ℹ️  No new KCs to create - all are already in database\n");
    } else {
      console.log(`\n✨ Created ${created} new Knowledge Components\n`);
    }

    // Summary
    const finalKCs = await prisma.knowledgeComponent.findMany({
      select: { name: true }
    });

    console.log("═".repeat(60));
    console.log("📈 SYNC COMPLETE");
    console.log("═".repeat(60));
    console.log(`Total KCs in database: ${finalKCs.length}`);
    console.log(`KCs created this run: ${created}`);
    console.log(`KCs already existed: ${existingKCNames.size}`);
    console.log("═".repeat(60));
    console.log("\n✅ All Problem.knowledgeComponents are now synced to KnowledgeComponent table");
    console.log("🎯 BKT tracking will now work for all knowledge components\n");

  } catch (error) {
    console.error("\n❌ Error during sync:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
syncKnowledgeComponents()
  .then(() => {
    console.log("✅ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
