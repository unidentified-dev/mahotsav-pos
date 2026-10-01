'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCategoriesWithItems() {
  const categories = await prisma.category.findMany({
    include: {
      items: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return JSON.parse(JSON.stringify(categories));
}

export async function createCategory(name: string, station: 'KITCHEN' | 'BAR') {
  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      station,
    },
  });

  revalidatePath('/menu');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(category));
}

export async function createMenuItem(data: {
  name: string;
  price: number;
  taxRate: number;
  station: 'KITCHEN' | 'BAR';
  isVegetarian: boolean;
  isAlcoholic: boolean;
  categoryId: string;
  variations?: { name: string; price: number }[];
}) {
  // If item has variations, encode into name using delimiter '::'
  let storedName = data.name.trim();
  if (data.variations && data.variations.length > 0) {
    storedName = `${storedName}::${JSON.stringify(data.variations)}`;
  }

  const item = await prisma.menuItem.create({
    data: {
      name: storedName,
      price: data.price,
      taxRate: data.taxRate,
      station: data.station,
      isVegetarian: data.isVegetarian,
      isAlcoholic: data.isAlcoholic,
      categoryId: data.categoryId,
    },
  });

  revalidatePath('/menu');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(item));
}

export const addMenuItem = createMenuItem;

export async function updateMenuItem(
  id: string,
  data: {
    name?: string;
    price?: number;
    taxRate?: number;
    station?: 'KITCHEN' | 'BAR';
    isVegetarian?: boolean;
    isAlcoholic?: boolean;
    categoryId?: string;
    isItem86?: boolean;
    variations?: { name: string; price: number }[];
  }
) {
  let storedName = data.name ? data.name.trim() : undefined;
  if (storedName && data.variations !== undefined) {
    if (data.variations.length > 0) {
      storedName = `${storedName.split('::')[0].trim()}::${JSON.stringify(data.variations)}`;
    } else {
      storedName = storedName.split('::')[0].trim();
    }
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(storedName ? { name: storedName } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.taxRate !== undefined ? { taxRate: data.taxRate } : {}),
      ...(data.station ? { station: data.station } : {}),
      ...(data.isVegetarian !== undefined ? { isVegetarian: data.isVegetarian } : {}),
      ...(data.isAlcoholic !== undefined ? { isAlcoholic: data.isAlcoholic } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      ...(data.isItem86 !== undefined ? { isItem86: data.isItem86 } : {}),
    },
  });

  revalidatePath('/menu');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteMenuItem(id: string) {
  const deleted = await prisma.menuItem.delete({
    where: { id },
  });

  revalidatePath('/menu');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(deleted));
}

export async function toggleItem86(itemId: string, isItem86: boolean) {
  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: { isItem86 },
  });

  revalidatePath('/menu');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(updated));
}