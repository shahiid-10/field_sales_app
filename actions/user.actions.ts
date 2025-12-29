"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/* ----------------------------- AUTH GUARD ----------------------------- */

const client = await clerkClient();

async function ensureAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return userId;
}

/* ----------------------------- CORE LOGIC ----------------------------- */

// async function updateUserRole(
//   clerkUserId: string,
//   role: "ADMIN" | "SALESMAN" | "STOCK_MANAGER"
// ) {
//   // 1️⃣ Get user from Clerk
//   const clerkUser = await client.users.getUser(clerkUserId);

//   const email =
//     clerkUser.emailAddresses[0]?.emailAddress ??
//     `${clerkUserId}@unknown.local`;

//   const name = [clerkUser.firstName, clerkUser.lastName]
//     .filter(Boolean)
//     .join(" ") || null;

//   // 2️⃣ UPSERT in DB (authoritative)
//   const user = await prisma.user.upsert({
//     where: { clerkUserId },
//     update: { role },
//     create: {
//       clerkUserId,
//       email,
//       name,
//       role,
//     },
//   });

//   // 3️⃣ Mirror to Clerk metadata (NON-authoritative)
//   await client.users.updateUser(clerkUserId, {
//     publicMetadata: { role },
//   });

//   return user;
// }

async function updateUserRole(
  clerkUserId: string,
  role: "ADMIN" | "SALESMAN" | "STOCK_MANAGER"
) {
  try {
    // 1. Get Clerk user data (for email/name)
    const clerkUser = await client.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUserId}@unknown.local`;
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    // 2. Try to find existing user by clerkUserId
    let user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (user) {
      // User exists → just update role
      user = await prisma.user.update({
        where: { clerkUserId },
        data: { role },
      });
      console.log(`Updated existing user ${user.id} → role: ${role}`);
    } else {
      // No user with this clerkUserId → check if email already exists
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        // Email conflict → link this Clerk ID to the existing record
        user = await prisma.user.update({
          where: { email },
          data: {
            clerkUserId, // ← link Clerk ID
            name,        // update name if needed
            role,
          },
        });
        console.log(`Linked existing email ${email} to Clerk ID ${clerkUserId} → role: ${role}`);
      } else {
        // No conflicts → safe create
        user = await prisma.user.create({
          data: {
            clerkUserId,
            email,
            name,
            role,
          },
        });
        console.log(`Created new user ${user.id} → role: ${role}`);
      }
    }

    // 3. Sync role to Clerk publicMetadata
    await client.users.updateUser(clerkUserId, {
      publicMetadata: { role },
    });

    return user;
  } catch (error: any) {
    console.error(`Role update failed for ${clerkUserId}:`, error);
    throw new Error(error.message || `Failed to update role to ${role}`);
  }
}
/* ----------------------------- ACTIONS ----------------------------- */

export async function assignSalesmanRole(formData: FormData) {
  await ensureAdmin();
  const clerkUserId = formData.get("userId") as string;

  await updateUserRole(clerkUserId, "SALESMAN");
  revalidatePath("/admin/users");
}

export async function assignStockManagerRole(formData: FormData) {
  await ensureAdmin();
  const clerkUserId = formData.get("userId") as string;

  await updateUserRole(clerkUserId, "STOCK_MANAGER");
  revalidatePath("/admin/users");
}

export async function assignAdminRole(formData: FormData) {
  await ensureAdmin();
  const clerkUserId = formData.get("userId") as string;

  await updateUserRole(clerkUserId, "ADMIN");
  revalidatePath("/admin/users");
}
