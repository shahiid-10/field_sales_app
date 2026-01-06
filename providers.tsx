"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      {children}
      <Toaster richColors position="top-right" />
    </ClerkProvider>
  );
}







// "use client";

// import { ClerkProvider } from "@clerk/nextjs";
// import { Toaster } from "sonner";

// export default function Providers({ children }: { children: React.ReactNode }) {
//   return (
//     <ClerkProvider
  
//     >
//       {children}
//       <Toaster richColors position="top-right"/>
//     </ClerkProvider>
//   );
// }
