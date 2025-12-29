// app/stores/[storeId]/orders/page.tsx
import { getPendingOrdersAll, getPendingOrdersForStore } from "@/actions/order.actions";
import { ProductSelectorDialog } from "@/components/ProductSelectorDialog";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import OrderStatusChangeDialog from "@/components/OrderStatusChangeDialog"; // We'll create this next

export default async function StoreOrdersPage({
  params,
}: {
  params: { storeId: string };
}) {
  // const orders = await getPendingOrdersForStore(params.storeId);
  const orders = await getPendingOrdersAll();

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Store Orders Management</h1>
        <ProductSelectorDialog mode="order" storeId={params.storeId} />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Showing PENDING, PARTIAL, and UNFULFILLED orders (Fulfilled orders are hidden)
        </p>

        {orders.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground">No active orders at the moment.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Salesman</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>{order.storeName}</TableCell>
                  <TableCell>{order.salesmanName}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), "PPP p")}</TableCell>
                  <TableCell>
                    <ul className="list-disc pl-4 text-sm">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.productName} × {item.quantity} (₹{item.mrp})
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "FULFILLED" ? "default" :
                        order.status === "PARTIAL" ? "outline" :
                        order.status === "UNFULFILLED" ? "destructive" :
                        "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderStatusChangeDialog
                      orderId={order.id}
                      currentStatus={order.status}
                      storeId={params.storeId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}