import { useCallback, useEffect, useState } from "react";
import "./index.css";
import type { Employee, Shift } from "./types";
import { api } from "./api/client";
import { addDays, startOfWeek } from "./dateUtils";
import { WeekCalendar } from "./components/WeekCalendar";
import { EmployeeManager } from "./components/EmployeeManager";
import { ShiftModal } from "./components/ShiftModal";

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ shift?: Shift; defaultStart?: Date } | null>(null);

  const loadEmployees = useCallback(async () => {
    setEmployees(await api.employees.list());
  }, []);

  const loadShifts = useCallback(async () => {
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    setShifts(await api.shifts.list({ from, to }));
  }, [weekStart]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEmployees(), loadShifts()]).finally(() => setLoading(false));
  }, [loadEmployees, loadShifts]);

  function refreshAll() {
    setModalState(null);
    loadEmployees();
    loadShifts();
  }

  const weekEnd = addDays(weekStart, 6);
  const rangeLabel = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" }
  )}`;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Shift Scheduler</h1>
        <div className="week-nav">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))}>‹ Prev</button>
          <span className="range-label">{rangeLabel}</span>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))}>Next ›</button>
        </div>
      </header>

      <div className="app-body">
        <EmployeeManager employees={employees} onChanged={refreshAll} />

        <main className="calendar-area">
          {loading ? (
            <p className="loading">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="loading">Add a team member to start scheduling shifts.</p>
          ) : (
            <WeekCalendar
              weekStart={weekStart}
              shifts={shifts}
              onDayAdd={(day) => setModalState({ defaultStart: day })}
              onShiftClick={(shift) => setModalState({ shift })}
            />
          )}
        </main>
      </div>

      {modalState && (
        <ShiftModal
          employees={employees}
          initial={modalState.shift}
          defaultStart={modalState.defaultStart}
          onClose={() => setModalState(null)}
          onSaved={refreshAll}
        />
      )}
    </div>
  );
}
