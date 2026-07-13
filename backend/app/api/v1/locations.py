import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationResponse, LocationListResponse
from app.core.constants import MOCK_BRAND_ID

router = APIRouter()


@router.get("", response_model=LocationListResponse)
def list_locations(db: DbSession, _user: CurrentUser):
    rows = db.query(Location).filter(Location.brand_id == MOCK_BRAND_ID).order_by(Location.name).all()
    return LocationListResponse(
        locations=[LocationResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=LocationResponse)
def create_location(body: LocationCreate, db: DbSession, _user: CurrentUser):
    loc = Location(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return LocationResponse.model_validate(loc)


@router.delete("/{location_id}")
def delete_location(location_id: str, db: DbSession, _user: CurrentUser):
    loc = db.query(Location).filter(
        Location.id == uuid.UUID(location_id),
        Location.brand_id == MOCK_BRAND_ID,
    ).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return {"ok": True}
