import Papa from "papaparse";
import { mapPapercutName } from "./csvMapping";

export interface CsvParseResult {
  goingOut: Record<string, number>;
  unmatched: { name: string; quantity: number }[];
  rowCount: number;
}

// Papercut export columns: A Source, B Event ID, C Serving date time,
// D State, E Name, F Category, G Quantity — quantities are summed per
// mapped drink from columns E and G.
const NAME_COLUMN = 4;
const QUANTITY_COLUMN = 6;

export function parsePapercutCsv(text: string): CsvParseResult {
  const { data } = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const rows = data.slice(1);

  const goingOut: Record<string, number> = {};
  const unmatchedTotals = new Map<string, number>();

  for (const row of rows) {
    const rawName = row[NAME_COLUMN];
    if (!rawName || !rawName.trim()) continue;
    const quantity = Number(String(row[QUANTITY_COLUMN] ?? "0").replace(/[,\s]/g, "")) || 0;
    const drink = mapPapercutName(rawName);
    if (drink) {
      goingOut[drink] = (goingOut[drink] ?? 0) + quantity;
    } else {
      const key = rawName.trim();
      unmatchedTotals.set(key, (unmatchedTotals.get(key) ?? 0) + quantity);
    }
  }

  return {
    goingOut,
    unmatched: [...unmatchedTotals.entries()].map(([name, quantity]) => ({ name, quantity })),
    rowCount: rows.length,
  };
}
