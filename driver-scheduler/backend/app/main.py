from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .db import engine, init_db
from .models import Driver, Zone
from .routes import drivers, zones, schedule

app = FastAPI(title="Driver Scheduler")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drivers.router)
app.include_router(zones.router)
app.include_router(schedule.router)


SEED_ZONES = [
    ("Zone A", ["01", "02", "03", "04", "05", "06"]),
    ("Zone B", ["07", "08", "09", "16", "18", "19"]),
    ("Zone C", ["20", "21", "22"]),
    ("Zone D", ["23", "24"]),
]

SEED_DRIVERS = [
    dict(name="Zhi Peng", color="#eab308", shift_start="04:00", shift_end="16:15", mode="shared"),
    dict(name="Roger", color="#ef4444", shift_start="10:00", shift_end="16:15", mode="dedicated",
         dedicated_prefixes=["60", "59", "12", "13", "11", "15"]),
    dict(name="Ang", color="#ec4899", shift_start="07:30", shift_end="19:00", mode="shared"),
    dict(name="Khai", color="#06b6d4", shift_start="08:00", shift_end="19:00", mode="shared"),
    dict(name="Daeng", color="#a855f7", shift_start="10:00", shift_end="18:30", mode="dedicated",
         dedicated_prefixes=["42", "43", "44", "45", "40", "41", "47", "46", "48"]),
    dict(name="Dexter", color="#6366f1", shift_start="07:30", shift_end="19:00", mode="shared"),
    dict(name="Chua", color="#f97316", shift_start="08:00", shift_end="20:00", mode="dedicated",
         dedicated_prefixes=["30", "31", "32", "33", "43", "35", "36", "37", "38", "39", "55", "56", "57"]),
]


def seed_if_empty() -> None:
    with Session(engine) as session:
        if not session.exec(select(Zone)).first():
            for name, prefixes in SEED_ZONES:
                z = Zone(name=name)
                z.prefixes = prefixes
                session.add(z)
        if not session.exec(select(Driver)).first():
            for spec in SEED_DRIVERS:
                prefixes = spec.pop("dedicated_prefixes", [])
                d = Driver(**spec)
                d.dedicated_prefixes = prefixes
                session.add(d)
        session.commit()


@app.on_event("startup")
def on_startup():
    init_db()
    seed_if_empty()


@app.get("/api/health")
def health():
    return {"ok": True}
