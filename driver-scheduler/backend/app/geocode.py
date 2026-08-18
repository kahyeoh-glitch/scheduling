from datetime import datetime
from typing import Optional

import requests
from sqlmodel import Session, select

from .models import GeocodeCache

EXCLUDED_POSTAL = "369972"
ONEMAP_URL = "https://www.onemap.gov.sg/api/common/elastic/search"


class GeocodeResult:
    def __init__(self, lat: Optional[float], lon: Optional[float], address: str, ok: bool):
        self.lat = lat
        self.lon = lon
        self.address = address
        self.ok = ok


def geocode_postal(session: Session, postal: str) -> GeocodeResult:
    postal = postal.strip()
    if len(postal) == 5:
        postal = "0" + postal

    if EXCLUDED_POSTAL in postal:
        return GeocodeResult(None, None, "Self collection", ok=False)
    if not postal.isdigit() or len(postal) != 6:
        return GeocodeResult(None, None, "Invalid postal format", ok=False)

    cached = session.get(GeocodeCache, postal)
    if cached:
        return GeocodeResult(cached.lat, cached.lon, cached.address, ok=True)

    try:
        res = requests.get(
            ONEMAP_URL,
            params={"searchVal": postal, "returnGeom": "Y", "getAddrDetails": "Y"},
            timeout=10,
        ).json()
    except Exception as e:
        return GeocodeResult(None, None, f"API error: {e}", ok=False)

    if not (res.get("found") and int(res["found"]) > 0 and res.get("results")):
        return GeocodeResult(None, None, "Postal code not found", ok=False)

    data = res["results"][0]
    lat, lon, address = float(data["LATITUDE"]), float(data["LONGITUDE"]), data["SEARCHVAL"]

    session.add(GeocodeCache(postal=postal, lat=lat, lon=lon, address=address, fetched_at=datetime.utcnow()))
    session.commit()

    return GeocodeResult(lat, lon, address, ok=True)
