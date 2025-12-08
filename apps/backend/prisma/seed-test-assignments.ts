import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTestData() {
  console.log('🌱 Seeding test data for assignments feature...\n')

  try {
    // 1. Fix test@example.com role (should be student, not instructor)
    const testStudent = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (testStudent && testStudent.role === 'instructor') {
      console.log('🔧 Fixing test@example.com role from instructor to student...')
      await prisma.user.update({
        where: { email: 'test@example.com' },
        data: { role: 'student' }
      })
      console.log('✅ Role updated to student\n')
    }

    // 2. Get instructor and student
    const instructor = await prisma.user.findUnique({
      where: { email: 'instructor@example.com' }
    })

    const student = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (!instructor) {
      console.log('❌ Instructor not found (instructor@example.com)')
      return
    }

    if (!student) {
      console.log('❌ Student not found (test@example.com)')
      return
    }

    console.log(`👨‍🏫 Instructor: ${instructor.name} (${instructor.email})`)
    console.log(`👨‍🎓 Student: ${student.name} (${student.email})\n`)

    // 3. Get or create the test class
    let testClass = await prisma.class.findFirst({
      where: {
        code: 'CS201-FALL2025',
        instructorId: instructor.id
      }
    })

    if (!testClass) {
      console.log('📚 Creating test class...')
      testClass = await prisma.class.create({
        data: {
          name: 'Data Structures and Algorithms',
          code: 'CS201-FALL2025',
          description: 'Introduction to fundamental data structures and algorithms',
          semester: 'Fall 2025',
          instructorId: instructor.id
        }
      })
      console.log(`✅ Class created: ${testClass.name} (${testClass.code})\n`)
    } else {
      console.log(`✅ Class exists: ${testClass.name} (${testClass.code})\n`)
    }

    // 4. Ensure student is enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: testClass.id,
          studentId: student.id
        }
      }
    })

    if (!existingEnrollment) {
      console.log('📝 Enrolling student in class...')
      await prisma.classEnrollment.create({
        data: {
          classId: testClass.id,
          studentId: student.id
        }
      })
      console.log(`✅ ${student.name} enrolled in ${testClass.name}\n`)
    } else {
      console.log(`✅ ${student.name} already enrolled in ${testClass.name}\n`)
    }

    // 5. Get some problems to assign
    const problems = await prisma.problem.findMany({
      take: 5,
      orderBy: { difficulty: 'asc' }
    })

    if (problems.length === 0) {
      console.log('❌ No problems found in database. Please run the main seed script first.')
      return
    }

    console.log(`📖 Found ${problems.length} problems to assign\n`)

    // 6. Create problem sets (assignments)
    const assignments = [
      {
        title: 'Week 1: Basic Data Structures',
        description: 'Practice with arrays and hash tables',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        problemIds: problems.slice(0, 2).map(p => p.id)
      },
      {
        title: 'Week 2: String Manipulation',
        description: 'Work on string algorithms and two-pointer techniques',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        problemIds: problems.slice(2, 4).map(p => p.id)
      },
      {
        title: 'Midterm Practice',
        description: 'Comprehensive review of all topics covered',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        problemIds: problems.slice(0, 5).map(p => p.id)
      }
    ]

    console.log('📚 Creating assignments...')
    for (const assignment of assignments) {
      // Check if assignment already exists
      const existing = await prisma.problemSet.findFirst({
        where: {
          title: assignment.title,
          classId: testClass.id
        }
      })

      if (existing) {
        console.log(`  ⏭️  Skipping "${assignment.title}" (already exists)`)
        continue
      }

      const problemSet = await prisma.problemSet.create({
        data: {
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          classId: testClass.id,
          problems: {
            create: assignment.problemIds.map((problemId, index) => ({
              problemId,
              order: index
            }))
          }
        },
        include: {
          problems: {
            include: {
              problem: {
                select: { title: true }
              }
            }
          }
        }
      })

      console.log(`  ✅ Created "${problemSet.title}" - ${problemSet.problems.length} problems, due ${problemSet.dueDate ? problemSet.dueDate.toLocaleDateString() : 'N/A'}`)
    }

    console.log('\n🎉 Test data seeding complete!')
    console.log('\n📊 Summary:')
    console.log(`  - Instructor: ${instructor.email}`)
    console.log(`  - Student: ${student.email}`)
    console.log(`  - Class: ${testClass.code} - ${testClass.name}`)
    console.log(`  - Assignments: ${assignments.length}`)
    console.log('\n✨ Students can now see assignments in:')
    console.log('  - Dashboard widget (My Assignments)')
    console.log('  - /assignments page')
    console.log('  - Problem badges on /problems page')
    console.log('\n✨ Instructors can see:')
    console.log('  - Classes on /dashboard/instructor/classes')
    console.log('  - Class details with assignments')

  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTestData()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
