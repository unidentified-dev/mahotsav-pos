import { prisma } from '@/lib/prisma';
import InventoryClient from './InventoryClient';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const inventoryItems = await prisma.inventoryItem.findMany({
    orderBy: { name: 'asc' },
  });

  // Serialize inventory items safely
  const serializedItems = inventoryItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    currentStock: Number(item.currentStock),
    minThreshold: Number(item.minThreshold),
    costPerUnit: Number(item.costPerUnit || 0),
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : new Date().toISOString(),
  }));

  return <InventoryClient initialItems={serializedItems} />;
}