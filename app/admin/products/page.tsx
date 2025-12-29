// app/admin/products/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllProducts } from "@/actions/admin.actions";
import ProductManagementTable from "@/components/ProductManagementTable";
import AddProductDialog from "@/components/AddProductDialog ";

export default async function AdminProductsPage() {
  const user = await currentUser();

  if (!user || user.publicMetadata.role !== "ADMIN") {
    redirect("/");
  }

  const products = await getAllProducts();

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin - Manage Products</h1>
        <AddProductDialog />
      </div>

      <ProductManagementTable initialProducts={products} />
    </div>
  );
}