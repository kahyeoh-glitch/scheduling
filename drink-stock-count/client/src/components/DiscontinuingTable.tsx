import type { DiscontinuingRow } from "../types";
import { formatDate, formatNumber } from "../lib/format";
import { StatusPill } from "./StatusPill";

export function DiscontinuingTable({ rows }: { rows: DiscontinuingRow[] }) {
  return (
    <section className="panel">
      <h2 className="panel__title">Discontinuing</h2>
      <div className="table-scroll">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Drink</th>
              <th className="num">Current Stock</th>
              <th className="num">Going Out</th>
              <th className="num">Remaining After</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.drink}>
                <td className="drink-name">{row.drink}</td>
                <td className="num">{formatNumber(row.currentStock)}</td>
                <td className="num">{formatNumber(row.goingOut)}</td>
                <td className="num">{formatNumber(row.remainingAfter)}</td>
                <td>{formatDate(row.expiryDate)}</td>
                <td>
                  <StatusPill label="DISCONTINUING" tone="grey" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
