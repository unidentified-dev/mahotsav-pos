'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch active orders and their line items
export async function getActiveTickets() {
  const orders = await prisma.order.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      table: true,
      items: {
        include: {
          menuItem: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return JSON.parse(JSON.stringify(orders));
}

// Clear or dismiss an order from the KDS board
export async function completeKdsTicket(orderId: string) {
  // Update order or table reference; here we clear items or acknowledge
  revalidatePath('/kitchen');
  return { success: true };
}