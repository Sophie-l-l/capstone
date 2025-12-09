import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  console.log('\n📊 CHECKING DATABASE STATE FOR KC MASTERY\n');
  console.log('='.repeat(60));
  
  // Check users
  const users = await prisma.user.findMany({ 
    select: { id: true, email: true, name: true, role: true } 
  });
  console.log('\n👥 Users:');
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) - ${u.role} - ID: ${u.id.substring(0, 8)}...`));
  
  // Check Knowledge Components
  const kcs = await prisma.knowledgeComponent.findMany();
  console.log(`\n🧠 Knowledge Components: ${kcs.length}`);
  kcs.forEach(kc => console.log(`  - ${kc.name}`));
  
  // Check BKT States
  const bktStates = await prisma.bKTState.findMany({
    include: { 
      kc: { select: { name: true } },
      user: { select: { name: true, email: true } }
    }
  });
  console.log(`\n📈 BKT States: ${bktStates.length}`);
  if (bktStates.length === 0) {
    console.log('  ⚠️  NO BKT STATES FOUND! This is why mastery shows 0%');
  } else {
    bktStates.forEach(b => console.log(`  - ${b.user.name}: ${b.kc.name} = ${(b.pKnown * 100).toFixed(1)}%`));
  }
  
  // Check submissions
  const submissions = await prisma.submission.findMany({
    include: {
      user: { select: { name: true } },
      problem: { select: { title: true, knowledgeComponents: true } }
    },
    orderBy: { submittedAt: 'desc' },
    take: 10
  });
  
  console.log(`\n📝 Recent Submissions (last 10):`);
  submissions.forEach(s => {
    console.log(`  - ${s.user.name}: ${s.problem.title} (${s.status})`);
    console.log(`    KCs: ${s.problem.knowledgeComponents.join(', ')}`);
  });
  
  // Check if problems have KCs
  const problems = await prisma.problem.findMany({
    select: { id: true, title: true, knowledgeComponents: true }
  });
  console.log(`\n📚 Problems and their KCs:`);
  problems.forEach(p => {
    console.log(`  - ${p.title}: [${p.knowledgeComponents.join(', ')}]`);
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
