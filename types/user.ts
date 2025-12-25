// types/user.ts

/**
 * Possible user roles in the field sales application
 */
export type UserRole = 'admin' | 'stock-manager' | 'salesman';

/**
 * Clerk public metadata shape for our users.
 * This extends Clerk's UserPublicMetadata type globally.
 */
export interface CustomUserPublicMetadata {
  role?: UserRole;
  // You can add more fields later, e.g.:
  // teamId?: string;
  // preferredLanguage?: 'en' | 'hi';
  // lastActiveStoreId?: string;
}

/**
 * Full user type with Clerk + our custom fields
 * (useful when you fetch user + combine with Prisma data)
 */
export interface AppUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole | null;
  // Add more Prisma fields if you sync them
  createdAt?: Date;
  // etc.
}