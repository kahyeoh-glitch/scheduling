from typing import Optional

from pydantic import BaseModel


class DriverIn(BaseModel):
    name: str
    color: str = "#6366f1"
    shift_start: str = "08:00"
    shift_end: str = "18:00"
    mode: str = "dedicated"  # "dedicated" | "shared"
    dedicated_prefixes: list[str] = []
    max_per_time: int = 2
    active: bool = True


class DriverOut(DriverIn):
    id: int


class ZoneIn(BaseModel):
    name: str
    prefixes: list[str]


class ZoneOut(ZoneIn):
    id: int


class StopIn(BaseModel):
    postal: str
    time: str
    event_no: str


class RunRequest(BaseModel):
    day_of_week: int
    driver_ids: list[int]
    stops: list[StopIn]
    label: Optional[str] = None


class StopOut(BaseModel):
    id: int
    postal: str
    address: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    time: str
    event_no: str
    driver_id: Optional[int]
    driver_name: Optional[str]
    driver_color: Optional[str]
    batch_index: Optional[int]
    sequence: Optional[int]
    status: str
    reason: Optional[str]


class RunResponse(BaseModel):
    run_id: int
    day_of_week: int
    stops: list[StopOut]
    zone_assignment: dict[str, list[str]]  # driver name -> zone names, for this run
