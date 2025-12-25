// // // types/clerk.d.ts

// declare module '@clerk/nextjs' {
//   interface UserPublicMetadata {
//     role?: 'admin' | 'stock-manager' | 'salesman';
//     // add other expected fields here
//   }
// }

// declare module '@clerk/nextjs/server' {
//   interface UserPublicMetadata {
//     role?: 'admin' | 'stock-manager' | 'salesman';
//   }
// }

// types/user.ts
export type UserRole = 'admin' | 'stock-manager' | 'salesman';

export interface AppUserMetadata {
  role?: UserRole;
  // add more if needed
}