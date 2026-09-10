import type { ManagedRow } from "../types";
import { formatNumber } from "../lib/format";

const WIDTH = 880;
const HEIGHT = 300;
const MARGIN = { top: 24, right: 16, bottom: 72, left: 56 };

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export function StockChart({ rows }: { rows: ManagedRow[] }) {
  if (rows.length === 0) return null;

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const yMax = niceMax(Math.max(...rows.map((r) => Math.max(r.currentStock, r.minimum))) * 1.1);
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (yMax / tickCount) * i);
  const scaleY = (value: number) => plotHeight - (value / yMax) * plotHeight;

  const bandWidth = plotWidth / rows.length;
  const barWidth = bandWidth * 0.46;

  return (
    <section className="panel">
      <h2 className="panel__title">Current Stock vs Minimum</h2>
      <svg
        className="stock-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Bar chart of current stock against minimum threshold for managed drinks"
      >
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={0} x2={plotWidth} y1={scaleY(tick)} y2={scaleY(tick)} className="stock-chart__gridline" />
              <text x={-10} y={scaleY(tick)} textAnchor="end" dominantBaseline="middle" className="stock-chart__axis-label">
                {formatNumber(Math.round(tick))}
              </text>
            </g>
          ))}
          <line x1={0} x2={0} y1={0} y2={plotHeight} className="stock-chart__axis" />
          <line x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} className="stock-chart__axis" />

          {rows.map((row, i) => {
            const x = i * bandWidth + (bandWidth - barWidth) / 2;
            const barY = scaleY(row.currentStock);
            const minY = scaleY(row.minimum);
            const tone = row.status === "ORDER NOW" ? "red" : "green";
            const labelX = i * bandWidth + bandWidth / 2;
            return (
              <g key={row.drink}>
                <rect x={x} y={barY} width={barWidth} height={plotHeight - barY} className={`stock-chart__bar stock-chart__bar--${tone}`} />
                <line x1={x - 5} x2={x + barWidth + 5} y1={minY} y2={minY} className="stock-chart__min-line" />
                <text x={labelX} y={barY - 6} textAnchor="middle" className="stock-chart__value-label">
                  {formatNumber(row.currentStock)}
                </text>
                <text
                  x={labelX}
                  y={plotHeight + 18}
                  textAnchor="end"
                  transform={`rotate(-30 ${labelX} ${plotHeight + 18})`}
                  className="stock-chart__x-label"
                >
                  {row.drink}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="stock-chart__legend">
        <span>
          <i className="legend-swatch legend-swatch--bar" /> Current stock
        </span>
        <span>
          <i className="legend-swatch legend-swatch--line" /> Minimum threshold
        </span>
      </div>
    </section>
  );
}
