export interface InventoryItem {
  drink: string;
  currentStock: number;
  expiryDate: string | null;
  useByDate: string | null;
}

export interface InventoryResponse {
  source: "live" | "snapshot";
  fetchedAt: string;
  sheetLastUpdated: string | null;
  items: InventoryItem[];
}
