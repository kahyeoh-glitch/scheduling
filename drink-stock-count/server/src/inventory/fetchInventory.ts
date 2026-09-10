import type { InventoryItem, InventoryResponse } from "../types";
import { mapSheetDrinkName } from "./sheetNameMap";
import { INVENTORY_SNAPSHOT, SNAPSHOT_LAST_UPDATED } from "./snapshot";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "1MctJ_HYxGiPTs-G6Mdlbfdx6XqU4i3LoCWnTpgThDg0";
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB ?? "Inventory";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

interface ParsedSheet {
  items: InventoryItem[];
  lastUpdated: string | null;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function rowsFromCsv(csv: string): string[][] {
  return csv
    .split(/\r\n|\n|\r/)
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

// The Inventory tab starts with a "LAST UPDATED ..." banner row above the
// real header, so we scan for the header instead of assuming a fixed offset.
function parseRows(rows: string[][]): ParsedSheet {
  const headerIndex = rows.findIndex((row) => row[0]?.trim().toLowerCase() === "drink name");
  if (headerIndex === -1) {
    throw new Error('Could not find a "Drink Name" header row in the Inventory tab');
  }

  let lastUpdated: string | null = null;
  const bannerCell = rows[0]?.[0]?.trim() ?? "";
  const bannerMatch = bannerCell.match(/last updated\s*(.+)/i);
  if (bannerMatch) lastUpdated = bannerMatch[1].trim();

  const items: InventoryItem[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const rawName = row[0]?.trim();
    if (!rawName) continue;
    const drink = mapSheetDrinkName(rawName);
    if (!drink) continue;
    const currentStock = Number((row[3] ?? "0").replace(/[,\s]/g, "")) || 0;
    items.push({
      drink,
      currentStock,
      expiryDate: row[2]?.trim() || null,
      useByDate: row[5]?.trim() || null,
    });
  }
  return { items, lastUpdated };
}

async function fetchViaSheetsApi(): Promise<ParsedSheet> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_TAB)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets API responded ${res.status}`);
  const body = (await res.json()) as { values?: string[][] };
  return parseRows(body.values ?? []);
}

async function fetchViaPublicCsv(): Promise<ParsedSheet> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet CSV export responded ${res.status}`);
  return parseRows(rowsFromCsv(await res.text()));
}

export async function fetchInventory(): Promise<InventoryResponse> {
  try {
    const { items, lastUpdated } = API_KEY ? await fetchViaSheetsApi() : await fetchViaPublicCsv();
    if (items.length === 0) throw new Error("Inventory sheet returned no matching drink rows");
    return {
      source: "live",
      fetchedAt: new Date().toISOString(),
      sheetLastUpdated: lastUpdated,
      items,
    };
  } catch (err) {
    console.warn("[inventory] live sheet fetch failed, serving bundled snapshot:", (err as Error).message);
    return {
      source: "snapshot",
      fetchedAt: new Date().toISOString(),
      sheetLastUpdated: SNAPSHOT_LAST_UPDATED,
      items: INVENTORY_SNAPSHOT,
    };
  }
}
