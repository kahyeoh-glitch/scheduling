import type { InventoryResponse } from "../types";

export async function fetchInventory(): Promise<InventoryResponse> {
  const res = await fetch("/api/inventory");
  if (!res.ok) throw new Error(`Inventory request failed (${res.status})`);
  return res.json();
}
