import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Driver, RunResult, StopInput, StopResult } from "../types";
import { api } from "../api/client";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];

function emptyRow(): StopInput {
  return { postal: "", time: "09:00", event_no: "" };
}

export function RunPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState(() => (new Date().getDay() + 6) % 7); // Mon=0
  const [availableIds, setAvailableIds] = useState<Set<number>>(new Set());
  const [rows, setRows] = useState<StopInput[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  useEffect(() => {
    api.drivers.list().then((ds) => {
      setDrivers(ds);
      setAvailableIds(new Set(ds.filter((d) => d.active).map((d) => d.id)));
    });
  }, []);

  function toggleDriver(id: number) {
    setAvailableIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateRow(i: number, patch: Partial<StopInput>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function runScheduler() {
    setError(null);
    const stops = rows.filter((r) => r.postal.trim() && r.event_no.trim());
    if (stops.length === 0) {
      setError("Add at least one stop with a postal code and event number");
      return;
    }
    setRunning(true);
    setSelectedBatch(null);
    try {
      const res = await api.schedule.run({
        day_of_week: dayOfWeek,
        driver_ids: Array.from(availableIds),
        stops,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduler run failed");
    } finally {
      setRunning(false);
    }
  }

  const grouped = useMemo(() => {
    if (!result) return null;
    const byDriver = new Map<number, Map<number, StopResult[]>>();
    const unassigned: StopResult[] = [];
    for (const s of result.stops) {
      if (s.status !== "assigned" || s.driver_id == null || s.batch_index == null) {
        unassigned.push(s);
        continue;
      }
      if (!byDriver.has(s.driver_id)) byDriver.set(s.driver_id, new Map());
      const batches = byDriver.get(s.driver_id)!;
      if (!batches.has(s.batch_index)) batches.set(s.batch_index, []);
      batches.get(s.batch_index)!.push(s);
    }
    for (const batches of byDriver.values()) {
      for (const stops of batches.values()) {
        stops.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      }
    }
    return { byDriver, unassigned };
  }, [result]);

  const highlightedStops = useMemo(() => {
    if (!grouped || !selectedBatch) return null;
    const [driverIdStr, batchIdxStr] = selectedBatch.split(":");
    const batches = grouped.byDriver.get(Number(driverIdStr));
    return batches?.get(Number(batchIdxStr)) ?? null;
  }, [grouped, selectedBatch]);

  const totalAssigned = result?.stops.filter((s) => s.status === "assigned").length ?? 0;
  const totalUnassigned = result ? result.stops.length - totalAssigned : 0;

  return (
    <div className="page">
      <div className="run-layout">
        <div className="card run-config">
          <h2>Setup</h2>
          <label>
            Day of week
            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="muted" style={{ marginBottom: 6 }}>
              Available drivers
            </p>
            <div className="driver-checklist">
              {drivers.map((d) => (
                <label key={d.id}>
                  <input
                    type="checkbox"
                    checked={availableIds.has(d.id)}
                    onChange={() => toggleDriver(d.id)}
                  />
                  <span className="dot" style={{ background: d.color }} />
                  {d.name}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" onClick={runScheduler} disabled={running}>
            {running ? "Running…" : "Run scheduler"}
          </button>

          {result && (
            <div>
              <p className="muted" style={{ marginBottom: 6 }}>
                Zone rotation this run
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.8rem" }}>
                {Object.entries(result.zone_assignment).map(([driverName, zoneNames]) => (
                  <li key={driverName}>
                    {driverName}: {zoneNames.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "14px 18px 0" }}>
            <h2>Orders</h2>
          </div>
          <div style={{ padding: "0 18px 14px" }}>
            <table className="table stops-table">
              <thead>
                <tr>
                  <th>Postal</th>
                  <th>Time</th>
                  <th>Event #</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={row.postal}
                        onChange={(e) => updateRow(i, { postal: e.target.value })}
                        placeholder="e.g. 018956"
                      />
                    </td>
                    <td>
                      <input type="time" value={row.time} onChange={(e) => updateRow(i, { time: e.target.value })} />
                    </td>
                    <td>
                      <input value={row.event_no} onChange={(e) => updateRow(i, { event_no: e.target.value })} />
                    </td>
                    <td>
                      <button className="remove-row-btn" onClick={() => removeRow(i)} aria-label="Remove row">
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="add-row-btn" onClick={addRow}>
              + Add stop
            </button>
          </div>

          <div className="map-wrap">
            <MapContainer center={SINGAPORE_CENTER} zoom={11} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {result?.stops
                .filter((s) => s.lat != null && s.lon != null)
                .map((s) => {
                  const dimmed = highlightedStops != null && !highlightedStops.some((h) => h.id === s.id);
                  return (
                  <CircleMarker
                    key={s.id}
                    center={[s.lat!, s.lon!]}
                    radius={7}
                    pathOptions={{
                      color: s.driver_color ?? "#999",
                      fillColor: s.driver_color ?? "#999",
                      fillOpacity: dimmed ? 0.15 : 0.9,
                      opacity: dimmed ? 0.15 : 1,
                    }}
                  >
                    <Popup>
                      <strong>{s.event_no}</strong> — {s.address ?? s.postal}
                      <br />
                      {s.time} · {s.driver_name ?? "Unassigned"}
                    </Popup>
                  </CircleMarker>
                  );
                })}
              {highlightedStops && highlightedStops.length > 1 && (
                <Polyline
                  positions={highlightedStops.map((s) => [s.lat!, s.lon!] as [number, number])}
                  pathOptions={{ color: highlightedStops[0].driver_color ?? "#6366f1", weight: 3 }}
                />
              )}
            </MapContainer>
          </div>
        </div>

        <div className="sidebar">
          {result && (
            <div className="summary-bar">
              <span className="summary-pill">Total {result.stops.length}</span>
              <span className="summary-pill">Assigned {totalAssigned}</span>
              <span className="summary-pill">Unassigned {totalUnassigned}</span>
            </div>
          )}

          {grouped &&
            Array.from(grouped.byDriver.entries()).map(([driverId, batches]) => {
              const driver = drivers.find((d) => d.id === driverId);
              return (
                <div className="driver-group" key={driverId}>
                  <div className="driver-group-header">
                    <span className="dot" style={{ background: driver?.color }} />
                    {driver?.name ?? `Driver ${driverId}`}
                  </div>
                  {Array.from(batches.entries()).map(([batchIdx, stops]) => {
                    const key = `${driverId}:${batchIdx}`;
                    return (
                      <div
                        key={key}
                        className={`batch-item${selectedBatch === key ? " selected" : ""}`}
                        onClick={() => setSelectedBatch(selectedBatch === key ? null : key)}
                      >
                        <strong>Batch {batchIdx}</strong> ({stops.length} stop{stops.length > 1 ? "s" : ""})
                        {stops.map((s) => (
                          <div className="stop-row" key={s.id}>
                            <span>
                              #{s.sequence} {s.event_no}
                            </span>
                            <span className="stop-time">{s.time}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}

          {grouped && grouped.unassigned.length > 0 && (
            <div className="unassigned-group">
              <div className="unassigned-header">Unassigned ({grouped.unassigned.length})</div>
              {grouped.unassigned.map((s) => (
                <div className="unassigned-row" key={s.id}>
                  {s.event_no} · {s.postal} · {s.time}
                  <span className="reason">{s.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
