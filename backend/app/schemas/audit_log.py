import uuid
from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    action: str
    entity_type: str
    entity_id: str | None = None
    details: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int
