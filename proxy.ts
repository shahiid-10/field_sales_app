// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/* ----------------------------- ROUTE MATCHERS ----------------------------- */

// Public routes (NO auth)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
]);

// Admin-only routes
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

// Salesman routes
const isSalesmanRoute = createRouteMatcher([
  "/stores/(.*)/visit",
  "/stores/(.*)/orders",
]);

// Stock manager routes
const isStockManagerRoute = createRouteMatcher([
  "/inventory(.*)",
  "/orders/fulfill(.*)",
]);

/* ------------------------------- MIDDLEWARE ------------------------------- */

export default clerkMiddleware(async (auth, req) => {
  /* 1️⃣ Public routes → allow */
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  /* 2️⃣ Require authentication */
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  /* 3️⃣ Extract role from Clerk session claims */
  // const role =
  //   (sessionClaims?.publicMetadata as { role?: string })?.role;


  // const role = (sessionClaims?.public_metadata as { role?: string } | undefined)?.role; 

  const publicMetadata = sessionClaims?.public_metadata || sessionClaims?.metadata;
  const role = (publicMetadata as { role?: string } | undefined)?.role;
  // Debug once (remove later)
  // console.log("Middleware role:", role);
  // console.log("Path:", req.nextUrl.pathname);
  // console.log(sessionClaims)

  /* 4️⃣ Role-based access control */

  if (isAdminRoute(req) && role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin access only" },
      { status: 403 }
    );
  }

  if (isSalesmanRoute(req) && role !== "SALESMAN") {
    return NextResponse.json(
      { error: "Salesman access only" },
      { status: 403 }
    );
  }

  if (isStockManagerRoute(req) && role !== "STOCK_MANAGER") {
    return NextResponse.json(
      { error: "Stock manager access only" },
      { status: 403 }
    );
  }

  /* 5️⃣ Allow request */
  return NextResponse.next();
});

/* ------------------------------- CONFIG ------------------------------- */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};
