import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.auto_response import AutoResponse
from app.schemas.auto_response import (
    AutoResponseCreate,
    AutoResponseListResponse,
    AutoResponseResponse,
    AutoResponseUpdate,
)

router = APIRouter()


@router.get("", response_model=AutoResponseListResponse)
def list_auto_responses(db: DbSession, _user: CurrentUser):
    query = db.query(AutoResponse).filter(AutoResponse.brand_id == MOCK_BRAND_ID)
    total = query.count()
    rows = query.order_by(AutoResponse.sentiment, AutoResponse.topic).limit(100).all()
    return AutoResponseListResponse(
        responses=[AutoResponseResponse.model_validate(r) for r in rows],
        total=total,
    )


@router.post("", response_model=AutoResponseResponse)
def create_auto_response(body: AutoResponseCreate, db: DbSession, _user: CurrentUser):
    ar = AutoResponse(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(ar)
    db.commit()
    db.refresh(ar)
    return AutoResponseResponse.model_validate(ar)


@router.patch("/{response_id}", response_model=AutoResponseResponse)
def update_auto_response(
    response_id: str,
    body: AutoResponseUpdate,
    db: DbSession,
    _user: CurrentUser,
):
    ar = db.query(AutoResponse).filter(
        AutoResponse.id == uuid.UUID(response_id),
        AutoResponse.brand_id == MOCK_BRAND_ID,
    ).first()
    if not ar:
        raise HTTPException(status_code=404, detail="Auto-response not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ar, k, v)
    db.commit()
    db.refresh(ar)
    return AutoResponseResponse.model_validate(ar)


@router.delete("/{response_id}")
def delete_auto_response(
    response_id: str,
    db: DbSession,
    _user: CurrentUser,
):
    ar = db.query(AutoResponse).filter(
        AutoResponse.id == uuid.UUID(response_id),
        AutoResponse.brand_id == MOCK_BRAND_ID,
    ).first()
    if not ar:
        raise HTTPException(status_code=404, detail="Auto-response not found")
    db.delete(ar)
    db.commit()
    return {"ok": True}
