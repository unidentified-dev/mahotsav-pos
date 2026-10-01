import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing order and sales records...');

  // 1. Delete all order items (cascading dependency)
  const deletedItems = await prisma.orderItem.deleteMany({});
  console.log(`✅ Deleted ${deletedItems.count} Order Items.`);

  // 2. Delete all orders (settled, active, billed, online)
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✅ Deleted ${deletedOrders.count} Orders.`);

  // 3. Reset all tables back to AVAILABLE (Vacant)
  const updatedTables = await prisma.table.updateMany({
    data: {
      status: 'AVAILABLE',
    },
  });
  console.log(`✅ Reset ${updatedTables.count} Tables to AVAILABLE (Vacant).`);

  console.log('\n✨ Database order and sales data successfully cleared!');
  console.log('🔒 Menu, Categories, Users, Staff PINs, and Inventory remain untouched.');
}

main()
  .catch((e) => {
    console.error('❌ Error clearing orders:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });