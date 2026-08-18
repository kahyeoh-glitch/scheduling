from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Driver
from ..schemas import DriverIn, DriverOut

router = APIRouter(prefix="/api/drivers", tags=["drivers"])


def _to_out(d: Driver) -> DriverOut:
    return DriverOut(
        id=d.id,
        name=d.name,
        color=d.color,
        shift_start=d.shift_start,
        shift_end=d.shift_end,
        mode=d.mode,
        dedicated_prefixes=d.dedicated_prefixes,
        max_per_time=d.max_per_time,
        active=d.active,
    )


@router.get("", response_model=list[DriverOut])
def list_drivers(session: Session = Depends(get_session)):
    drivers = session.exec(select(Driver).order_by(Driver.name)).all()
    return [_to_out(d) for d in drivers]


@router.post("", response_model=DriverOut, status_code=201)
def create_driver(payload: DriverIn, session: Session = Depends(get_session)):
    driver = Driver(
        name=payload.name,
        color=payload.color,
        shift_start=payload.shift_start,
        shift_end=payload.shift_end,
        mode=payload.mode,
        max_per_time=payload.max_per_time,
        active=payload.active,
    )
    driver.dedicated_prefixes = payload.dedicated_prefixes
    session.add(driver)
    session.commit()
    session.refresh(driver)
    return _to_out(driver)


@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, payload: DriverIn, session: Session = Depends(get_session)):
    driver = session.get(Driver, driver_id)
    if not driver:
        raise HTTPException(404, "Driver not found")
    driver.name = payload.name
    driver.color = payload.color
    driver.shift_start = payload.shift_start
    driver.shift_end = payload.shift_end
    driver.mode = payload.mode
    driver.dedicated_prefixes = payload.dedicated_prefixes
    driver.max_per_time = payload.max_per_time
    driver.active = payload.active
    session.add(driver)
    session.commit()
    session.refresh(driver)
    return _to_out(driver)


@router.delete("/{driver_id}", status_code=204)
def delete_driver(driver_id: int, session: Session = Depends(get_session)):
    driver = session.get(Driver, driver_id)
    if not driver:
        raise HTTPException(404, "Driver not found")
    session.delete(driver)
    session.commit()
