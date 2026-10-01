import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding exact table configuration: Restaurant (6 tables) & Bar (15 tables)...');

  // Find or create Sections
  let restoSection = await prisma.section.findFirst({ where: { name: 'Restaurant' } });
  if (!restoSection) {
    restoSection = await prisma.section.create({ data: { name: 'Restaurant' } });
  }

  let barSection = await prisma.section.findFirst({ where: { name: 'Bar' } });
  if (!barSection) {
    barSection = await prisma.section.create({ data: { name: 'Bar' } });
  }

  // 1. Restaurant Tables: R-01 to R-06
  for (let i = 1; i <= 6; i++) {
    const tableNumber = `R-0${i}`;
    await prisma.table.upsert({
      where: { tableNumber },
      update: { sectionId: restoSection.id, capacity: i % 2 === 0 ? 6 : 4 },
      create: {
        tableNumber,
        capacity: i % 2 === 0 ? 6 : 4,
        sectionId: restoSection.id,
      },
    });
  }

  // 2. Bar Tables: B-01 to B-15
  for (let i = 1; i <= 15; i++) {
    const tableNumber = i < 10 ? `B-0${i}` : `B-${i}`;
    await prisma.table.upsert({
      where: { tableNumber },
      update: { sectionId: barSection.id, capacity: i <= 5 ? 2 : 4 },
      create: {
        tableNumber,
        capacity: i <= 5 ? 2 : 4,
        sectionId: barSection.id,
      },
    });
  }

  console.log('Tables successfully synced: 6 Restaurant tables and 15 Bar tables created!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });