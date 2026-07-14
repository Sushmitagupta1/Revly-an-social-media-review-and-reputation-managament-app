from pydantic import BaseModel


class KpiResponse(BaseModel):
    total_reviews: int
    average_rating: float
    response_rate: float
    avg_response_hours: float


class TrendPoint(BaseModel):
    date: str
    count: int
    avg_rating: float


class RatingDistribution(BaseModel):
    rating: int
    count: int


class PlatformBreakdown(BaseModel):
    platform: str
    count: int
    avg_rating: float


class SentimentBreakdown(BaseModel):
    positive: int
    negative: int
    neutral: int


class LocationSummary(BaseModel):
    location_id: str
    location_name: str
    review_count: int
    average_rating: float


class ComplaintLocation(BaseModel):
    location_id: str
    location_name: str
    count: int


class PraiseLocation(BaseModel):
    location_id: str
    location_name: str
    count: int


class RecentReview(BaseModel):
    id: str
    reviewer_name: str
    platform: str
    rating: int
    text: str | None
    sentiment: str | None
    created_at: str

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    kpis: KpiResponse
    sentiment_trend: list[TrendPoint]
    rating_distribution: list[RatingDistribution]
    platform_breakdown: list[PlatformBreakdown]
    sentiment_breakdown: SentimentBreakdown
    nps_score: int
    recent_reviews: list[RecentReview]
    top_locations: list[LocationSummary]
    bottom_locations: list[LocationSummary]
    complaints_count: int
    praises_count: int
    complaints_by_location: list[ComplaintLocation]
    praises_by_location: list[PraiseLocation]
    complaints_trend: list[TrendPoint]
    praises_trend: list[TrendPoint]
    complaint_topics: list[dict] = []
    praise_topics: list[dict] = []
