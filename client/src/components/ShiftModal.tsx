import { useState } from "react";
import type { Employee, Shift } from "../types";
import { api, ApiRequestError } from "../api/client";
import { fromDatetimeLocal, toDatetimeLocal } from "../dateUtils";

interface Props {
  employees: Employee[];
  initial?: Shift;
  defaultStart?: Date;
  onClose: () => void;
  onSaved: () => void;
}

export function ShiftModal({ employees, initial, defaultStart, onClose, onSaved }: Props) {
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? employees[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState(
    initial ? toDatetimeLocal(initial.startsAt) : toDatetimeLocal((defaultStart ?? new Date()).toISOString())
  );
  const [endsAt, setEndsAt] = useState(
    initial
      ? toDatetimeLocal(initial.endsAt)
      : toDatetimeLocal(new Date((defaultStart ?? new Date()).getTime() + 8 * 60 * 60 * 1000).toISOString())
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Shift[] | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(force = false) {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        employeeId,
        startsAt: fromDatetimeLocal(startsAt),
        endsAt: fromDatetimeLocal(endsAt),
        notes: notes || undefined,
        force,
      };
      if (initial) {
        await api.shifts.update(initial.id, payload);
      } else {
        await api.shifts.create(payload);
      }
      onSaved();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.overlaps) {
          setConflict(e.overlaps);
        } else {
          setError(e.message);
        }
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    setSaving(true);
    try {
      await api.shifts.remove(initial.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? "Edit shift" : "New shift"}</h2>

        <label>
          Employee
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Starts at
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>

        <label>
          Ends at
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </label>

        <label>
          Notes
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </label>

        {error && <p className="error-text">{error}</p>}

        {conflict && (
          <div className="conflict-box">
            <p>
              This overlaps with {conflict.length} existing shift{conflict.length > 1 ? "s" : ""} for this employee:
            </p>
            <ul>
              {conflict.map((c) => (
                <li key={c.id}>
                  {new Date(c.startsAt).toLocaleString()} – {new Date(c.endsAt).toLocaleTimeString()}
                </li>
              ))}
            </ul>
            <button className="btn-warning" disabled={saving} onClick={() => save(true)}>
              Save anyway
            </button>
          </div>
        )}

        <div className="modal-actions">
          {initial && (
            <button className="btn-danger" disabled={saving} onClick={handleDelete}>
              Delete
            </button>
          )}
          <div className="spacer" />
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => save(false)} disabled={saving || !employeeId}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
