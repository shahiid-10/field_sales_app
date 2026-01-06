
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Providers from "@/providers";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Field Sales App",
  description: "Manage sales, inventory, visits and orders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {/* Public pages */}
          <SignedOut>{children}</SignedOut>

          {/* Protected pages */}
          <SignedIn>
            <SidebarProvider>
              <AppSidebar />
              <main className="flex-1">
                <SidebarTrigger />
                {children}
              </main>
            </SidebarProvider>
          </SignedIn>
        </Providers>
      </body>
    </html>
  );
}






// // app/layout.tsx
// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "./globals.css";

// import { ClerkProvider } from "@clerk/nextjs";
// import { SignedIn, SignedOut } from "@clerk/nextjs";
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/app-sidebar";
// import { redirect } from "next/navigation";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Field Sales App",
//   description: "Manage sales, inventory, visits and orders",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <ClerkProvider
//       publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
//     >
//       <html lang="en">
//         <body className={inter.className}>
//           {/* Public pages (root, sign-in, sign-up) — no sidebar */}
//           <SignedOut>
//             {children}
//           </SignedOut>

//           {/* Protected pages — with sidebar */}
//           <SignedIn>
//             <SidebarProvider>
//               <AppSidebar />
              
//               <main className="flex-1">
//                 <SidebarTrigger/>
//                 {children}
//                 </main>
//             </SidebarProvider>
//           </SignedIn>
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }