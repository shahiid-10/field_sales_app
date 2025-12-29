// types/clerk.d.ts
export {};

export type UserRole = 'admin' | 'stock-manager' | 'salesman';

declare global {
  interface AppUserMetadata {
    metadata: {
      role?: UserRole
    }
  }
}
// export interface AppUserMetadata {
//   role?: UserRole;
//   // add more if needed
// }