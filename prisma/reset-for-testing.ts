import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing transaction test data...');

  // 1. Delete order line items and orders
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  // 2. Reset all tables to AVAILABLE
  await prisma.table.updateMany({
    data: {
      status: 'AVAILABLE',
    },
  });

  // 3. Clear existing sample menu items & categories if you want a clean slate
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});

  // 4. Clear inventory test entries (optional: keep or wipe)
  await prisma.inventoryItem.deleteMany({});

  console.log('✅ All transactions, tickets, and test menu items have been cleared!');
  console.log('🟢 Tables reset to AVAILABLE.');
  console.log('👤 Staff accounts (Owner, Resto Manager, Bar Manager) have been preserved.');
}

main()
  .catch((e) => {
    console.error('Error resetting database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });