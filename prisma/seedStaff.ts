import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old staff accounts and creating the 4 authorized profiles...');

  // 1. Delete old test accounts
  await prisma.user.deleteMany({});

  // 2. Create the exact 4 roles
  const users = [
    {
      name: 'Owner (Admin)',
      pin: '0000',
      role: 'OWNER' as const,
      isActive: true,
    },
    {
      name: 'Resto Manager',
      pin: '1111',
      role: 'RESTO_MANAGER' as const,
      isActive: true,
    },
    {
      name: 'Bar Manager',
      pin: '2222',
      role: 'BAR_MANAGER' as const,
      isActive: true,
    },
    {
      name: 'Head Chef',
      pin: '3333',
      role: 'CHEF' as const,
      isActive: true,
    },
  ];

  for (const u of users) {
    const created = await prisma.user.create({
      data: u,
    });
    console.log(`✓ Active: ${created.name} | PIN: ${created.pin} | Role: ${created.role}`);
  }

  console.log('All 4 profiles are now saved in PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });