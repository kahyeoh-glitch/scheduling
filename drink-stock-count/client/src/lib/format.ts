// Fixed 3-letter abbreviations, since Intl's "short" month for September
// varies by locale/ICU version ("Sep" vs "Sept") and breaks column alignment.
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatHeaderDate(date: Date): string {
  return date
    .toLocaleDateString("en-SG", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-SG");
}
