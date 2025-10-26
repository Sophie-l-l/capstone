import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding sample submissions and BKT states...')

  const email = 'test@example.com'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error('Test user not found. Make sure prisma/seed.ts was run.')
    process.exit(1)
  }

  // Helper to fetch problem and its test case count
  async function problemMeta(id: string) {
    const p = await prisma.problem.findUnique({ where: { id }, include: { testCases: true } })
    if (!p) throw new Error(`Problem ${id} not found`)
    return { id: p.id, testCaseCount: p.testCases.length }
  }

  // Create a mix of accepted and failed submissions
  const problemsToSeed = ['1', '2']
  for (const pid of problemsToSeed) {
    const meta = await problemMeta(pid)

    // Accepted submission
    const accepted = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId: meta.id,
        code: '// accepted solution (seeded)',
        language: 'javascript',
        status: 'accepted',
        testCasesPassed: meta.testCaseCount,
        totalTestCases: meta.testCaseCount,
        runtime: 0.12,
        memory: 1200
      }
    })
    console.log('Created accepted submission', accepted.id, 'for problem', pid)

    // Wrong answer submission
    const wrong = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId: meta.id,
        code: '# wrong answer (seeded)',
        language: 'python',
        status: 'wrong_answer',
        testCasesPassed: 0,
        totalTestCases: meta.testCaseCount,
        runtime: 0.05,
        memory: 800
      }
    })
    console.log('Created wrong-answer submission', wrong.id, 'for problem', pid)
  }

  // Create some BKT states for knowledge components
  const kcNames = ['arrays', 'hash_maps', 'two_pointers']
  for (const name of kcNames) {
    const kc = await prisma.knowledgeComponent.findUnique({ where: { name } })
    if (!kc) {
      console.warn('Knowledge component not found:', name)
      continue
    }

    const pKnown = name === 'arrays' ? 0.85 : name === 'hash_maps' ? 0.6 : 0.4

    const bkt = await prisma.bKTState.upsert({
      where: { userId_kcId: { userId: user.id, kcId: kc.id } },
      update: { pKnown, attempts: 3, corrects: Math.round(pKnown * 3), lastUpdated: new Date() },
      create: { userId: user.id, kcId: kc.id, pKnown, attempts: 3, corrects: Math.round(pKnown * 3) }
    })

    console.log('Upserted BKT state for', name, 'pKnown=', bkt.pKnown)
  }

  // Update problem statistics (totalSubmissions & acceptanceRate) for seeded problems
  for (const pid of ['1', '2']) {
    const total = await prisma.submission.count({ where: { problemId: pid } })
    const accepted = await prisma.submission.count({ where: { problemId: pid, status: 'accepted' } })
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0

    await prisma.problem.update({ where: { id: pid }, data: { totalSubmissions: total, acceptanceRate } })
    console.log('Updated problem', pid, 'totalSubmissions=', total, 'acceptanceRate=', acceptanceRate)
  }

  console.log('✅ Sample submissions and BKT states seeded.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seeding sample data failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
