# Drink Stock Count

A daily procurement dashboard for Grain's drinks operations team: upload the
morning Papercut export, see which drinks need reordering against their
minimum thresholds, and log incoming stock as it's ordered.

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Vite

## Getting started

```bash
# Terminal 1 — API
cd drink-stock-count/server
npm install
cp .env.example .env
npm run dev            # http://localhost:4100

# Terminal 2 — dashboard
cd drink-stock-count/client
npm install
npm run dev            # http://localhost:5173, proxies /api to :4100
```

## How it works

### Inventory (on page load)

The dashboard reads **Current Stock** and **Expiry Date** from the "Drink
FIFO" Google Sheet's `Inventory` tab on load, via `GET /api/inventory`.

The server tries, in order:

1. Google Sheets API v4, if `GOOGLE_SHEETS_API_KEY` is set in `server/.env`
   (requires the sheet to have Sheets API access enabled for that key).
2. The sheet's public CSV export (works if it's shared "Anyone with the
   link – Viewer").
3. A bundled snapshot (`server/src/inventory/snapshot.ts`) captured from the
   sheet, so the dashboard still has real numbers if the live sheet can't be
   reached (no network, not shared publicly, sheet restructured, etc).

The dashboard shows a banner whenever it's serving the snapshot instead of a
live read, so it's obvious the numbers may be stale.

The sheet's `Drink Name` column doesn't match Papercut's naming, so the
server maps it to the dashboard's canonical drink names via
`server/src/inventory/sheetNameMap.ts` before returning it.

### CSV upload (each morning)

Uploading a Papercut order export (drag-and-drop or click-to-browse):

1. Parses **Name** (column E) and **Quantity** (column G) from every row.
2. Maps each name to a dashboard drink via `client/src/lib/csvMapping.ts`
   (the explicit rename list from the spec, falling back to an exact match
   against a canonical drink name). Unmatched line items are summed and
   shown as a small count next to the upload control — nothing is silently
   dropped without a trace.
3. Sums quantities per drink into that drink's **Going Out** for the day
   (replacing, not adding to, whatever was there before).
4. Resets every **Incoming** field to 0.
5. Sets the header date to today.

### Calculations

- **After Orders** = Current Stock − Going Out
- **Projected** = After Orders + Incoming (recomputes live as you type)
- **Managed stock status** = `ORDER NOW` if Current Stock < Minimum, else `OK`
  (based on Current Stock, not Projected)
- The managed-stock level bar reflects **Projected**, with a tick mark at
  the minimum threshold
- The tracked-stock level bar (no minimum) reflects Projected as a share of
  Current Stock, so it still reads as "how much is left after today"
- Discontinuing items have no Incoming column — **Remaining After** =
  Current Stock − Going Out

## Project layout

```
server/
  src/index.ts                       Express app, /api/inventory
  src/inventory/fetchInventory.ts     Sheets API / public CSV / snapshot fallback chain
  src/inventory/sheetNameMap.ts       Inventory sheet name → dashboard name
  src/inventory/snapshot.ts           Bundled fallback data
client/
  src/data/drinks.ts                  Managed/tracked/discontinuing drink lists + minimums
  src/lib/csvMapping.ts               Papercut CSV name → dashboard name
  src/lib/csvParser.ts                Papercut CSV → per-drink Going Out totals
  src/lib/calculations.ts             After Orders / Projected / status / bar scaling
  src/components/                     Header, KpiRow, UploadPanel, the three tables,
                                       StockChart, StockBar, StatusPill
```

## Fonts

The design uses FunkisA (bold for the title, regular/medium for body text).
Font files aren't checked in — drop them into `client/public/fonts/` as
`FunkisA-Bold.woff2`, `FunkisA-Medium.woff2`, `FunkisA-Regular.woff2` (see
the README there) and `client/src/index.css`'s existing `@font-face` rules
pick them up automatically. Until then the page falls back to a bold
system sans-serif so it always renders correctly.
