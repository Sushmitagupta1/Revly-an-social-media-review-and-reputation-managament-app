import uuid
from datetime import datetime
from pydantic import BaseModel


class ResolvePolicyCreate(BaseModel):
    name: str
    auto_resolve_after_reply: bool = False
    sla_hours: int = 48
    escalate_after_hours: int | None = None


class ResolvePolicyUpdate(BaseModel):
    name: str | None = None
    auto_resolve_after_reply: bool | None = None
    sla_hours: int | None = None
    escalate_after_hours: int | None = None
    is_active: bool | None = None


class ResolvePolicyResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    name: str
    auto_resolve_after_reply: bool
    sla_hours: int
    escalate_after_hours: int | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolvePolicyListResponse(BaseModel):
    policies: list[ResolvePolicyResponse]
    total: int
