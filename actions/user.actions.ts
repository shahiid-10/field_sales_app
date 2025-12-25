// actions/user.actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const currentUser = await clerk.users.getUser(userId);
  if (currentUser.publicMetadata.role !== 'admin') {
    throw new Error('Only admins can assign roles');
  }

  return userId; // Optional: can use if needed
}

export async function assignSalesmanRole(formData: FormData) {
  const userId = formData.get('userId') as string;

  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error('Unauthorized');

  const currentUser = await clerk.users.getUser(currentUserId);
  if (currentUser.publicMetadata.role !== 'admin') {
    throw new Error('Only admins can assign roles');
  }

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { role: 'salesman' },
  });

  return;
}

export async function assignStockManagerRole(formData: FormData) {
  const userId = formData.get('userId') as string;

  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error('Unauthorized');

  const currentUser = await clerk.users.getUser(currentUserId);
  if (currentUser.publicMetadata.role !== 'admin') {
    throw new Error('Only admins can assign roles');
  }

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { role: 'stock-manager' },
  });

  return;
}

export async function assignAdminRole(formData: FormData) {
  const userId = formData.get('userId') as string;

  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error('Unauthorized');

  const currentUser = await clerk.users.getUser(currentUserId);
  if (currentUser.publicMetadata.role !== 'admin') {
    throw new Error('Only admins can assign roles');
  }

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { role: 'admin' },
  });

  return;
}