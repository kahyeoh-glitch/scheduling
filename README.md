# Shift Scheduler

A small web app for scheduling employee shifts: a weekly calendar view, a
team roster, and automatic double-booking detection.

- **Backend**: Node.js + Express + TypeScript + Prisma (SQLite)
- **Frontend**: React + TypeScript + Vite

## Features

- Add/remove team members
- Create, edit, and delete shifts on a weekly calendar
- Overlap detection: saving a shift that conflicts with an existing shift
  for the same employee is blocked (409) unless explicitly overridden
- Week navigation (prev/next/today)

## Getting started

```bash
# from the repo root
npm run install:all   # installs server + client deps
cp server/.env.example server/.env
npm run db:setup       # runs Prisma migrations + seeds sample data
npm run dev            # starts API on :4000 and the app on :5173
```

Then open http://localhost:5173. The Vite dev server proxies `/api/*`
requests to the Express backend on port 4000.

## Project layout

```
server/               Express + Prisma API
  prisma/schema.prisma   Employee + Shift models
  src/routes/            employees.ts, shifts.ts
  src/index.ts            app entrypoint
client/               React + Vite frontend
  src/components/        WeekCalendar, EmployeeManager, ShiftModal
  src/api/client.ts       typed fetch wrapper for the API
```

## API

| Method | Path                | Description                              |
|--------|----------------------|-------------------------------------------|
| GET    | /api/employees        | List employees                            |
| POST   | /api/employees        | Create an employee                        |
| PUT    | /api/employees/:id     | Update an employee                        |
| DELETE | /api/employees/:id     | Delete an employee (cascades their shifts)|
| GET    | /api/shifts?from&to    | List shifts in a date range               |
| POST   | /api/shifts            | Create a shift (409 on overlap unless `force: true`) |
| PUT    | /api/shifts/:id        | Update a shift (same overlap check)       |
| DELETE | /api/shifts/:id        | Delete a shift                            |

## Scripts

- `npm run dev` — run server + client together
- `npm run build` — type-check and build both
- `npm run db:setup` — apply migrations and seed sample data
