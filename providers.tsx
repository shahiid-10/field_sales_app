"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider as NextThemesProvider  } from "next-themes";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
      {children}
      <Toaster richColors position="top-right" />
      </NextThemesProvider>
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
