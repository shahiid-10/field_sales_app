// app/stores/[storeId]/visit/page.tsx
import { getStoreStockPositions } from "@/actions/product.actions";
import { VisitStockEditor } from "@/components/VisitStockEditor";
import { notFound } from "next/navigation";
import { format } from "date-fns";

// type Props = { params: { storeId: string } };
type Props = {
  params: Promise<{ storeid: string }>;  // ← Type as Promise
};

export default async function StoreVisitPage({ params: paramsPromise  }: Props) {

  const params = await paramsPromise;
  const storeId = params.storeid;  // Now safe & defined
  // const { storeId } = params;

  // console.log("Resolved storeId:", storeId);
  const stockPositions = await getStoreStockPositions(params.storeid);

  if (!stockPositions) notFound();

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-4">Store Visit & Stock Management</h1>

      <VisitStockEditor storeId={storeId} initialStock={stockPositions} />
    </div>
  );
}