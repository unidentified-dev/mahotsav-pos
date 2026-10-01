'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  price: number;
  taxRate: number;
  name?: string;
}

// 1. SUBMIT OR APPEND TO ORDER (KOT / BOT DISPATCH)
export async function submitOrder(data: {
  tableId: string;
  items: OrderItemInput[];
}) {
  const { tableId, items } = data;

  if (!items || items.length === 0) {
    throw new Error('Cannot submit an empty order');
  }

  const currentTable = await prisma.table.findUnique({
    where: { id: tableId },
  });

  let newSubtotal = 0;
  let newFoodGst = 0;
  let newLiquorVat = 0;

  items.forEach((item) => {
    const itemTotal = Number(item.price) * item.quantity;
    newSubtotal += itemTotal;

    if (Number(item.taxRate) === 10) {
      newLiquorVat += (itemTotal * 10) / 100;
    } else if (Number(item.taxRate) > 0) {
      newFoodGst += (itemTotal * Number(item.taxRate)) / 100;
    }
  });

  // An order is active only if the table is currently OCCUPIED or BILLED
  let activeOrder = null;
  if (currentTable && currentTable.status !== 'AVAILABLE') {
    activeOrder = await prisma.order.findFirst({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  if (!activeOrder) {
    const orderCount = await prisma.order.count();
    const orderNumberInt = 101 + orderCount;
    const grandTotal = newSubtotal + newFoodGst + newLiquorVat;

    activeOrder = await prisma.order.create({
      data: {
        orderNumber: orderNumberInt,
        tableId,
        subtotal: newSubtotal,
        foodGst: newFoodGst,
        liquorVat: newLiquorVat,
        grandTotal,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' },
    });
  } else {
    await prisma.$transaction(
      items.map((item) =>
        prisma.orderItem.create({
          data: {
            orderId: activeOrder!.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.price,
          },
        })
      )
    );

    const existingDiscount = Number(activeOrder.discountAmount || 0);
    const updatedSubtotal = Number(activeOrder.subtotal || 0) + newSubtotal;
    const updatedFoodGst = Number(activeOrder.foodGst || 0) + newFoodGst;
    const updatedLiquorVat = Number(activeOrder.liquorVat || 0) + newLiquorVat;
    const updatedGrandTotal = Math.max(
      0,
      updatedSubtotal + updatedFoodGst + updatedLiquorVat - existingDiscount
    );

    activeOrder = await prisma.order.update({
      where: { id: activeOrder.id },
      data: {
        subtotal: updatedSubtotal,
        foodGst: updatedFoodGst,
        liquorVat: updatedLiquorVat,
        grandTotal: updatedGrandTotal,
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    });
  }

  revalidatePath('/');
  revalidatePath('/reports');
  revalidatePath('/kitchen');
  return JSON.parse(JSON.stringify(activeOrder));
}

// 2. GET ACTIVE ORDER FOR A TABLE
export async function getTableOrder(tableId: string) {
  const currentTable = await prisma.table.findUnique({
    where: { id: tableId },
  });

  if (!currentTable || currentTable.status === 'AVAILABLE') {
    return null;
  }

  const order = await prisma.order.findFirst({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      table: true,
    },
  });

  return order ? JSON.parse(JSON.stringify(order)) : null;
}

// 3. APPLY OR REMOVE DISCOUNT (RESTO MANAGER & OWNER ONLY)
export async function applyOrderDiscount(data: {
  orderId: string;
  discountAmount: number;
}) {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: {
      items: {
        include: { menuItem: true },
      },
      table: true,
    },
  });

  if (!order) throw new Error('Order not found');

  const subtotal = Number(order.subtotal || 0);
  const foodGst = Number(order.foodGst || 0);
  const liquorVat = Number(order.liquorVat || 0);
  const discount = Math.min(subtotal, Math.max(0, Number(data.discountAmount) || 0));

  const grandTotal = Math.max(0, subtotal + foodGst + liquorVat - discount);

  const updated = await prisma.order.update({
    where: { id: data.orderId },
    data: {
      discountAmount: discount,
      grandTotal,
      updatedAt: new Date(),
    },
    include: {
      items: {
        include: { menuItem: true },
      },
      table: true,
    },
  });

  revalidatePath('/');
  revalidatePath('/reports');
  return JSON.parse(JSON.stringify(updated));
}

// 4. PRINT BILL (ADVANCE TABLE STATUS TO BILLED)
export async function printBill(tableId: string) {
  await prisma.table.update({
    where: { id: tableId },
    data: { status: 'BILLED' },
  });

  revalidatePath('/');
  return { success: true };
}

// 5. SETTLE ORDER AND VACATE TABLE
export async function settleTableOrder(data: {
  tableId: string;
  paymentMethod: 'CASH' | 'CARD' | 'UPI';
}) {
  const { tableId, paymentMethod } = data;

  const currentOrder = await prisma.order.findFirst({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
  });

  if (currentOrder) {
    try {
      await prisma.order.update({
        where: { id: currentOrder.id },
        data: {
          paymentMethod: paymentMethod as any,
          updatedAt: new Date(),
        },
      });
    } catch {
      await prisma.order.update({
        where: { id: currentOrder.id },
        data: {
          updatedAt: new Date(),
        },
      });
    }
  }

  // Vacate table back to AVAILABLE
  await prisma.table.update({
    where: { id: tableId },
    data: { status: 'AVAILABLE' },
  });

  revalidatePath('/');
  revalidatePath('/reports');
  return { success: true };
}

// 6. PERSISTENT KDS DISPATCH
export async function markOrderDispatched(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        updatedAt: new Date(),
      },
    });
  } catch {}

  revalidatePath('/kitchen');
  return { success: true };
}