import type { StatusTone } from "../types";

export function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={`pill pill--${tone}`}>{label}</span>;
}
