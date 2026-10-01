'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createStockItem(data: {
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit?: number;
}) {
  const item = await prisma.inventoryItem.create({
    data: {
      name: data.name,
      category: data.category,
      unit: data.unit,
      currentStock: data.currentStock,
      minThreshold: data.minThreshold,
      costPerUnit: data.costPerUnit || 0,
    },
  });

  revalidatePath('/inventory');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(item));
}

export async function updateStockLevel(itemId: string, newQuantity: number) {
  const updated = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { currentStock: newQuantity },
  });

  revalidatePath('/inventory');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteStockItem(itemId: string) {
  const deleted = await prisma.inventoryItem.delete({
    where: { id: itemId },
  });

  revalidatePath('/inventory');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(deleted));
}