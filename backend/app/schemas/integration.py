import uuid
from datetime import datetime
from pydantic import BaseModel


class IntegrationCreate(BaseModel):
    platform: str
    account_name: str
    is_connected: bool = False


class IntegrationUpdate(BaseModel):
    account_name: str | None = None
    status: str | None = None
    is_connected: bool | None = None
    last_synced: str | None = None


class IntegrationResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    platform: str
    account_name: str
    status: str
    last_synced: str | None = None
    is_connected: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class IntegrationListResponse(BaseModel):
    integrations: list[IntegrationResponse]
    total: int
