// components/StoresClient.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Search, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { getNearExpiryProductsForStore } from "@/actions/store.actions"; // ← Your existing server action!

type Store = {
  id: string;
  name: string;
  address?: string | null;
  nearExpiryCount: number;
};

type ExpiryProduct = Awaited<
  ReturnType<typeof getNearExpiryProductsForStore>
>[number] & {
  productName: string;
  daysLeft: number;
};

export default function StoresClient({ stores }: { stores: Store[] }) {
  const [query, setQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [expiryProducts, setExpiryProducts] = useState<ExpiryProduct[]>([]);
  const [loadingExpiry, setLoadingExpiry] = useState(false);
  const [expiryError, setExpiryError] = useState<string | null>(null);

  const filteredStores = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return stores;

    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
  }, [query, stores]);

  // Fetch real near-expiry products using server action when dialog opens
  useEffect(() => {
    if (!selectedStore) {
      setExpiryProducts([]);
      setExpiryError(null);
      return;
    }

    const loadExpiry = async () => {
      setLoadingExpiry(true);
      setExpiryError(null);

      try {
        const products = await getNearExpiryProductsForStore(selectedStore.id);

        // Format with product name and days left
        const formatted = products.map((p) => {
          const expiry = new Date(p.expiryDate!);
          const daysLeft = Math.ceil(
            (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return {
            ...p,
            productName: p.product.name,
            daysLeft: daysLeft > 0 ? daysLeft : 0, // avoid negative
          };
        });

        setExpiryProducts(formatted);
      } catch (err) {
        console.error("Expiry fetch error:", err);
        setExpiryError("Could not load near-expiry products");
      } finally {
        setLoadingExpiry(false);
      }
    };

    loadExpiry();
  }, [selectedStore]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">All Stores</h1>
        <p className="text-muted-foreground">
          Quickly search and select a store to continue
        </p>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-10 bg-background pb-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by store name or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No stores match your search.
        </div>
      ) : (
        <>
          {/* Mobile List */}
          <div className="space-y-4 md:hidden">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    {store.name}
                  </div>

                  {store.nearExpiryCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="cursor-pointer text-xs px-2.5 py-1 flex items-center gap-1"
                      onClick={() => setSelectedStore(store)}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {store.nearExpiryCount} near expiry
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {store.address || "No address provided"}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button size="sm" asChild className="flex-1">
                    <Link href={`/stores/${store.id}/visit`}>Visit</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link href={`/stores/${store.id}/orders`}>Order</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Cards */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className="hover:shadow-lg transition-all duration-200 overflow-hidden bg-card border"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                      {store.name}
                    </CardTitle>

                    {store.nearExpiryCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="cursor-pointer text-xs px-2.5 py-1 flex items-center gap-1"
                        onClick={() => setSelectedStore(store)}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {store.nearExpiryCount} near expiry
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {store.address || "No address provided"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Button asChild className="w-full">
                      <Link href={`/stores/${store.id}/visit`}>Start Visit</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/stores/${store.id}/orders`}>Place Order</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Near-Expiry Products Dialog - Real Data */}
      <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Near Expiry Alert - {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>
              Products expiring within the next 7 days (as of today).
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            {loadingExpiry ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : expiryError ? (
              <p className="text-destructive text-center py-8 font-medium">
                {expiryError}
              </p>
            ) : expiryProducts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-lg">No products expiring soon in this store</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiryProducts.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-muted/40 hover:bg-muted/60 transition-colors"
                  >
                    <div className="font-medium text-base">{item.productName}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Quantity: <strong className="text-foreground">{item.quantity}</strong>
                      {item.batchNumber && (
                        <span className="ml-3">Batch: {item.batchNumber}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span>Expires on:</span>
                      {item.expiryDate ? (
                        <>
                          <span className="font-medium text-destructive">
                            {format(new Date(item.expiryDate), "PPP")}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({item.daysLeft > 0 ? `${item.daysLeft} days left` : "Expired"})
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No expiry date set</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => setSelectedStore(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}