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
  const { storeid } = await params;

  const pendingOrders = await getPendingOrdersForStore(storeid);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Store Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          Pending orders for this store
        </p>
      </div>

      {/* Orders */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pending Orders</h2>

          <ProductSelectorDialog mode="order" storeId={storeid} />
        </div>

        {pendingOrders.length === 0 ? (
          <p className="text-muted-foreground">
            No pending orders.
          </p>
        ) : (
          <>
            {/* ================= MOBILE VIEW ================= */}
            <div className="space-y-4 md:hidden">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Order ID</span>
                    <span>{order.id.slice(0, 8)}…</span>
                  </div>

                  <div className="mt-2">
                    <p className="font-medium">
                      {order.salesmanName ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "PPP")}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2"
                      >
                        <span className="truncate">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium whitespace-nowrap">
                          ₹{item.mrp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= DESKTOP VIEW ================= */}
            <div className="hidden md:block overflow-x-auto rounded-lg border">
              <table className="min-w-full border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Salesman
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Items
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 text-sm">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.salesmanName ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(order.createdAt), "PPP")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ul className="space-y-1">
                          {order.items.map((item, i) => (
                            <li key={i}>
                              {item.productName} × {item.quantity} (₹
                              {item.mrp})
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Product / Order */}
      {/* <div className="mt-10">
        <ProductSelectorDialog mode="order" storeId={storeid} />
      </div> */}
    </div>
  );
}
