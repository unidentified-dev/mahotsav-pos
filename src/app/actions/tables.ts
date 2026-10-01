'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch all sections and tables for settings editor
export async function getFloorSections() {
  const sections = await prisma.section.findMany({
    include: {
      tables: {
        orderBy: { tableNumber: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return JSON.parse(JSON.stringify(sections));
}

// Create a new table in a section
export async function createTable(data: {
  sectionId: string;
  tableNumber: string;
  capacity: number;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'BILLED';
}) {
  const table = await prisma.table.create({
    data: {
      sectionId: data.sectionId,
      tableNumber: data.tableNumber.trim(),
      capacity: Number(data.capacity) || 4,
      status: data.status || 'AVAILABLE',
    },
  });

  revalidatePath('/');
  revalidatePath('/settings');
  return JSON.parse(JSON.stringify(table));
}

// Update table details (name, capacity, reserved/unavailable status)
export async function updateTable(
  tableId: string,
  data: {
    tableNumber?: string;
    capacity?: number;
    status?: 'AVAILABLE' | 'OCCUPIED' | 'BILLED';
  }
) {
  const updated = await prisma.table.update({
    where: { id: tableId },
    data: {
      ...(data.tableNumber ? { tableNumber: data.tableNumber.trim() } : {}),
      ...(data.capacity !== undefined ? { capacity: Number(data.capacity) } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
  });

  revalidatePath('/');
  revalidatePath('/settings');
  return JSON.parse(JSON.stringify(updated));
}

// Delete table
export async function deleteTable(tableId: string) {
  // First clear any orphaned order records if table was empty
  const deleted = await prisma.table.delete({
    where: { id: tableId },
  });

  revalidatePath('/');
  revalidatePath('/settings');
  return JSON.parse(JSON.stringify(deleted));
}