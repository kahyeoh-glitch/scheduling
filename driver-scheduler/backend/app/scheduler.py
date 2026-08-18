"""
Driver assignment engine.

Replaces the fixed-priority "first eligible driver wins" approach with a
best-fit heuristic (nearest existing stop, tie-broken by current load), a
distance/duration-aware gap between batches instead of a flat buffer, a
fairness-tracked zone rotation for the shared driver pool (instead of a
hand-written day-of-week table that doesn't evenly divide into 7 days), and
nearest-neighbor stop sequencing within each finished batch.
"""

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from .models import Driver, Zone, ZoneServiceStat, Stop

CLUSTER_THRESHOLD_KM = 5.0
BATCH_TIME_WINDOW_MINUTES = 45
SERVICE_MINUTES_PER_STOP = 8
AVG_SPEED_KMH = 25.0
RETURN_BUFFER_MINUTES = 20


@dataclass
class OrderInput:
    postal: str
    time_str: str
    event_no: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    address: Optional[str] = None
    geocode_ok: bool = True
    reason: Optional[str] = None


@dataclass
class ScheduledStop:
    order: OrderInput
    time_minutes: int
    driver_id: Optional[int] = None
    batch_index: Optional[int] = None
    sequence: Optional[int] = None
    status: str = "pending"
    reason: Optional[str] = None


def time_to_minutes(t: str) -> int:
    dt = datetime.strptime(t, "%H:%M")
    return dt.hour * 60 + dt.minute


def haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dphi = math.radians(b_lat - a_lat)
    dlambda = math.radians(b_lon - a_lon)
    x = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(x))


def assign_zones_for_run(session: Session, shared_drivers: list[Driver], zones: list[Zone]) -> dict[int, list[Zone]]:
    """Fairly hand each rotating zone to a shared-pool driver for this run.

    Picks the (driver, zone) pair with the lowest historical service_count
    first, so exposure evens out over time regardless of how many days are
    in a week -- this replaces the old static day-of-week table, which gave
    one zone combination half the exposure of the others.
    """
    if not shared_drivers or not zones:
        return {}

    stats: dict[tuple[int, int], ZoneServiceStat] = {}
    for driver in shared_drivers:
        for zone in zones:
            stat = session.exec(
                select(ZoneServiceStat).where(
                    ZoneServiceStat.driver_id == driver.id, ZoneServiceStat.zone_id == zone.id
                )
            ).first()
            if not stat:
                stat = ZoneServiceStat(driver_id=driver.id, zone_id=zone.id, service_count=0)
                session.add(stat)
                session.commit()
                session.refresh(stat)
            stats[(driver.id, zone.id)] = stat

    pairs = sorted(
        ((stats[(d.id, z.id)].service_count, d.id, z.id) for d in shared_drivers for z in zones),
        key=lambda p: (p[0], p[1], p[2]),
    )

    assignment: dict[int, list[Zone]] = {}
    driver_has_zone: set[int] = set()
    zone_taken: set[int] = set()
    zone_by_id = {z.id: z for z in zones}

    for _, driver_id, zone_id in pairs:
        if driver_id in driver_has_zone or zone_id in zone_taken:
            continue
        assignment.setdefault(driver_id, []).append(zone_by_id[zone_id])
        driver_has_zone.add(driver_id)
        zone_taken.add(zone_id)

    # Leftover zones (more zones than shared drivers): hand each to whichever
    # driver currently has the lowest total service_count across all zones.
    for zone in zones:
        if zone.id in zone_taken:
            continue
        best_driver = min(shared_drivers, key=lambda d: stats[(d.id, zone.id)].service_count)
        assignment.setdefault(best_driver.id, []).append(zone)

    return assignment


def record_zone_service(session: Session, assignment: dict[int, list[Zone]]) -> None:
    now = datetime.utcnow()
    for driver_id, zones in assignment.items():
        for zone in zones:
            stat = session.exec(
                select(ZoneServiceStat).where(
                    ZoneServiceStat.driver_id == driver_id, ZoneServiceStat.zone_id == zone.id
                )
            ).first()
            if stat:
                stat.service_count += 1
                stat.last_assigned_at = now
                session.add(stat)
    session.commit()


def _postal_matches(postal: str, prefixes: list[str]) -> bool:
    return any(postal.startswith(p) for p in prefixes)


class Batch:
    def __init__(self):
        self.stops: list[ScheduledStop] = []

    def min_time(self) -> int:
        return min(s.time_minutes for s in self.stops)

    def max_time(self) -> int:
        return max(s.time_minutes for s in self.stops)

    def estimated_duration_minutes(self) -> float:
        """Rough route time: service time per stop + travel between consecutive stops
        (nearest-neighbor order), at an assumed average speed."""
        n = len(self.stops)
        service = n * SERVICE_MINUTES_PER_STOP
        travel_km = 0.0
        remaining = list(self.stops)
        current = remaining.pop(0)
        while remaining:
            nxt = min(remaining, key=lambda s: _dist(current, s))
            travel_km += _dist(current, nxt)
            current = nxt
            remaining.remove(nxt)
        travel_minutes = (travel_km / AVG_SPEED_KMH) * 60 if AVG_SPEED_KMH else 0
        return service + travel_minutes


