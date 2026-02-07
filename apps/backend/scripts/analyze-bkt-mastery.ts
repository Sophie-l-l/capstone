import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function analyze() {
  const CLASS_ID = 'fc23d15b-ec48-4614-b5b5-6ee4100cdbdc';
  
  const classData = await prisma.class.findUnique({
    where: { id: CLASS_ID },
    include: {
      enrollments: {
        include: { student: { select: { id: true, name: true, email: true } } }
      }
    }
  });

  if (!classData) {
    console.log('Class not found');
    return;
  }
  
  const studentIds = classData.enrollments.map((e: any) => e.studentId);
  console.log('Students:', classData.enrollments.map((e: any) => e.student.email));
  
  const bktStates = await prisma.bKTState.findMany({
    where: { userId: { in: studentIds } },
    include: { kc: { select: { name: true } } },
    orderBy: { kc: { name: 'asc' } }
  });
  
  console.log('\nTotal BKT states:', bktStates.length);
  
  const byKC: Record<string, any[]> = {};
  for (const state of bktStates) {
    const kcName = state.kc.name;
    if (!byKC[kcName]) byKC[kcName] = [];
    byKC[kcName].push(state);
  }
  
  console.log('\n=== avgMastery Calculation Breakdown ===\n');
  
  const kcs = Object.keys(byKC).sort();
  for (const kcName of kcs) {
    const states = byKC[kcName] || [];
    if (states.length === 0) continue;
    const sum = states.reduce((s: number, st: any) => s + st.pKnown, 0);
    const avg = sum / states.length;
    
    console.log(`KC: ${kcName}`);
    console.log(`  Student count: ${states.length}`);
    console.log(`  pKnown values: [${states.map((s: any) => s.pKnown.toFixed(10)).join(', ')}]`);
    console.log(`  Sum of pKnown: ${sum}`);
    console.log(`  avgMastery = Sum / Count = ${sum} / ${states.length} = ${avg}`);
    console.log(`  Attempts/Corrects: [${states.map((s: any) => `${s.attempts}/${s.corrects}`).join(', ')}]`);
    console.log('');
  }
  
  await prisma.$disconnect();
}

analyze().catch(console.error);
