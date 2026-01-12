"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Search } from "lucide-react";

type Store = {
  id: string;
  name: string;
  address?: string | null;
};

export default function StoresClient({ stores }: { stores: Store[] }) {
  const [query, setQuery] = useState("");

  const filteredStores = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return stores;

    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
    );
  }, [query, stores]);

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

      {/* Empty state */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No stores match your search.
        </div>
      ) : (
        <>
          {/* ===== Mobile (list) ===== */}
          <div className="space-y-4 md:hidden">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 text-primary" />
                  {store.name}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {store.address || "No address provided"}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button size="sm" asChild>
                    <Link href={`/stores/${store.id}/visit`}>
                      Visit
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/stores/${store.id}/orders`}>
                      Order
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Desktop (cards) ===== */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {store.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {store.address || "No address provided"}
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <Button asChild>
                      <Link href={`/stores/${store.id}/visit`}>
                        Start Visit
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/stores/${store.id}/orders`}>
                        Place Order
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
