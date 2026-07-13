import uuid
from datetime import datetime

from pydantic import BaseModel


class ReviewResponse(BaseModel):
    id: uuid.UUID
    platform: str
    reviewer_name: str
    reviewer_avatar_url: str | None
    rating: int
    text: str | None
    sentiment: str | None
    topics: list[str] | None
    is_resolved: bool
    location_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
    page: int
    pages: int


class ReviewResolveRequest(BaseModel):
    is_resolved: bool


class InboxResponse(BaseModel):
    reviews: list[ReviewResponse]
    total: int
    page: int
    pages: int


class ReviewStatsResponse(BaseModel):
    total: int
    average_rating: float
    by_platform: dict[str, int]
    by_sentiment: dict[str, int]
    by_rating: dict[int, int]
