import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.integration import Integration
from app.schemas.integration import (
    IntegrationCreate, IntegrationUpdate, IntegrationResponse, IntegrationListResponse,
)

router = APIRouter()


@router.get("", response_model=IntegrationListResponse)
def list_integrations(db: DbSession, _user: CurrentUser):
    query = db.query(Integration).filter(Integration.brand_id == MOCK_BRAND_ID)
    total = query.count()
    rows = query.order_by(Integration.platform).limit(100).all()
    return IntegrationListResponse(
        integrations=[IntegrationResponse.model_validate(r) for r in rows],
        total=total,
    )


@router.post("", response_model=IntegrationResponse)
def create_integration(body: IntegrationCreate, db: DbSession, _user: CurrentUser):
    integration = Integration(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return IntegrationResponse.model_validate(integration)


@router.patch("/{integration_id}", response_model=IntegrationResponse)
def update_integration(integration_id: str, body: IntegrationUpdate, db: DbSession, _user: CurrentUser):
    integration = db.query(Integration).filter(
        Integration.id == uuid.UUID(integration_id),
        Integration.brand_id == MOCK_BRAND_ID,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(integration, k, v)
    db.commit()
    db.refresh(integration)
    return IntegrationResponse.model_validate(integration)


@router.delete("/{integration_id}")
def delete_integration(integration_id: str, db: DbSession, _user: CurrentUser):
    integration = db.query(Integration).filter(
        Integration.id == uuid.UUID(integration_id),
        Integration.brand_id == MOCK_BRAND_ID,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    db.delete(integration)
    db.commit()
    return {"ok": True}
