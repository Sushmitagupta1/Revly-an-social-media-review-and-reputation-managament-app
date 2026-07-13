import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.resolve_policy import ResolvePolicy
from app.schemas.resolve import (
    ResolvePolicyCreate, ResolvePolicyUpdate, ResolvePolicyResponse, ResolvePolicyListResponse,
)

router = APIRouter()


@router.get("", response_model=ResolvePolicyListResponse)
def list_policies(db: DbSession, _user: CurrentUser):
    query = db.query(ResolvePolicy).filter(ResolvePolicy.brand_id == MOCK_BRAND_ID)
    total = query.count()
    rows = query.order_by(ResolvePolicy.created_at.desc()).limit(100).all()
    return ResolvePolicyListResponse(
        policies=[ResolvePolicyResponse.model_validate(r) for r in rows],
        total=total,
    )


@router.post("", response_model=ResolvePolicyResponse)
def create_policy(body: ResolvePolicyCreate, db: DbSession, _user: CurrentUser):
    policy = ResolvePolicy(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return ResolvePolicyResponse.model_validate(policy)


@router.patch("/{policy_id}", response_model=ResolvePolicyResponse)
def update_policy(policy_id: str, body: ResolvePolicyUpdate, db: DbSession, _user: CurrentUser):
    policy = db.query(ResolvePolicy).filter(
        ResolvePolicy.id == uuid.UUID(policy_id),
        ResolvePolicy.brand_id == MOCK_BRAND_ID,
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(policy, k, v)
    db.commit()
    db.refresh(policy)
    return ResolvePolicyResponse.model_validate(policy)


@router.delete("/{policy_id}")
def delete_policy(policy_id: str, db: DbSession, _user: CurrentUser):
    policy = db.query(ResolvePolicy).filter(
        ResolvePolicy.id == uuid.UUID(policy_id),
        ResolvePolicy.brand_id == MOCK_BRAND_ID,
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
    return {"ok": True}
