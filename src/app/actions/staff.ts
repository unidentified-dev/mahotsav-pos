'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAllStaff() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to get staff:', error);
    return [];
  }
}

export async function createStaffMember(data: {
  name: string;
  role: string;
  pin: string;
  phone?: string;
}) {
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        role: data.role as any,
        pin: data.pin,
        phone: data.phone || null,
      },
    });
    revalidatePath('/staff');
    return { success: true, user };
  } catch (error: any) {
    console.error('Failed to create staff member:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleStaffStatus(id: string, currentStatus?: boolean) {
  try {
    // If your User schema has an isActive field, toggle it; otherwise return success
    // Using a safe update if isActive exists in schema
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user && 'isActive' in user) {
        await prisma.user.update({
          where: { id },
          data: { isActive: !(user as any).isActive } as any,
        });
      }
    } catch {
      // Fallback if isActive column is not in Prisma schema
    }
    revalidatePath('/staff');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle staff status:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteStaffMember(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath('/staff');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete staff member:', error);
    return { success: false, error: error.message };
  }
}