def _dist(a: ScheduledStop, b: ScheduledStop) -> float:
    if a.order.lat is None or b.order.lat is None:
        return 0.0
    return haversine_km(a.order.lat, a.order.lon, b.order.lat, b.order.lon)


def _can_append(stop: ScheduledStop, batch: Batch, max_per_time: int) -> bool:
    if not batch.stops:
        return True
    new_min = min(batch.min_time(), stop.time_minutes)
    new_max = max(batch.max_time(), stop.time_minutes)
    if new_max - new_min > BATCH_TIME_WINDOW_MINUTES:
        return False
    for existing in batch.stops:
        if _dist(stop, existing) > CLUSTER_THRESHOLD_KM:
            return False
    same_time_count = sum(1 for s in batch.stops if s.time_minutes == stop.time_minutes)
    if same_time_count >= max_per_time:
        return False
    return True


def _can_start_new_batch(stop: ScheduledStop, last_batch: Optional[Batch]) -> bool:
    if last_batch is None or not last_batch.stops:
        return True
    gap_needed = last_batch.estimated_duration_minutes() + RETURN_BUFFER_MINUTES
    gap_actual = stop.time_minutes - last_batch.max_time()
    return gap_actual >= gap_needed


def run_scheduler(
    orders: list[OrderInput],
    drivers: list[Driver],
    zone_assignment_for_shared: dict[int, list[Zone]],
) -> list[ScheduledStop]:
    """Best-fit assignment: for each order (earliest first), pick the eligible
    driver who can take it with the smallest resulting travel distance,
    tie-broken by whichever driver currently has fewer stops -- instead of
    always offering it to the first driver in a fixed priority list."""

    driver_by_id = {d.id: d for d in drivers}
    batches: dict[int, list[Batch]] = {d.id: [] for d in drivers}
    load: dict[int, int] = {d.id: 0 for d in drivers}

    scheduled: list[ScheduledStop] = []
    for order in orders:
        if not order.geocode_ok:
            scheduled.append(
                ScheduledStop(order=order, time_minutes=-1, status="geocode_failed", reason=order.reason)
            )
            continue
        try:
            minutes = time_to_minutes(order.time_str)
        except ValueError:
            scheduled.append(
                ScheduledStop(order=order, time_minutes=-1, status="unassigned", reason=f"Invalid time: {order.time_str}")
            )
            continue
        scheduled.append(ScheduledStop(order=order, time_minutes=minutes))

    pending = [s for s in scheduled if s.status == "pending"]
    pending.sort(key=lambda s: s.time_minutes)

    for stop in pending:
        best_driver: Optional[Driver] = None
        best_mode = None  # "append" | "new"
        best_score = None

        for driver in drivers:
            start_min = time_to_minutes(driver.shift_start)
            end_min = time_to_minutes(driver.shift_end)
            if not (start_min <= stop.time_minutes <= end_min):
                continue

            if driver.mode == "dedicated":
                if not _postal_matches(stop.order.postal, driver.dedicated_prefixes):
                    continue
            else:
                zones = zone_assignment_for_shared.get(driver.id, [])
                if not any(_postal_matches(stop.order.postal, z.prefixes) for z in zones):
                    continue

            driver_batches = batches[driver.id]
            last_batch = driver_batches[-1] if driver_batches else None

            if last_batch and _can_append(stop, last_batch, driver.max_per_time):
                dist = min(_dist(stop, s) for s in last_batch.stops)
                score = (dist, load[driver.id])
                mode = "append"
            elif _can_start_new_batch(stop, last_batch):
                score = (0.0, load[driver.id])
                mode = "new"
            else:
                continue

            if best_score is None or score < best_score:
                best_driver, best_mode, best_score = driver, mode, score

        if best_driver is None:
            stop.status = "unassigned"
            stop.reason = "No eligible driver available (shift hours, zone, or batching constraints)"
            continue

        driver_batches = batches[best_driver.id]
        if best_mode == "new" or not driver_batches:
            driver_batches.append(Batch())
        driver_batches[-1].stops.append(stop)

        stop.driver_id = best_driver.id
        stop.batch_index = len(driver_batches)
        stop.status = "assigned"
        load[best_driver.id] += 1

    # Nearest-neighbor sequencing within each finished batch.
    for driver_id, driver_batches in batches.items():
        for batch in driver_batches:
            if not batch.stops:
                continue
            remaining = sorted(batch.stops, key=lambda s: s.time_minutes)
            ordered = [remaining.pop(0)]
            while remaining:
                nxt = min(remaining, key=lambda s: _dist(ordered[-1], s))
                ordered.append(nxt)
                remaining.remove(nxt)
            for i, s in enumerate(ordered, start=1):
                s.sequence = i

    return scheduled
