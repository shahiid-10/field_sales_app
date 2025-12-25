// app/stores/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin } from "lucide-react";
import { getStores } from "@/actions/store.actions";

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">All Stores</h1>
      <p className="text-muted-foreground mb-10">
        Select a store to start a visit or place an order
      </p>

      {stores.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No stores found. Add some stores to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {store.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <MapPin className="h-4 w-4" />
                  <span>{store.address || "No address provided"}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button asChild>
                    <Link href={`/stores/${store.id}/visit`}>Start Visit</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/stores/${store.id}/orders`}>Place Order</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}