from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..db import get_session
from ..geocode import geocode_postal
from ..models import AssignmentRun, Driver, Stop, Zone
from ..schemas import RunRequest, RunResponse, StopOut
from ..scheduler import OrderInput, assign_zones_for_run, record_zone_service, run_scheduler

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


@router.post("/run", response_model=RunResponse)
def run(payload: RunRequest, session: Session = Depends(get_session)):
    all_drivers = session.exec(select(Driver)).all()
    driver_by_id = {d.id: d for d in all_drivers}
    available_drivers = [driver_by_id[i] for i in payload.driver_ids if i in driver_by_id and driver_by_id[i].active]

    zones = session.exec(select(Zone)).all()
    shared_drivers = [d for d in available_drivers if d.mode == "shared"]
    zone_assignment = assign_zones_for_run(session, shared_drivers, zones)

    orders: list[OrderInput] = []
    for s in payload.stops:
        geo = geocode_postal(session, s.postal)
        orders.append(
            OrderInput(
                postal=s.postal,
                time_str=s.time,
                event_no=s.event_no,
                lat=geo.lat,
                lon=geo.lon,
                address=geo.address,
                geocode_ok=geo.ok,
                reason=None if geo.ok else geo.address,
            )
        )

    scheduled = run_scheduler(orders, available_drivers, zone_assignment)

    run_row = AssignmentRun(day_of_week=payload.day_of_week, label=payload.label)
    session.add(run_row)
    session.commit()
    session.refresh(run_row)

    if any(s.status == "assigned" for s in scheduled):
        record_zone_service(session, zone_assignment)

    stop_rows: list[Stop] = []
    for s in scheduled:
        row = Stop(
            run_id=run_row.id,
            postal=s.order.postal,
            address=s.order.address,
            lat=s.order.lat,
            lon=s.order.lon,
            time_str=s.order.time_str,
            time_minutes=s.time_minutes,
            event_no=s.order.event_no,
            driver_id=s.driver_id,
            batch_index=s.batch_index,
            sequence=s.sequence,
            status=s.status,
            reason=s.reason,
        )
        session.add(row)
        stop_rows.append(row)
    session.commit()
    for row in stop_rows:
        session.refresh(row)

    stops_out = [
        StopOut(
            id=row.id,
            postal=row.postal,
            address=row.address,
            lat=row.lat,
            lon=row.lon,
            time=row.time_str,
            event_no=row.event_no,
            driver_id=row.driver_id,
            driver_name=driver_by_id[row.driver_id].name if row.driver_id else None,
            driver_color=driver_by_id[row.driver_id].color if row.driver_id else None,
            batch_index=row.batch_index,
            sequence=row.sequence,
            status=row.status,
            reason=row.reason,
        )
        for row in stop_rows
    ]

    zone_assignment_out = {
        driver_by_id[driver_id].name: [z.name for z in zones_list]
        for driver_id, zones_list in zone_assignment.items()
    }

    return RunResponse(
        run_id=run_row.id,
        day_of_week=payload.day_of_week,
        stops=stops_out,
        zone_assignment=zone_assignment_out,
    )
