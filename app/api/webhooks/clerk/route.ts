// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { id } from "date-fns/locale";

export async function POST(req: Request) {
  const headerList = await headers();
  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  // Early validation
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers");
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET!); // Use correct env var name

  let evt: any;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  console.log(`Webhook received: ${evt.type} - ID: ${evt.data?.id}`);

  if (evt.type === "user.created") {
    const {
      id: clerkUserId,
      email_addresses,
      first_name,
      last_name,
    } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      console.log("Skipping user without email");
      return NextResponse.json({ ignored: true });
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || null;
    console.log(id, name, email);

    try {
      await prisma.user.upsert({
        where: { clerkUserId },
        update: {
          email,
          name,
          role: "SALESMAN",
        },
        create: {
          clerkUserId,
          email,
          name,
          role: "SALESMAN",
        },
      });

      // Optional: Mirror role in Clerk (useful for client-side checks)
      const client = await clerkClient();
      await client.users.updateUser(clerkUserId, {
        publicMetadata: { role: "SALESMAN" },
      });

      // await client.sessions.revokeSession(user.id);

      console.log(`User ${clerkUserId} synced successfully`);
    } catch (dbError) {
      console.error("User sync failed:", dbError);
      // Still respond 200 – Clerk requires it
    }
  }

  // Always acknowledge
  return NextResponse.json({ success: true });
}
