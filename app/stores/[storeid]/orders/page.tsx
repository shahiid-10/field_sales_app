// app/stores/[storeId]/orders/page.tsx
import { getPendingOrdersForStore } from "@/actions/product.actions";
import { ProductSelectorDialog } from "@/components/ProductSelectorDialog";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

type Props = { params: { storeId: string } };

export default async function StoreOrdersPage({ params }: Props) {
  const pendingOrders = await getPendingOrdersForStore(params.storeId);

  const handleSuccess = async () => {
    "use server";
    revalidatePath(`/stores/${params.storeId}/orders`);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Store Orders</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Pending Orders</h2>
        {pendingOrders.length === 0 ? (
          <p>No pending orders.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">Order ID</th>
                <th className="border p-2">Salesman</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Items</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.map((order) => (
                <tr key={order.id}>
                  <td className="border p-2">{order.id}</td>
                  <td className="border p-2">{order.salesmanName}</td>
                  <td className="border p-2">{format(new Date(order.createdAt), "PPP")}</td>
                  <td className="border p-2">
                    <ul>
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.productName} x {item.quantity} (₹{item.mrp})
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductSelectorDialog mode="order" storeId={params.storeId}  />
    </div>
  );
}