// app/reports/page.tsx
import {
  getPartialOrdersByStore,
  getProductShortages,
  getProductDemandTrends,
  getOverallFulfillmentStats,
} from "@/actions/report.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductDemandChart from "@/components/ProductDemandChart"; // ← new import

export default async function ReportsPage() {
  const days = 30;
  const partialStores = await getPartialOrdersByStore(days);
  const productShortages = await getProductShortages(days);
  const productDemand = await getProductDemandTrends(days);
  const stats = await getOverallFulfillmentStats(days);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
      <h1 className="text-3xl font-bold">Analytics & Reports</h1>
      <p className="text-muted-foreground">Insights for last {days} days</p>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Fulfillment Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Total Orders: {stats.totalOrders}</p>
          <p>
            Fulfillment Rate: {stats.fulfillmentRate.toFixed(1)}% (Full +
            Partial)
          </p>
          <p>Partial Rate: {stats.partialRate.toFixed(1)}%</p>
          <p>Unfulfilled Rate: {stats.unfulfilledRate.toFixed(1)}%</p>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stores with Partial/Unfulfilled Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {partialStores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No partial or unfulfilled orders in the last {days} days
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Partial Orders</TableHead>
                  <TableHead>Unfulfilled Orders</TableHead>
                  <TableHead>Shortfall Items</TableHead>
                  <TableHead>Shortfall Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partialStores.map((store) => (
                  <TableRow key={store.storeId}>
                    <TableCell>{store.storeName}</TableCell>
                    <TableCell>{store.partialOrdersCount}</TableCell>
                    <TableCell>{store.unfulfilledOrdersCount}</TableCell>
                    <TableCell>{store.totalShortfallItems}</TableCell>
                    <TableCell>{store.totalShortfallQty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Shortages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Product Shortages</CardTitle>
        </CardHeader>
        <CardContent>
          {productShortages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No shortages recorded
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Fulfilled</TableHead>
                  <TableHead>Shortfall</TableHead>
                  <TableHead>Rate (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productShortages.map((prod) => (
                  <TableRow key={prod.productId}>
                    <TableCell className="font-medium">
                      {prod.productName}
                    </TableCell>
                    <TableCell>{prod.requestedTotal}</TableCell>
                    <TableCell>{prod.fulfilledTotal}</TableCell>
                    <TableCell className="text-destructive">
                      {prod.shortfallTotal}
                    </TableCell>
                    <TableCell>{prod.fulfillmentRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Demand Chart - now safe in client component */}
      <Card>
        <CardHeader>
          <CardTitle>
            Daily Demand & Fulfillment Trends (Last {days} Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productDemand.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No demand data yet
            </p>
          ) : (
            <ProductDemandChart data={productDemand} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
