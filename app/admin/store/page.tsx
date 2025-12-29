// app/admin/stores/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllStores } from "@/actions/admin.actions";
import StoreManagementTable from "@/components/StoreManagementTable";
import AddStoreDialog from "@/components/AddStoreDialog";

export default async function AdminStoresPage() {
  const user = await currentUser();

  if (!user || user.publicMetadata.role !== "ADMIN") {
    redirect("/");
  }

  const stores = await getAllStores();

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin - Manage Stores</h1>
        <AddStoreDialog />
      </div>

      <StoreManagementTable initialStores={stores} />
    </div>
  );
}