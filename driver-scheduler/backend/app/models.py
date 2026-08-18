import json
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Driver(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    color: str = "#6366f1"
    shift_start: str = "08:00"  # "HH:MM"
    shift_end: str = "18:00"
    mode: str = "dedicated"  # "dedicated" | "shared"
    dedicated_prefixes_json: str = "[]"  # JSON list of postal-sector prefixes, used when mode == "dedicated"
    max_per_time: int = 2
    active: bool = True

    @property
    def dedicated_prefixes(self) -> list[str]:
        return json.loads(self.dedicated_prefixes_json)

    @dedicated_prefixes.setter
    def dedicated_prefixes(self, value: list[str]) -> None:
        self.dedicated_prefixes_json = json.dumps(value)


class Zone(SQLModel, table=True):
    """A postal-sector group that rotates fairly among 'shared' drivers day to day."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    prefixes_json: str = "[]"  # JSON list of postal-sector prefixes

    @property
    def prefixes(self) -> list[str]:
        return json.loads(self.prefixes_json)

    @prefixes.setter
    def prefixes(self, value: list[str]) -> None:
        self.prefixes_json = json.dumps(value)


class ZoneServiceStat(SQLModel, table=True):
    """Tracks how often each shared driver has covered each zone, to drive fair rotation."""

    id: Optional[int] = Field(default=None, primary_key=True)
    driver_id: int = Field(foreign_key="driver.id")
    zone_id: int = Field(foreign_key="zone.id")
    service_count: int = 0
    last_assigned_at: Optional[datetime] = None


class AssignmentRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    day_of_week: int = 0
    label: Optional[str] = None


class Stop(SQLModel, table=True):
    """A single delivery order within an AssignmentRun."""

    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: int = Field(foreign_key="assignmentrun.id")
    postal: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    time_str: str
    time_minutes: int
    event_no: str
    driver_id: Optional[int] = Field(default=None, foreign_key="driver.id")
    batch_index: Optional[int] = None
    sequence: Optional[int] = None
    status: str = "pending"  # "assigned" | "unassigned" | "geocode_failed"
    reason: Optional[str] = None


class GeocodeCache(SQLModel, table=True):
    postal: str = Field(primary_key=True)
    lat: float
    lon: float
    address: str
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
