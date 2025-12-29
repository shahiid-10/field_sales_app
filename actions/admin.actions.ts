// actions/admin.actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for adding a product
const addProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  mrp: z.coerce.number().positive("MRP must be positive"),
});

export async function addProduct(formData: FormData) {
  try {
    const data = addProductSchema.parse({
      name: formData.get("name"),
      manufacturer: formData.get("manufacturer") || undefined,
      mrp: formData.get("mrp"),
    });

    await prisma.product.create({
      data: {
        name: data.name,
        manufacturer: data.manufacturer,
        mrp: data.mrp,
      },
    });

    revalidatePath("/admin/products");

    return { success: true, message: "Product added successfully" };
  } catch (error) {
    console.error("Add product failed:", error);

    let errorMessage = "Failed to add product";

    if (error instanceof z.ZodError) {
      // Safely get first error message (or all joined)
      // errorMessage = error.errors.map((e) => e.message).join(", ") || errorMessage;
      errorMessage = error.issues.map((e) => e.message).join(", ") || errorMessage;
    }

    return { success: false, error: errorMessage };
  }
}

export async function getAllProducts() {
  return await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      manufacturer: true,
      mrp: true,
      // createdAt: true, // ← This field exists in your schema – no issue
    },
    orderBy: { name: "asc" },
  });
}

// Schema for adding a store
const addStoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export async function addStore(formData: FormData) {
  try {
    const data = addStoreSchema.parse({
      name: formData.get("name"),
      address: formData.get("address") || undefined,
      latitude: formData.get("latitude") || undefined,
      longitude: formData.get("longitude") || undefined,
    });

    await prisma.store.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });

    revalidatePath("/admin/stores");

    return { success: true, message: "Store added successfully" };
  } catch (error) {
    console.error("Add store failed:", error);

    let errorMessage = "Failed to add store";

    if (error instanceof z.ZodError) {
      // errorMessage = error.errors.map((e) => e.message).join(", ") || errorMessage;
      errorMessage = error.issues.map((e) => e.message).join(", ") || errorMessage;
    }

    return { success: false, error: errorMessage };
  }
}


export async function getAllStores() {
  return await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      // createdAt: true, // ← Valid field
    },
    orderBy: { name: "asc" },
  });
}