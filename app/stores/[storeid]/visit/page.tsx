// app/stores/[storeId]/visit/page.tsx
import { getStoreStockPositions } from "@/actions/product.actions";
import { ProductSelectorDialog } from "@/components/ProductSelectorDialog";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache"; // for onSuccess
import { format } from "date-fns";

type Props = { params: { storeId: string } };

export default async function StoreVisitPage({ params }: Props) {
  const stockPositions = await getStoreStockPositions(params.storeId);
  // If no store, notFound() already thrown in action

  const handleSuccess = async () => {
    "use server";
    revalidatePath(`/stores/${params.storeId}/visit`);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Store Visit & Stock Adjustments</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Stock Positions</h2>
        {stockPositions.length === 0 ? (
          <p>No stock positions yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Product</th>
                <th className="border p-2">MRP</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Expiry</th>
                <th className="border p-2">Batch</th>
              </tr>
            </thead>
            <tbody>
              {stockPositions.map((sp) => (
                <tr key={sp.productId}>
                  <td className="border p-2">{sp.productName}</td>
                  <td className="border p-2">₹{sp.mrp}</td>
                  <td className="border p-2">{sp.quantity}</td>
                  <td className="border p-2">{sp.expiryDate ? format(new Date(sp.expiryDate), "PPP") : 'N/A'}</td>
                  <td className="border p-2">{sp.batchNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductSelectorDialog mode="visit" storeId={params.storeId} onSuccess={handleSuccess} />
    </div>
  );
}