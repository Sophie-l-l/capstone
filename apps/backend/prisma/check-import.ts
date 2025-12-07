import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImport() {
  const testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })
  
  if (!testUser) {
    console.log('❌ Test user not found')
    return
  }
  
  const submissionCount = await prisma.submission.count({
    where: { userId: testUser.id }
  })
  
  const bktStateCount = await prisma.bKTState.count({
    where: { userId: testUser.id }
  })
  
  const statusDistribution = await prisma.submission.groupBy({
    by: ['status'],
    where: { userId: testUser.id },
    _count: true
  })
  
  console.log('\n✅ Import Verification:')
  console.log(`   Test user: test@example.com`)
  console.log(`   User ID: ${testUser.id}`)
  console.log(`   Total submissions: ${submissionCount}`)
  console.log(`   BKT states: ${bktStateCount}`)
  console.log('\n📊 Submission Status Distribution:')
  statusDistribution.forEach(stat => {
    console.log(`   ${stat.status}: ${stat._count}`)
  })
  
  await prisma.$disconnect()
}

checkImport()
