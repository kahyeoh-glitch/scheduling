import { useEffect, useState } from "react";
import type { Driver } from "../types";
import { api } from "../api/client";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#06b6d4", "#eab308", "#a855f7", "#ef4444"];

const emptyForm = {
  name: "",
  color: COLORS[0],
  shift_start: "08:00",
  shift_end: "18:00",
  mode: "dedicated" as "dedicated" | "shared",
  dedicated_prefixes: "",
  max_per_time: 2,
  active: true,
};

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setDrivers(await api.drivers.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(d: Driver) {
    setEditingId(d.id);
    setForm({
      name: d.name,
      color: d.color,
      shift_start: d.shift_start,
      shift_end: d.shift_end,
      mode: d.mode,
      dedicated_prefixes: d.dedicated_prefixes.join(", "),
      max_per_time: d.max_per_time,
      active: d.active,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name.trim(),
      color: form.color,
      shift_start: form.shift_start,
      shift_end: form.shift_end,
      mode: form.mode,
      dedicated_prefixes:
        form.mode === "dedicated"
          ? form.dedicated_prefixes
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
      max_per_time: form.max_per_time,
      active: form.active,
    };
    if (!payload.name) {
      setError("Name is required");
      return;
    }
    try {
      if (editingId) {
        await api.drivers.update(editingId, payload);
      } else {
        await api.drivers.create(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save driver");
    }
  }

  async function remove(id: number) {
    if (!confirm("Remove this driver?")) return;
    await api.drivers.remove(id);
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <div className="page">
      <div className="page-grid">
        <div className="card">
          <h2>Drivers</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Shift</th>
                  <th>Mode</th>
                  <th>Zones / Postals</th>
                  <th>Max/time</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="dot" style={{ background: d.color }} />
                    </td>
                    <td>{d.name}</td>
                    <td>
                      {d.shift_start}–{d.shift_end}
                    </td>
                    <td>{d.mode === "shared" ? "Shared pool" : "Dedicated"}</td>
                    <td className="muted">{d.mode === "dedicated" ? d.dedicated_prefixes.join(", ") : "rotates zones"}</td>
                    <td>{d.max_per_time}</td>
                    <td>{d.active ? "Yes" : "No"}</td>
                    <td>
                      <button className="link-btn" onClick={() => startEdit(d)}>
                        Edit
                      </button>
                      <button className="link-btn danger" onClick={() => remove(d.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>{editingId ? "Edit driver" : "Add driver"}</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={submit} className="form">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>

            <label>
              Color
              <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label>
                Shift start
                <input
                  type="time"
                  value={form.shift_start}
                  onChange={(e) => setForm({ ...form, shift_start: e.target.value })}
                />
              </label>
              <label>
                Shift end
                <input
                  type="time"
                  value={form.shift_end}
                  onChange={(e) => setForm({ ...form, shift_end: e.target.value })}
                />
              </label>
            </div>

            <label>
              Assignment mode
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as "dedicated" | "shared" })}
              >
                <option value="dedicated">Dedicated postal prefixes</option>
                <option value="shared">Shared pool (rotates zones fairly)</option>
              </select>
            </label>

            {form.mode === "dedicated" && (
              <label>
                Postal prefixes (comma separated)
                <input
                  value={form.dedicated_prefixes}
                  onChange={(e) => setForm({ ...form, dedicated_prefixes: e.target.value })}
                  placeholder="e.g. 60, 59, 12, 13"
                />
              </label>
            )}

            <label>
              Max stops at the same time
              <input
                type="number"
                min={1}
                value={form.max_per_time}
                onChange={(e) => setForm({ ...form, max_per_time: Number(e.target.value) })}
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>

            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary">
                {editingId ? "Save changes" : "Add driver"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
