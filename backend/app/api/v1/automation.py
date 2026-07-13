import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.automation_rule import AutomationRule
from app.schemas.automation import (
    AutomationRuleCreate,
    AutomationRuleListResponse,
    AutomationRuleResponse,
    AutomationRuleUpdate,
)

router = APIRouter()


@router.get("", response_model=AutomationRuleListResponse)
def list_rules(db: DbSession, _user: CurrentUser):
    query = db.query(AutomationRule).filter(AutomationRule.brand_id == MOCK_BRAND_ID)
    total = query.count()
    rows = query.order_by(AutomationRule.created_at.desc()).limit(100).all()
    return AutomationRuleListResponse(
        rules=[AutomationRuleResponse.model_validate(r) for r in rows],
        total=total,
    )


@router.post("", response_model=AutomationRuleResponse)
def create_rule(body: AutomationRuleCreate, db: DbSession, _user: CurrentUser):
    rule = AutomationRule(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return AutomationRuleResponse.model_validate(rule)


@router.patch("/{rule_id}", response_model=AutomationRuleResponse)
def update_rule(rule_id: str, body: AutomationRuleUpdate, db: DbSession, _user: CurrentUser):
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == uuid.UUID(rule_id),
        AutomationRule.brand_id == MOCK_BRAND_ID,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return AutomationRuleResponse.model_validate(rule)


@router.delete("/{rule_id}")
def delete_rule(rule_id: str, db: DbSession, _user: CurrentUser):
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == uuid.UUID(rule_id),
        AutomationRule.brand_id == MOCK_BRAND_ID,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"ok": True}
