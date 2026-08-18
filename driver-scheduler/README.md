# Driver Scheduler

A web app for assigning same-day delivery orders to drivers: geocode postal
codes, cluster nearby orders into batches per driver, and lay them out on an
interactive map.

This replaces the driver-assignment logic from an earlier desktop (Kivy)
tool, fixing several issues found in that implementation:

- **Best-fit assignment** instead of a fixed driver-priority order — each
  order goes to whichever eligible driver can take it with the least added
  travel distance (tie-broken by current load), not just "the first driver
  in the list who can take it."
- **Fair zone rotation** for the shared driver pool, tracked per (driver,
  zone) pair in the database and always handed to whoever has covered that
  zone least often — instead of a hand-written day-of-week table that gave
  one zone combination half the exposure of the others over a week.
- **Distance/duration-aware batching** — the gap required before a driver
  starts a new batch is derived from that batch's estimated size and route
  length, not a flat constant regardless of batch size.
- **Nearest-neighbor stop sequencing** within each finished batch, so the
  output is an actual route order, not just a cluster.

## Stack

- **Backend**: Python, FastAPI, SQLModel (SQLite)
- **Frontend**: React + TypeScript + Vite, Leaflet for the interactive map

## Getting started

### Backend

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --reload --port 8000
```

On first run it seeds the database (`backend/dev.db`, gitignored) with the
drivers and zones carried over from the original tool. Edit them from the
app's Drivers/Zones tabs afterward — no code changes needed.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (Vite proxies `/api/*` to the backend on :8000).

## How a run works

1. Enter stops (postal code, time, event #) on the **Run** tab, pick which
   drivers are available today, and hit **Run scheduler**.
2. The backend geocodes each postal via OneMap (cached in
   `GeocodeCache` so repeat postals don't hit the API again).
3. For each shift-eligible driver, "shared pool" drivers first get zones
   handed out fairly for the day (least-serviced zone wins); "dedicated"
   drivers just use their fixed postal-prefix list.
4. Orders are assigned earliest-first, best-fit as described above.
5. The map shows every stop colored by driver; the sidebar lists each
   driver's batches in stop order — click a batch to highlight its stops
   and route on the map. Unassigned stops are listed with why.

## Project layout

```
backend/
  app/models.py       Driver, Zone, ZoneServiceStat, Stop, GeocodeCache
  app/geocode.py       OneMap lookup + cache
  app/scheduler.py      Assignment algorithm (best-fit, fair rotation, batching, sequencing)
  app/routes/           drivers.py, zones.py, schedule.py
frontend/
  src/components/       DriversPage, ZonesPage, RunPage (map + sidebar)
  src/api/client.ts      Typed fetch wrapper
```
