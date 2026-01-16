// app/stores/page.tsx
import { getStores } from "@/actions/store.actions";
import { getNearExpiryCountPerStore } from "@/actions/store.actions"; // same file or new
import StoresClient from "@/components/StoresClient";

export default async function StoresPage() {
  const stores = await getStores();
  const expiryCounts = await getNearExpiryCountPerStore();

  // Enrich each store with its near-expiry count
  const enrichedStores = stores.map((store) => ({
    ...store,
    nearExpiryCount: expiryCounts[store.id] ?? 0,
  }));

  return <StoresClient stores={enrichedStores} />;
}