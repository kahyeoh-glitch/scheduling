import { useMemo } from "react";
import type { Shift } from "../types";
import { addDays, formatDayHeader, formatTime, isSameDay } from "../dateUtils";

interface Props {
  weekStart: Date;
  shifts: Shift[];
  onDayAdd: (day: Date) => void;
  onShiftClick: (shift: Shift) => void;
}

export function WeekCalendar({ weekStart, shifts, onDayAdd, onShiftClick }: Props) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = new Date();

  return (
    <div className="week-grid">
      {days.map((day) => {
        const dayShifts = shifts
          .filter((s) => isSameDay(new Date(s.startsAt), day))
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        return (
          <div className={`day-col ${isSameDay(day, today) ? "is-today" : ""}`} key={day.toISOString()}>
            <div className="day-header">
              <span>{formatDayHeader(day)}</span>
              <button className="add-shift-btn" onClick={() => onDayAdd(day)} aria-label="Add shift">
                +
              </button>
            </div>
            <div className="day-body">
              {dayShifts.map((shift) => (
                <button
                  key={shift.id}
                  className="shift-block"
                  style={{ borderLeftColor: shift.employee.color }}
                  onClick={() => onShiftClick(shift)}
                >
                  <span className="shift-time">
                    {formatTime(shift.startsAt)} – {formatTime(shift.endsAt)}
                  </span>
                  <span className="shift-employee">{shift.employee.name}</span>
                  {shift.notes && <span className="shift-notes">{shift.notes}</span>}
                </button>
              ))}
              {dayShifts.length === 0 && <div className="day-empty">No shifts</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
