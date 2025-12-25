// import { clerkMiddleware } from '@clerk/nextjs/server';

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };


// middleware.ts
// proxy.ts (or middleware.ts)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { UserRole, CustomUserPublicMetadata } from '@/types/user';

const isPublic = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/', // optional: make home public
  '/stores/(.*)',
]);

const isSalesmanRoute = createRouteMatcher([
  '/stores/(.*)/visit',
  '/stores/(.*)/order', // add later when you create order page
]);

const isStockManagerRoute = createRouteMatcher([
  '/inventory(.*)',
  '/orders/fulfill(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Require login for everything except public routes
  if (!isPublic(req)) {
    await auth.protect();
  }

  // 2. Role checks
  // const { userId, sessionClaims } = await auth();

  // if (userId) {
  //   // Safe type assertion - this is the cleanest & recommended way
  //   const metadata = sessionClaims?.public_metadata as
  //     | CustomUserPublicMetadata
  //     | undefined;

  //   const role = metadata?.role;

  //   if (isSalesmanRoute(req) && role !== 'salesman') {
  //     return NextResponse.json({ error: 'Salesmen only' }, { status: 403 });
  //   }

  //   if (isStockManagerRoute(req) && role !== 'stock-manager') {
  //     return NextResponse.json({ error: 'Stock managers only' }, { status: 403 });
  //   }

  //   // Admins can access everything — no extra check needed
  // }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};