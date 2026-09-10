import type { InventoryItem } from "../types";

// Last-resort fallback used only when /api/inventory can't be reached at
// all (e.g. a static-only deployment with no backend). Mirrors
// server/src/inventory/snapshot.ts — captured from the "Drink FIFO" sheet.
export const CLIENT_SNAPSHOT_LAST_UPDATED = "2026-09-09";

export const CLIENT_INVENTORY_SNAPSHOT: InventoryItem[] = [
  { drink: "Four Seasons Oolong", currentStock: 640, expiryDate: "2026-10-05", useByDate: "2026-10-02" },
  { drink: "Honey Yuzu Tea", currentStock: 466, expiryDate: "2026-10-01", useByDate: "2026-09-28" },
  { drink: "Straight Guava OJ", currentStock: 515, expiryDate: "2026-10-01", useByDate: "2026-09-28" },
  { drink: "Watermelime Crush", currentStock: 600, expiryDate: "2026-09-14", useByDate: "2026-09-11" },
  { drink: "Black Cold Brew", currentStock: 235, expiryDate: "2026-08-30", useByDate: "2026-08-27" },
  { drink: "White Cold Brew", currentStock: 239, expiryDate: "2026-09-12", useByDate: "2026-09-09" },
  { drink: "Teh C", currentStock: 0, expiryDate: "2026-06-01", useByDate: "2026-05-29" },
  { drink: "Bandung Gao", currentStock: 0, expiryDate: "2026-06-01", useByDate: "2026-05-29" },
  { drink: "Alps Water", currentStock: 1118, expiryDate: "2026-11-01", useByDate: "2026-10-29" },
  { drink: "Passionfruit OJ", currentStock: 0, expiryDate: "2026-11-02", useByDate: "2026-10-30" },
  { drink: "Packet Fruit Juices", currentStock: 504, expiryDate: "2026-12-01", useByDate: "2026-11-28" },
  { drink: "Oatside Barista 1L", currentStock: 60, expiryDate: "2027-06-28", useByDate: "2027-06-25" },
  { drink: "Oatside Barista", currentStock: 240, expiryDate: "2026-10-01", useByDate: "2026-09-28" },
  { drink: "Oatside Chocolate", currentStock: 168, expiryDate: "2026-10-01", useByDate: "2026-09-28" },
  { drink: "Oatside Coffee", currentStock: 120, expiryDate: "2026-10-01", useByDate: "2026-09-28" },
  { drink: "Coconut Water", currentStock: 840, expiryDate: "2026-12-01", useByDate: "2026-11-28" },
  { drink: "UHT Milk", currentStock: 73, expiryDate: "2026-09-20", useByDate: "2026-09-17" },
  { drink: "Tetra Pack 330ml", currentStock: 599, expiryDate: "2027-07-03", useByDate: "2027-06-30" },
];
