import uuid
from datetime import datetime
from pydantic import BaseModel


class LocationCreate(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None


class LocationResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str | None
    city: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class LocationListResponse(BaseModel):
    locations: list[LocationResponse]
    total: int
