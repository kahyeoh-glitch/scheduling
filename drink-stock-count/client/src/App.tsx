import { useEffect, useMemo, useState } from "react";
import { fetchInventory } from "./api/client";
import { ALL_DRINKS, DISCONTINUING_DRINKS, MANAGED_DRINKS, MANAGED_MINIMUMS, TRACKED_DRINKS } from "./data/drinks";
import { CLIENT_INVENTORY_SNAPSHOT, CLIENT_SNAPSHOT_LAST_UPDATED } from "./data/inventorySnapshot";
import { afterOrders, managedStatus, projected } from "./lib/calculations";
import { parsePapercutCsv } from "./lib/csvParser";
import { formatHeaderDate } from "./lib/format";
import type { DiscontinuingRow, InventoryItem, ManagedRow, TrackedRow } from "./types";
import { DiscontinuingTable } from "./components/DiscontinuingTable";
import { Header } from "./components/Header";
import { KpiRow } from "./components/KpiRow";
import { ManagedTable } from "./components/ManagedTable";
import { StockChart } from "./components/StockChart";
import { TrackedTable } from "./components/TrackedTable";
import { UploadPanel, type CsvSummary } from "./components/UploadPanel";

const EDITABLE_DRINKS = [...MANAGED_DRINKS, ...TRACKED_DRINKS];

function zeroMap(keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}

export default function App() {
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});
  const [inventoryMeta, setInventoryMeta] = useState<{ source: "live" | "snapshot" | "offline"; sheetLastUpdated: string | null } | null>(
    null,
  );
  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [goingOutByDrink, setGoingOutByDrink] = useState<Record<string, number>>(() => zeroMap(ALL_DRINKS));
  const [incomingByDrink, setIncomingByDrink] = useState<Record<string, number>>(() => zeroMap(EDITABLE_DRINKS));
  const [csvSummary, setCsvSummary] = useState<CsvSummary | null>(null);
  const [headerDate, setHeaderDate] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    fetchInventory()
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, InventoryItem> = {};
        for (const item of res.items) map[item.drink] = item;
        setInventory(map);
        setInventoryMeta({ source: res.source, sheetLastUpdated: res.sheetLastUpdated });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // No /api/inventory reachable at all (e.g. a static-only deploy with
        // no backend) — fall back to a bundled snapshot rather than showing
        // every drink at zero stock.
        console.warn("Inventory API unavailable, using bundled snapshot:", err.message);
        const map: Record<string, InventoryItem> = {};
        for (const item of CLIENT_INVENTORY_SNAPSHOT) map[item.drink] = item;
        setInventory(map);
        setInventoryMeta({ source: "offline", sheetLastUpdated: CLIENT_SNAPSHOT_LAST_UPDATED });
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFile(file: File) {
    file.text().then((text) => {
      const result = parsePapercutCsv(text);
      setGoingOutByDrink(() => {
        const next: Record<string, number> = {};
        for (const drink of ALL_DRINKS) next[drink] = result.goingOut[drink] ?? 0;
        return next;
      });
      setIncomingByDrink(zeroMap(EDITABLE_DRINKS));
      setHeaderDate(new Date());
      setCsvSummary({ fileName: file.name, rowCount: result.rowCount, unmatched: result.unmatched });
    });
  }

  function handleIncomingChange(drink: string, value: number) {
    setIncomingByDrink((prev) => ({ ...prev, [drink]: value }));
  }

  const managedRows: ManagedRow[] = useMemo(
    () =>
      MANAGED_DRINKS.map((drink) => {
        const currentStock = inventory[drink]?.currentStock ?? 0;
        const goingOut = goingOutByDrink[drink] ?? 0;
        const incoming = incomingByDrink[drink] ?? 0;
        const after = afterOrders(currentStock, goingOut);
        const minimum = MANAGED_MINIMUMS[drink];
        return {
          drink,
          minimum,
          currentStock,
          goingOut,
          incoming,
          afterOrders: after,
          projected: projected(after, incoming),
          status: managedStatus(currentStock, minimum),
          expiryDate: inventory[drink]?.expiryDate ?? null,
        };
      }),
    [inventory, goingOutByDrink, incomingByDrink],
  );

  const trackedRows: TrackedRow[] = useMemo(
    () =>
      TRACKED_DRINKS.map((drink) => {
        const currentStock = inventory[drink]?.currentStock ?? 0;
        const goingOut = goingOutByDrink[drink] ?? 0;
        return {
          drink,
          currentStock,
          goingOut,
          incoming: incomingByDrink[drink] ?? 0,
          afterOrders: afterOrders(currentStock, goingOut),
          expiryDate: inventory[drink]?.expiryDate ?? null,
        };
      }),
    [inventory, goingOutByDrink, incomingByDrink],
  );

  const discontinuingRows: DiscontinuingRow[] = useMemo(
    () =>
      DISCONTINUING_DRINKS.map((drink) => {
        const currentStock = inventory[drink]?.currentStock ?? 0;
        const goingOut = goingOutByDrink[drink] ?? 0;
        return {
          drink,
          currentStock,
          goingOut,
          remainingAfter: afterOrders(currentStock, goingOut),
          expiryDate: inventory[drink]?.expiryDate ?? null,
        };
      }),
    [inventory, goingOutByDrink],
  );

  const orderNowCount = managedRows.filter((r) => r.status === "ORDER NOW").length;
  const okCount = managedRows.length - orderNowCount;

  return (
    <div className="app">
      <Header dateLabel={formatHeaderDate(headerDate)} />
      <main className="app-main">
        {inventoryMeta?.source === "snapshot" && (
          <div className="banner banner--muted">
            Showing last-known inventory snapshot{inventoryMeta.sheetLastUpdated ? ` (sheet last updated ${inventoryMeta.sheetLastUpdated})` : ""} — live sheet unavailable.
          </div>
        )}
        {inventoryMeta?.source === "offline" && (
          <div className="banner banner--muted">
            No inventory API configured for this deployment — showing a bundled reference snapshot
            {inventoryMeta.sheetLastUpdated ? ` (as of ${inventoryMeta.sheetLastUpdated})` : ""}. Current Stock and Expiry won&apos;t
            reflect live changes.
          </div>
        )}
        {inventoryLoading && <div className="banner banner--muted">Loading inventory…</div>}

        <KpiRow orderNow={orderNowCount} ok={okCount} tracking={trackedRows.length} discontinuing={discontinuingRows.length} />
        <UploadPanel onFile={handleFile} summary={csvSummary} />
        <StockChart rows={managedRows} />
        <ManagedTable rows={managedRows} onIncomingChange={handleIncomingChange} />
        <TrackedTable rows={trackedRows} onIncomingChange={handleIncomingChange} />
        <DiscontinuingTable rows={discontinuingRows} />
      </main>
    </div>
  );
}
