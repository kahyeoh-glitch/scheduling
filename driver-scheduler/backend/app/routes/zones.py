from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Zone
from ..schemas import ZoneIn, ZoneOut

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _to_out(z: Zone) -> ZoneOut:
    return ZoneOut(id=z.id, name=z.name, prefixes=z.prefixes)


@router.get("", response_model=list[ZoneOut])
def list_zones(session: Session = Depends(get_session)):
    zones = session.exec(select(Zone).order_by(Zone.name)).all()
    return [_to_out(z) for z in zones]


@router.post("", response_model=ZoneOut, status_code=201)
def create_zone(payload: ZoneIn, session: Session = Depends(get_session)):
    zone = Zone(name=payload.name)
    zone.prefixes = payload.prefixes
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return _to_out(zone)


@router.put("/{zone_id}", response_model=ZoneOut)
def update_zone(zone_id: int, payload: ZoneIn, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    zone.name = payload.name
    zone.prefixes = payload.prefixes
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return _to_out(zone)


@router.delete("/{zone_id}", status_code=204)
def delete_zone(zone_id: int, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(404, "Zone not found")
    session.delete(zone)
    session.commit()
