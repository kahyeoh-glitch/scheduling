import { useEffect, useState } from "react";
import type { Zone } from "../types";
import { api } from "../api/client";

const emptyForm = { name: "", prefixes: "" };

export function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setZones(await api.zones.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(z: Zone) {
    setEditingId(z.id);
    setForm({ name: z.name, prefixes: z.prefixes.join(", ") });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = form.name.trim();
    const prefixes = form.prefixes
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!name || prefixes.length === 0) {
      setError("Name and at least one postal prefix are required");
      return;
    }
    try {
      if (editingId) {
        await api.zones.update(editingId, { name, prefixes });
      } else {
        await api.zones.create({ name, prefixes });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save zone");
    }
  }

  async function remove(id: number) {
    if (!confirm("Remove this zone? Shared-pool drivers will no longer rotate through it.")) return;
    await api.zones.remove(id);
    if (editingId === id) resetForm();
    await load();
  }

  return (
    <div className="page">
      <p className="muted intro">
        Zones are the postal groups that rotate fairly among "shared pool" drivers, day to day, based on who has
        covered each zone least often — instead of a fixed day-of-week table.
      </p>
      <div className="page-grid">
        <div className="card">
          <h2>Zones</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Postal prefixes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td>{z.name}</td>
                    <td className="muted">{z.prefixes.join(", ")}</td>
                    <td>
                      <button className="link-btn" onClick={() => startEdit(z)}>
                        Edit
                      </button>
                      <button className="link-btn danger" onClick={() => remove(z.id)}>
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
          <h2>{editingId ? "Edit zone" : "Add zone"}</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={submit} className="form">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              Postal prefixes (comma separated)
              <input
                value={form.prefixes}
                onChange={(e) => setForm({ ...form, prefixes: e.target.value })}
                placeholder="e.g. 01, 02, 03"
              />
            </label>
            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary">
                {editingId ? "Save changes" : "Add zone"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
