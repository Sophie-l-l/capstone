import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteClass() {
  try {
    // Find class with name "(0)"
    const classToDelete = await prisma.class.findFirst({
      where: { name: "(0)" }
    });

    if (!classToDelete) {
      console.log("❌ Class '(0)' not found");
      return;
    }

    console.log(`Found class: ${classToDelete.name} (ID: ${classToDelete.id})`);

    // Delete enrollments first (due to foreign key constraints)
    const deletedEnrollments = await prisma.classEnrollment.deleteMany({
      where: { classId: classToDelete.id }
    });
    console.log(`✅ Deleted ${deletedEnrollments.count} enrollments`);

    // Delete problem sets
    const deletedProblemSets = await prisma.problemSet.deleteMany({
      where: { classId: classToDelete.id }
    });
    console.log(`✅ Deleted ${deletedProblemSets.count} problem sets`);

    // Delete the class
    await prisma.class.delete({
      where: { id: classToDelete.id }
    });
    console.log(`✅ Deleted class '(0)'`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteClass();
