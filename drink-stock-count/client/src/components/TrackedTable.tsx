import type { TrackedRow } from "../types";
import { barPercent } from "../lib/calculations";
import { formatDate, formatNumber } from "../lib/format";
import { StatusPill } from "./StatusPill";
import { StockBar } from "./StockBar";

export function TrackedTable({
  rows,
  onIncomingChange,
}: {
  rows: TrackedRow[];
  onIncomingChange: (drink: string, value: number) => void;
}) {
  return (
    <section className="panel">
      <h2 className="panel__title">Tracked Stock</h2>
      <div className="table-scroll">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Drink</th>
              <th className="num">Current Stock</th>
              <th className="num">Going Out</th>
              <th className="num">After Orders</th>
              <th className="num">Incoming</th>
              <th>Stock Level</th>
              <th>Status</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const projectedValue = row.afterOrders + row.incoming;
              const scale = Math.max(row.currentStock, projectedValue, 1);
              return (
                <tr key={row.drink}>
                  <td className="drink-name">{row.drink}</td>
                  <td className="num">{formatNumber(row.currentStock)}</td>
                  <td className="num">{formatNumber(row.goingOut)}</td>
                  <td className="num">{formatNumber(row.afterOrders)}</td>
                  <td className="num">
                    <input
                      type="number"
                      className="incoming-input"
                      min={0}
                      value={row.incoming}
                      onChange={(e) => onIncomingChange(row.drink, Number(e.target.value) || 0)}
                      aria-label={`Incoming stock for ${row.drink}`}
                    />
                  </td>
                  <td>
                    <StockBar percent={barPercent(projectedValue, scale)} tone="blue" />
                  </td>
                  <td>
                    <StatusPill label="TRACKING" tone="blue" />
                  </td>
                  <td>{formatDate(row.expiryDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
