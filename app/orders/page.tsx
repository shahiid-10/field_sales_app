// app/orders/page.tsx
import { getPendingOrdersAll } from "@/actions/order.actions";
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
import OrderStatusChangeDialog from "@/components/OrderStatusChangeDialog";

export default async function StoreOrdersPage({
  params,
}: {
  params: { storeId: string };
}) {
  const orders = await getPendingOrdersAll();

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Store Orders Management</h1>
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
            {/* Desktop headers only */}
            <TableHeader className="hidden md:table-header-group">
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
                <TableRow
                  key={order.id}
                  className="block md:table-row border-b md:border-0"
                >
                  {/* ===== Mobile layout ===== */}
                  <TableCell className="block md:hidden space-y-3 p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        #{order.id.slice(0, 8)}...
                      </span>
                      <Badge
                        variant={
                          order.status === "FULFILLED"
                            ? "default"
                            : order.status === "PENDING"
                            ? "default"
                            : order.status === "PARTIAL"
                            ? "destructive"
                            : order.status === "UNFULFILLED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <strong>Store:</strong> {order.storeName}
                      </div>
                      <div>
                        <strong>Salesman:</strong> {order.salesmanName}
                      </div>
                      <div>
                        <strong>Date:</strong>{" "}
                        {format(new Date(order.createdAt), "PPP p")}
                      </div>
                    </div>

                    <ul className="list-disc pl-4 text-sm">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.productName} × {item.quantity} (₹{item.mrp})
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2">
                      <OrderStatusChangeDialog
                        orderId={order.id}
                        currentStatus={order.status}
                        storeId={params.storeId}
                      />
                    </div>
                  </TableCell>

                  {/* ===== Desktop layout ===== */}
                  <TableCell className="hidden md:table-cell font-medium">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.storeName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.salesmanName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(order.createdAt), "PPP p")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ul className="list-disc pl-4 text-sm">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.productName} × {item.quantity} (₹{item.mrp})
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={
                        order.status === "FULFILLED"
                          ? "default"
                          : order.status === "PENDING"
                          ? "default"
                          : order.status === "PARTIAL"
                          ? "destructive"
                          : order.status === "UNFULFILLED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
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
