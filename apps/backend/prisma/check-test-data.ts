import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTestData() {
  console.log('📊 Checking current test data in database...\n')

  // Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  })
  console.log('👥 Users:')
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) - ${u.role}`))
  console.log()

  // Check classes
  const classes = await prisma.class.findMany({
    include: {
      instructor: {
        select: { name: true, email: true }
      },
      _count: {
        select: {
          enrollments: true,
          problemSets: true
        }
      }
    }
  })
  console.log('🏫 Classes:')
  if (classes.length === 0) {
    console.log('  ❌ No classes found')
  } else {
    classes.forEach(c => console.log(`  - ${c.name} (${c.code}) by ${c.instructor.name} - ${c._count.enrollments} students, ${c._count.problemSets} assignments`))
  }
  console.log()

  // Check enrollments
  const enrollments = await prisma.classEnrollment.findMany({
    include: {
      student: {
        select: { name: true, email: true }
      },
      class: {
        select: { name: true, code: true }
      }
    }
  })
  console.log('📝 Class Enrollments:')
  if (enrollments.length === 0) {
    console.log('  ❌ No enrollments found')
  } else {
    enrollments.forEach(e => console.log(`  - ${e.student.name} enrolled in ${e.class.name} (${e.class.code})`))
  }
  console.log()

  // Check problem sets (assignments)
  const problemSets = await prisma.problemSet.findMany({
    include: {
      class: {
        select: { name: true }
      },
      _count: {
        select: { problems: true }
      }
    }
  })
  console.log('📚 Assignments (Problem Sets):')
  if (problemSets.length === 0) {
    console.log('  ❌ No assignments found')
  } else {
    problemSets.forEach(ps => console.log(`  - "${ps.title}" for ${ps.class?.name || 'Unknown'} - ${ps._count.problems} problems, due ${ps.dueDate ? new Date(ps.dueDate).toLocaleDateString() : 'N/A'}`))
  }
  console.log()

  // Check problems
  const problemCount = await prisma.problem.count()
  console.log(`📖 Total Problems: ${problemCount}`)
  console.log()

  await prisma.$disconnect()
}

checkTestData()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
