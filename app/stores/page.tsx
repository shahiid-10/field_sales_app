// app/stores/page.tsx
import { getStores } from "@/actions/store.actions";
import StoresClient from "@/components/StoresClient";

export default async function StoresPage() {
  const stores = await getStores();

  return <StoresClient stores={stores} />;
}
