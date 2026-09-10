import type { StatusTone } from "../types";

export function KpiRow({
  orderNow,
  ok,
  tracking,
  discontinuing,
}: {
  orderNow: number;
  ok: number;
  tracking: number;
  discontinuing: number;
}) {
  const items: { label: string; value: number; tone: StatusTone }[] = [
    { label: "Order Now", value: orderNow, tone: "red" },
    { label: "OK", value: ok, tone: "green" },
    { label: "Tracking", value: tracking, tone: "blue" },
    { label: "Discontinuing", value: discontinuing, tone: "grey" },
  ];

  return (
    <div className="kpi-row">
      {items.map((item) => (
        <div key={item.label} className={`kpi-card kpi-card--${item.tone}`}>
          <span className="kpi-card__value">{item.value}</span>
          <span className="kpi-card__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
