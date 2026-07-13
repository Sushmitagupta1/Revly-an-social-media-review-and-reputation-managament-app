import uuid
from datetime import datetime

from pydantic import BaseModel


class AutomationRuleCreate(BaseModel):
    name: str
    trigger: str
    action: str
    template: str | None = None


class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    trigger: str | None = None
    action: str | None = None
    template: str | None = None
    is_active: bool | None = None


class AutomationRuleResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    name: str
    trigger: str
    action: str
    template: str | None
    is_active: bool
    execution_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AutomationRuleListResponse(BaseModel):
    rules: list[AutomationRuleResponse]
    total: int
