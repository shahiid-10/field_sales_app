// actions/store.actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import z from 'zod';

export async function getStores() {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        // Add more fields if needed (e.g. latitude, longitude)
      },
      orderBy: {
        name: 'asc', // Alphabetical order
      },
    });

    return stores;
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error; 
  }
}


export async function getStoreWithStockPositions(storeId: string) {
  try {
    const store = await prisma.store.findFirst({
      where: { id: storeId },
      include: {
        stockPositions: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                mrp: true,
              },
            },
          },
        },
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    // Format stock positions for the form (safe null handling)
    const formattedStockPositions = store.stockPositions.map((sp) => ({
      productId: sp.productId,
      product: {
        name: sp.product.name,
        mrp: sp.product.mrp,
      },
      quantity: sp.quantity,
      expiryDate: sp.expiryDate ? new Date(sp.expiryDate) : null,
      batchNumber: sp.batchNumber || null,
    }));

    return {
      ...store,
      stockPositions: formattedStockPositions,
    };
  } catch (error) {
    console.error('Error fetching store:', error);
    throw error; 
  }
}

const storeSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function addStore(formData: FormData) {
  try {
    const data = storeSchema.parse({
      name: formData.get("name"),
      address: formData.get("address"),
      latitude: formData.get("latitude") ? Number(formData.get("latitude")) : undefined,
      longitude: formData.get("longitude") ? Number(formData.get("longitude")) : undefined,
    });

    await prisma.store.create({
      data,
    });

    revalidatePath("/admin/stores");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to add store" };
  }
}

export async function updateStore(storeId: string, data: z.infer<typeof storeSchema>) {
  try {
    await prisma.store.update({
      where: { id: storeId },
      data,
    });

    revalidatePath("/admin/stores");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update store" };
  }
}

export async function deleteStore(storeId: string) {
  try {
    await prisma.store.delete({
      where: { id: storeId },
    });

    revalidatePath("/admin/stores");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to delete store (may have related orders/visits)" };
  }
}
