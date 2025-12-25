// actions/store.actions.ts
'use server';

import { prisma } from '@/lib/prisma';

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