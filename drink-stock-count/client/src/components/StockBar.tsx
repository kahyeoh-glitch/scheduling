export function StockBar({
  percent,
  tickPercent,
  tone,
}: {
  percent: number;
  tickPercent?: number;
  tone: "red" | "green" | "blue";
}) {
  return (
    <div className="stock-bar" role="img" aria-label={`Stock level ${Math.round(percent)}%`}>
      <div className={`stock-bar__fill stock-bar__fill--${tone}`} style={{ width: `${percent}%` }} />
      {tickPercent !== undefined && (
        <div className="stock-bar__tick" style={{ left: `${Math.min(100, tickPercent)}%` }} />
      )}
    </div>
  );
}
