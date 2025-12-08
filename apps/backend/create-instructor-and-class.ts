/**
 * Create instructor account and enroll test student in a class
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🎓 Creating Instructor Account and Class');
  console.log('==========================================\n');

  // Create instructor user
  const instructorPassword = 'instructor123';
  const instructorPasswordHash = await bcrypt.hash(instructorPassword, 10);

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@example.com' },
    update: {
      role: 'instructor',
      passwordHash: instructorPasswordHash,
    },
    create: {
      username: 'instructor',
      email: 'instructor@example.com',
      name: 'Dr. Jane Smith',
      passwordHash: instructorPasswordHash,
      role: 'instructor',
      bio: 'Computer Science Professor specializing in Data Structures and Algorithms',
      location: 'University Campus',
    },
  });

  console.log('✅ Instructor created:');
  console.log(`   Email: instructor@example.com`);
  console.log(`   Password: instructor123`);
  console.log(`   ID: ${instructor.id}\n`);

  // Find or create test student
  const student = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!student) {
    console.log('❌ Test student not found. Please create test@example.com first.');
    return;
  }

  console.log('✅ Found test student:');
  console.log(`   Email: ${student.email}`);
  console.log(`   Name: ${student.name}`);
  console.log(`   ID: ${student.id}\n`);

  // Create a class
  const classData = await prisma.class.upsert({
    where: { code: 'CS201-FALL2025' },
    update: {},
    create: {
      name: 'Data Structures and Algorithms',
      code: 'CS201-FALL2025',
      description: 'Introduction to fundamental data structures and algorithms with hands-on coding practice',
      semester: 'Fall 2025',
      instructorId: instructor.id,
    },
  });

  console.log('✅ Class created:');
  console.log(`   Name: ${classData.name}`);
  console.log(`   Code: ${classData.code}`);
  console.log(`   Semester: ${classData.semester}`);
  console.log(`   ID: ${classData.id}\n`);

  // Enroll student in class
  const enrollment = await prisma.classEnrollment.upsert({
    where: {
      classId_studentId: {
        classId: classData.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      classId: classData.id,
      studentId: student.id,
    },
  });

  console.log('✅ Student enrolled in class:');
  console.log(`   Class: ${classData.name}`);
  console.log(`   Student: ${student.name}`);
  console.log(`   Enrollment ID: ${enrollment.id}\n`);

  console.log('🎉 Setup Complete!');
  console.log('\n📋 Login Credentials:');
  console.log('   Instructor:');
  console.log('   - Email: instructor@example.com');
  console.log('   - Password: instructor123');
  console.log('\n   Student:');
  console.log('   - Email: test@example.com');
  console.log('   - Password: password123');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
