import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listClasses() {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        semester: true,
        _count: {
          select: {
            enrollments: true,
            problemSets: true
          }
        }
      }
    });

    console.log(`\n📚 Found ${classes.length} classes:\n`);
    classes.forEach((cls, i) => {
      console.log(`${i + 1}. ${cls.name}`);
      console.log(`   ID: ${cls.id}`);
      console.log(`   Code: ${cls.code || 'N/A'}`);
      console.log(`   Semester: ${cls.semester || 'N/A'}`);
      console.log(`   Enrollments: ${cls._count.enrollments}`);
      console.log(`   Problem Sets: ${cls._count.problemSets}\n`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listClasses();
