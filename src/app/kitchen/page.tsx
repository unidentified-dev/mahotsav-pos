import { prisma } from '@/lib/prisma';
import KitchenKdsClient from './KitchenKdsClient';

export const dynamic = 'force-dynamic';

export default async function KitchenPage() {
  // Query active orders only with safe relation fallback
  const activeOrders = await prisma.order.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      table: true,
      items: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Serialize orders safely into plain objects
  const serializedTickets = activeOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    tableNumber: o.table?.tableNumber?.replace(/[^0-9]/g, '') || o.table?.tableNumber || 'N/A',
    status: o.status,
    createdAt: o.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    items: (o.items || []).map((i) => ({
      id: i.id,
      name: i.menuItem?.name || 'Dish',
      station: i.menuItem?.station || 'KITCHEN',
      quantity: i.quantity,
      isVegetarian: i.menuItem?.isVegetarian ?? true,
    })),
  }));

  return <KitchenKdsClient initialTickets={serializedTickets} />;
}