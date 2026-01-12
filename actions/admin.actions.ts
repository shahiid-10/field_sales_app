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

// export async function addProduct(formData: FormData) {
//   try {

//     console.log("📥 Raw FormData entries:");
//     for (const [key, value] of formData.entries()) {
//       console.log(`  ${key}: "${value}" (type: ${typeof value})`);
//     }

//     // Extract values safely first
//     const raw = {
//       name: formData.get("name")?.toString() ?? "",
//       manufacturer: formData.get("manufacturer")?.toString() || undefined,
//       mrp: formData.get("mrp")?.toString() ?? "",
//     };

//     console.log("Parsed raw values before Zod:");
//     console.log("name:", JSON.stringify(raw.name));
//     console.log("manufacturer:", JSON.stringify(raw.manufacturer));
//     console.log("mrp (string):", JSON.stringify(raw.mrp));

//     const data = addProductSchema.parse(raw);

//     console.log("Zod validation passed! Parsed data:", data);

//     await prisma.product.create({
//       data: {
//         name: data.name,
//         manufacturer: data.manufacturer,
//         mrp: data.mrp,
//       },
//     });

//     revalidatePath("/admin/products");

//     return { success: true, message: "Product added successfully" };
//   } catch (error) {
//     console.error("Add product failed:", error);

//      let errorMessage = "Failed to add product";

//     if (error instanceof z.ZodError) {
//       console.log("Zod issues:", error.issues); // ← very useful!
//       errorMessage = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
//     } else if (error instanceof Error) {
//       errorMessage = error.message;
//     }

//     console.log("Final error message sent to client:", errorMessage);

//     return { success: false, error: errorMessage };
//   }
// }

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

// Schema for updating a product
const updateProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().optional(),
  mrp: z.coerce.number().positive("MRP must be positive"),
});

// Delete product
export async function deleteProduct(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Delete product failed:", error);
    return {
      success: false,
      error: error.message || "Failed to delete product",
    };
  }
}

// Update product
export async function updateProduct(formData: FormData) {
  try {
    const data = updateProductSchema.parse({
      id: formData.get("id"),
      name: formData.get("name"),
      manufacturer: formData.get("manufacturer") || undefined,
      mrp: formData.get("mrp"),
    });

    await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        manufacturer: data.manufacturer,
        mrp: data.mrp,
      },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Update product failed:", error);

    let errorMessage = "Failed to Update Product";

    if (error instanceof z.ZodError) {
      // errorMessage = error.errors.map((e) => e.message).join(", ") || errorMessage;
      errorMessage = error.issues.map((e) => e.message).join(", ") || errorMessage;
    }
    return {
      success: false,
      // error: error instanceof z.ZodError ? error.errors[0].message : "Failed to update product",
      error: errorMessage,
    };
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