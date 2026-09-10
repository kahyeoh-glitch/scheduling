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

export type StatusTone = "red" | "green" | "blue" | "grey";

export interface ManagedRow {
  drink: string;
  minimum: number;
  currentStock: number;
  goingOut: number;
  incoming: number;
  afterOrders: number;
  projected: number;
  status: "ORDER NOW" | "OK";
  expiryDate: string | null;
}

export interface TrackedRow {
  drink: string;
  currentStock: number;
  goingOut: number;
  incoming: number;
  afterOrders: number;
  expiryDate: string | null;
}

export interface DiscontinuingRow {
  drink: string;
  currentStock: number;
  goingOut: number;
  remainingAfter: number;
  expiryDate: string | null;
}
