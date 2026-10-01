'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export async function getAllStaff() {
  return getStaffMembers();
}

export async function verifyUserPin(pin: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { pin },
    });
    if (!user) {
      return { success: false, error: 'Invalid PIN' };
    }
    return { success: true, user };
  } catch (error: any) {
    console.error('Failed to verify user PIN:', error);
    return { success: false, error: error.message };
  }
}

export async function createStaffMember(data: {
  name: string;
  role: string;
  pin: string;
  phone?: string;
}) {
  try {
    const payload: Record<string, any> = {
      name: data.name,
      role: data.role,
      pin: data.pin,
    };
    if (data.phone) {
      payload.phone = data.phone;
    }
    const user = await (prisma.user as any).create({
      data: payload,
    });
    revalidatePath('/staff');
    revalidatePath('/settings');
    return { success: true, user, message: 'Staff created successfully' };
  } catch (error: any) {
    console.error('Failed to create staff member:', error);
    return { success: false, error: error.message, message: error.message };
  }
}

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
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.role !== undefined) payload.role = data.role;
    if (data.pin !== undefined) payload.pin = data.pin;
    if (data.phone !== undefined) payload.phone = data.phone;

    const user = await (prisma.user as any).update({
      where: { id },
      data: payload,
    });
    revalidatePath('/staff');
    revalidatePath('/settings');
    return { success: true, user, message: 'Staff updated successfully' };
  } catch (error: any) {
    console.error('Failed to update staff member:', error);
    return { success: false, error: error.message, message: error.message };
  }
}

export async function toggleStaffStatus(id: string, currentStatus?: boolean) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user && 'isActive' in user) {
      await (prisma.user as any).update({
        where: { id },
        data: { isActive: !(user as any).isActive },
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
