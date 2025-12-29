// app/stores/[storeid]/orders/page.tsx
import { getPendingOrdersForStore } from "@/actions/product.actions";
import { ProductSelectorDialog } from "@/components/ProductSelectorDialog";
import { format } from "date-fns";

type Props = {
  params: Promise<{
    storeid: string;
  }>;
};

export default async function StoreOrdersPage({ params }: Props) {
  // ✅ unwrap params
  const { storeid } = await params;

  console.log("storeId value:", storeid); // ✅ "3"

  const pendingOrders = await getPendingOrdersForStore(storeid);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* <div className="bg-green-100 p-4 mb-4 rounded">
        <strong>Debug:</strong> storeId = <code>{storeid}</code>
      </div> */}

      <h1 className="text-3xl font-bold mb-4">Store Orders</h1>
      {/* <h1 className="text-3xl font-bold mb-4">
        Orders for {store?.name || "Store"}
      </h1> */}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Pending Orders</h2>

        {pendingOrders.length === 0 ? (
          <p className="text-muted-foreground">No pending orders.</p>
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
                  <td className="border p-2">{order.id.slice(0, 8)}…</td>
                  <td className="border p-2">
                    {order.salesmanName ?? "Unknown"}
                  </td>
                  <td className="border p-2">
                    {format(new Date(order.createdAt), "PPP")}
                  </td>
                  <td className="border p-2">
                    <ul>
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.productName} × {item.quantity} (₹{item.mrp})
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

      <ProductSelectorDialog mode="order" storeId={storeid} />
    </div>
  );
}
