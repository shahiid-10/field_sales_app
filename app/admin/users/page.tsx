// app/admin/users/page.tsx (Server Component)
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import UserManagementTable from "@/components/UserManagementTable";
import { clerk } from "@/lib/clerk-backend";

export default async function AdminUsersPage() {
  // const user = await currentUser();
  // if (!user || user.publicMetadata.role !== 'admin') {
  //   redirect('/');
  // }

  const user = await currentUser();

  console.log("Current user metadata:", user?.publicMetadata); // ← check this in terminal

  if (!user || user.publicMetadata.role !== "admin") {
    console.log("Redirecting - role is:", user?.publicMetadata?.role); // ← also log this
    redirect("/");
  }

  const usersResponse = await clerk.users.getUserList();

  // Map users to plain objects
  const plainUsers = usersResponse.data.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.emailAddresses[0]?.emailAddress || null,
    role: (u.publicMetadata as { role?: string | null })?.role || null, // safe cast
  }));

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin - Manage Users & Roles</h1>
      <UserManagementTable initialUsers={plainUsers} />
    </div>
  );
}
