import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('👤 Creating test user...')

  const email = 'test@example.com'
  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      username: 'testuser',
      name: 'Test User',
      passwordHash: hashedPassword,
      role: 'student'
    }
  })

  console.log('✅ Test user created!')
  console.log('📧 Email:', email)
  console.log('🔑 Password:', password)
  console.log('👤 User ID:', user.id)
}

createTestUser()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ User creation failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })