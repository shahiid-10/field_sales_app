// // app/components/AuthHeaderClient.tsx
// 'use client';

// import dynamic from 'next/dynamic';

// const AuthHeader = dynamic(
//   () => import('./AuthHeader'),
//   { ssr: false }
// );

// export default AuthHeader;


'use client';

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function AuthHeader() {
  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>

      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
