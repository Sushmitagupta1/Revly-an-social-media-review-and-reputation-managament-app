import uuid
from datetime import datetime
from pydantic import BaseModel


class CompetitorCreate(BaseModel):
    name: str
    platform: str
    avg_rating: float | None = None
    review_count: int = 0
    url: str | None = None


class CompetitorUpdate(BaseModel):
    name: str | None = None
    platform: str | None = None
    avg_rating: float | None = None
    review_count: int | None = None
    url: str | None = None


class CompetitorResponse(BaseModel):
    id: uuid.UUID
    name: str
    platform: str
    avg_rating: float | None
    review_count: int
    url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class CompetitorListResponse(BaseModel):
    competitors: list[CompetitorResponse]
    total: int
