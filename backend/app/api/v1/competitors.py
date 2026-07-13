import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.competitor import Competitor
from app.schemas.competitor import (
    CompetitorCreate, CompetitorUpdate, CompetitorResponse, CompetitorListResponse,
)

router = APIRouter()


@router.get("", response_model=CompetitorListResponse)
def list_competitors(db: DbSession, _user: CurrentUser):
    rows = db.query(Competitor).filter(Competitor.brand_id == MOCK_BRAND_ID).order_by(Competitor.name).all()
    return CompetitorListResponse(
        competitors=[CompetitorResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=CompetitorResponse)
def create_competitor(
    body: CompetitorCreate,
    db: DbSession,
    _user: CurrentUser,
):
    comp = Competitor(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return CompetitorResponse.model_validate(comp)


@router.patch("/{competitor_id}", response_model=CompetitorResponse)
def update_competitor(
    competitor_id: str,
    body: CompetitorUpdate,
    db: DbSession,
    _user: CurrentUser,
):
    comp = db.query(Competitor).filter(
        Competitor.id == uuid.UUID(competitor_id),
        Competitor.brand_id == MOCK_BRAND_ID,
    ).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(comp, k, v)
    db.commit()
    db.refresh(comp)
    return CompetitorResponse.model_validate(comp)


@router.delete("/{competitor_id}")
def delete_competitor(
    competitor_id: str,
    db: DbSession,
    _user: CurrentUser,
):
    comp = db.query(Competitor).filter(
        Competitor.id == uuid.UUID(competitor_id),
        Competitor.brand_id == MOCK_BRAND_ID,
    ).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")
    db.delete(comp)
    db.commit()
    return {"ok": True}
