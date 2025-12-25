// app/stores/[storeId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ShoppingCart } from "lucide-react";

// Dummy store data (replace with prisma later)
const getStore = (storeId: string) => {
  const stores = {
    "123": { name: "Andheri Medical Store", address: "Andheri East, Mumbai" },
    "456": { name: "Bandra Pharmacy", address: "Bandra West, Mumbai" },
    // add more as needed
  };
  return stores[storeId as keyof typeof stores] || null;
};

export default function StoreDetailPage({ params }: { params: { storeId: string } }) {
  const store = getStore(params.storeId);
  if (!store) notFound();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
      <p className="text-muted-foreground mb-10">{store.address}</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Visit Card */}
        <Card className="border-primary/20 hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Start Visit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Update current stock positions, expiry dates, and batch numbers.
            </p>
            <Button size="lg" className="w-full" asChild>
              <Link href={`/stores/${params.storeId}/visit`}>
                Begin Visit
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Order Card */}
        <Card className="border-primary/20 hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Place Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Take new order from this store for delivery or pickup.
            </p>
            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href={`/stores/${params.storeId}/orders`}>
                Create Order
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}