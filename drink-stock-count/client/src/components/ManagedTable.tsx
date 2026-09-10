import type { ManagedRow } from "../types";
import { barPercent, managedBarScale } from "../lib/calculations";
import { formatDate, formatNumber } from "../lib/format";
import { StatusPill } from "./StatusPill";
import { StockBar } from "./StockBar";

export function ManagedTable({
  rows,
  onIncomingChange,
}: {
  rows: ManagedRow[];
  onIncomingChange: (drink: string, value: number) => void;
}) {
  return (
    <section className="panel">
      <h2 className="panel__title">Managed Stock</h2>
      <div className="table-scroll">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Drink</th>
              <th className="num">Current Stock</th>
              <th className="num">Going Out</th>
              <th className="num">After Orders</th>
              <th className="num">Incoming</th>
              <th className="num">Projected</th>
              <th className="num">Minimum</th>
              <th>Stock Level</th>
              <th>Status</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const scale = managedBarScale(row.minimum, row.projected);
              const tone = row.status === "ORDER NOW" ? "red" : "green";
              return (
                <tr key={row.drink} className={row.status === "ORDER NOW" ? "row--alert" : undefined}>
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
                  <td className="num">{formatNumber(row.projected)}</td>
                  <td className="num">{formatNumber(row.minimum)}</td>
                  <td>
                    <StockBar
                      percent={barPercent(row.projected, scale)}
                      tickPercent={barPercent(row.minimum, scale)}
                      tone={tone}
                    />
                  </td>
                  <td>
                    <StatusPill label={row.status} tone={tone} />
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
