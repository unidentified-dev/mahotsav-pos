'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Export both names to prevent any future build mismatches
export async function getStaffMembers() {
  const staff = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return JSON.parse(JSON.stringify(staff));
}

export const getAllStaff = getStaffMembers;

export async function createStaffMember(data: {
  name: string;
  pin: string;
  role: 'OWNER' | 'RESTO_MANAGER' | 'BAR_MANAGER' | 'CHEF';
}) {
  const user = await prisma.user.create({
    data: {
      name: data.name,
      pin: data.pin,
      role: data.role,
    },
  });

  revalidatePath('/settings');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(user));
}

export async function updateStaffMember(
  id: string,
  data: {
    name?: string;
    pin?: string;
    role?: 'OWNER' | 'RESTO_MANAGER' | 'BAR_MANAGER' | 'CHEF';
  }
) {
  const updated = await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath('/settings');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteStaffMember(id: string) {
  const deleted = await prisma.user.delete({
    where: { id },
  });

  revalidatePath('/settings');
  revalidatePath('/');
  return JSON.parse(JSON.stringify(deleted));
}