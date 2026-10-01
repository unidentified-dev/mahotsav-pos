'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch all staff members
export async function getStaffMembers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to get staff members:', error);
    return [];
  }
}

// Alias for getStaffMembers
export async function getAllStaff() {
  return getStaffMembers();
}

// Create a new staff member
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
    revalidatePath('/settings');
    return { success: true, user };
  } catch (error: any) {
    console.error('Failed to create staff member:', error);
    return { success: false, error: error.message };
  }
}

// Update existing staff details
export async function updateStaffMember(
  id: string,
  data: {
    name?: string;
    role?: string;
    pin?: string;
    phone?: string;
  }
) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.pin !== undefined && { pin: data.pin }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
    });
    revalidatePath('/staff');
    revalidatePath('/settings');
    return { success: true, user };
  } catch (error: any) {
    console.error('Failed to update staff member:', error);
    return { success: false, error: error.message };
  }
}

// Toggle staff active/inactive status
export async function toggleStaffStatus(id: string, currentStatus?: boolean) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && 'isActive' in user) {
      await prisma.user.update({
        where: { id },
        data: { isActive: !(user as any).isActive } as any,
      });
    }
    revalidatePath('/staff');
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle staff status:', error);
    return { success: false, error: error.message };
  }
}

// Delete staff member
export async function deleteStaffMember(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath('/staff');
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete staff member:', error);
    return { success: false, error: error.message };
  }
}