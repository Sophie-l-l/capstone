const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const updatedUser = await prisma.user.update({
    where: { email: 'test@example.com' },
    data: { role: 'instructor' }
  });
  
  console.log('Updated user:', updatedUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
