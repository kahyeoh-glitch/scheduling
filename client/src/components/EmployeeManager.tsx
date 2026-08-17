import { useState } from "react";
import type { Employee } from "../types";
import { api } from "../api/client";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#06b6d4", "#eab308", "#a855f7", "#ef4444"];

interface Props {
  employees: Employee[];
  onChanged: () => void;
}

export function EmployeeManager({ employees, onChanged }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const color = COLORS[employees.length % COLORS.length];
      await api.employees.create({ name: name.trim(), role: role.trim() || undefined, color });
      setName("");
      setRole("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function removeEmployee(id: string) {
    if (!confirm("Remove this employee and all their shifts?")) return;
    await api.employees.remove(id);
    onChanged();
  }

  return (
    <div className="employee-panel">
      <h2>Team</h2>
      <ul className="employee-list">
        {employees.map((emp) => (
          <li key={emp.id}>
            <span className="dot" style={{ background: emp.color }} />
            <span className="emp-name">{emp.name}</span>
            {emp.role && <span className="emp-role">{emp.role}</span>}
            <button className="link-btn" onClick={() => removeEmployee(emp.id)} aria-label={`Remove ${emp.name}`}>
              ×
            </button>
          </li>
        ))}
        {employees.length === 0 && <li className="empty">No team members yet</li>}
      </ul>

      <form onSubmit={addEmployee} className="add-employee-form">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Role (optional)" value={role} onChange={(e) => setRole(e.target.value)} />
        <button type="submit" disabled={busy || !name.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}
