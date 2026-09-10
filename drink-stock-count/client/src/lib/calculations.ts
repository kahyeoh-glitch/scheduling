export function afterOrders(currentStock: number, goingOut: number): number {
  return currentStock - goingOut;
}

export function projected(after: number, incoming: number): number {
  return after + incoming;
}

export function managedStatus(currentStock: number, minimum: number): "ORDER NOW" | "OK" {
  return currentStock < minimum ? "ORDER NOW" : "OK";
}

// Scale for the managed-stock bar: at least 1.5x the minimum (so the
// minimum tick never sits past the halfway point) but wide enough to fit
// an overstocked projected value too.
export function managedBarScale(minimum: number, projectedValue: number): number {
  return Math.max(minimum * 1.5, projectedValue, 1);
}

export function barPercent(value: number, scale: number): number {
  return Math.min(100, Math.max(0, (value / scale) * 100));
}
