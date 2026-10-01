import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding categories...');

  const categories = [
    // --- Food / Kitchen Courses ---
    { name: 'Starters', station: 'KITCHEN' },
    { name: 'Main Course', station: 'KITCHEN' },
    { name: 'Rice & Biryani', station: 'KITCHEN' },
    { name: 'Breads / Roti', station: 'KITCHEN' },
    { name: 'Sidekicks & Accompaniments', station: 'KITCHEN' },
    { name: 'Extras', station: 'KITCHEN' },

    // --- Soft Beverages ---
    { name: 'Soft Drinks & Mocktails', station: 'BAR' },
    { name: 'Water & Soda', station: 'BAR' },

    // --- Alcohol Varieties ---
    { name: 'Beer', station: 'BAR' },
    { name: 'Whiskey', station: 'BAR' },
    { name: 'Rum', station: 'BAR' },
    { name: 'Vodka', station: 'BAR' },
    { name: 'Gin', station: 'BAR' },
    { name: 'Wine', station: 'BAR' },
    { name: 'Brandy / Cognac', station: 'BAR' },
    { name: 'Tequila', station: 'BAR' },
    { name: 'Liqueurs & Shots', station: 'BAR' },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          station: cat.station as any,
        },
      });
      console.log(`Created: ${cat.name}`);
    } else {
      await prisma.category.update({
        where: { id: existing.id },
        data: { station: cat.station as any },
      });
      console.log(`Updated: ${cat.name}`);
    }
  }

  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });