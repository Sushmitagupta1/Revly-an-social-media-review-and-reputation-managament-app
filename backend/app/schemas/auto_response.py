import uuid
from datetime import datetime

from pydantic import BaseModel


class AutoResponseCreate(BaseModel):
    sentiment: str
    topic: str
    template: str


class AutoResponseUpdate(BaseModel):
    sentiment: str | None = None
    topic: str | None = None
    template: str | None = None
    is_active: bool | None = None


class AutoResponseResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    sentiment: str
    topic: str
    template: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AutoResponseListResponse(BaseModel):
    responses: list[AutoResponseResponse]
    total: int
