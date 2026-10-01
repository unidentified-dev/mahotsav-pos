'use server';

import { prisma } from '@/lib/prisma';

export async function getFloorLayout() {
  return await prisma.section.findMany({
    include: {
      tables: {
        orderBy: { tableNumber: 'asc' },
        include: {
          orders: {
            where: { status: 'ACTIVE' },
            select: { id: true, grandTotal: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}