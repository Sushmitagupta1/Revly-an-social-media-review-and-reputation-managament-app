import json
import re
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.core.constants import MOCK_BRAND_ID
from app.models.review import Review

router = APIRouter()

ZOMATO_API_BASE = "https://api.zomato.com/merchant-gw/web"


def _parse_display_date(display_date: str | None) -> datetime | None:
    if not display_date:
        return None
    display_date = display_date.strip()
    now = datetime.now(timezone.utc)
    if display_date.lower() == "yesterday":
        return (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    if display_date.lower() == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    try:
        dt = datetime.strptime(display_date, "%d %b %Y")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        pass
    try:
        dt = datetime.strptime(display_date, "%d %B %Y")
        return dt.replace(tzinfo=timezone.utc)
    except ValueError:
        pass
    return None


class ZomatoAuthRequest(BaseModel):
    auth_token: str
    csrf_token: str
    mx_csrf_token: str
    cookies: str
    restaurant_ids: list[str] = []


def _build_headers(body: ZomatoAuthRequest) -> dict:
    return {
        "accept": "application/json, text/plain, */*",
        "x-client-id": "zomato_web_merchant",
        "x-zomato-app-version": "2",
        "x-zomato-csrft": body.csrf_token,
        "x-zomato-mx-csrf-token": body.mx_csrf_token,
        "x-zomato-source-identifier": "merchant-dashboard",
        "x-zomato-trace-id": "web-revly-integration",
        "referer": "https://www.zomato.com/",
        "origin": "https://www.zomato.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "cookie": body.cookies,
    }


@router.post("/connect")
async def connect_zomato(body: ZomatoAuthRequest):
    if not body.auth_token:
        raise HTTPException(status_code=400, detail="Auth token is required")

    headers = _build_headers(body)
    headers["cookie"] = f"X-Zomato-Mx-Auth-Token={body.auth_token}; {body.cookies}"

    async with httpx.AsyncClient(timeout=15) as client:
        if body.restaurant_ids:
            test_id = body.restaurant_ids[0]
        else:
            test_id = "20590610"
        resp = await client.get(
            f"{ZOMATO_API_BASE}/reviews/get/all",
            headers=headers,
            params={"res_id": test_id, "offset": 0},
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Zomato API returned {resp.status_code}: {resp.text[:500]}",
            )
        data = resp.json()

    from app.models.integration import Integration
    from datetime import datetime, timezone

    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(
            Integration.brand_id == MOCK_BRAND_ID,
            Integration.platform == "zomato",
        ).first()
        if integration:
            integration.auth_token = body.auth_token
            integration.csrf_token = body.csrf_token
            integration.mx_csrf_token = body.mx_csrf_token
            integration.cookies = body.cookies
            integration.restaurant_ids = json.dumps(body.restaurant_ids)
            integration.is_connected = True
            integration.status = "active"
            integration.last_synced = datetime.now(timezone.utc).isoformat()
        else:
            integration = Integration(
                brand_id=MOCK_BRAND_ID,
                platform="zomato",
                account_name="Zomato Partner",
                status="active",
                is_connected=True,
                auth_token=body.auth_token,
                csrf_token=body.csrf_token,
                mx_csrf_token=body.mx_csrf_token,
                cookies=body.cookies,
                restaurant_ids=json.dumps(body.restaurant_ids),
                last_synced=datetime.now(timezone.utc).isoformat(),
            )
            db.add(integration)
        db.commit()
    finally:
        db.close()

    review_count = len(data.get("reviews", []))
    return {
        "valid": True,
        "message": f"Zomato connected. Found {review_count} reviews for restaurant {test_id}. Auto-sync enabled (every 15 min).",
        "review_count": review_count,
    }


@router.post("/fetch-reviews")
async def fetch_zomato_reviews(body: ZomatoAuthRequest):
    if not body.auth_token or not body.restaurant_ids:
        raise HTTPException(status_code=400, detail="Auth token and restaurant_ids are required")

    headers = _build_headers(body)
    headers["cookie"] = f"X-Zomato-Mx-Auth-Token={body.auth_token}; {body.cookies}"

    all_reviews = []

    async with httpx.AsyncClient(timeout=60) as client:
        for res_id in body.restaurant_ids:
            offset = 0
            pages = 0
            max_pages = 20
            while pages < max_pages:
                resp = await client.get(
                    f"{ZOMATO_API_BASE}/reviews/get/all",
                    headers=headers,
                    params={"res_id": res_id, "offset": offset},
                )
                if resp.status_code != 200:
                    break

                data = resp.json()
                reviews = data.get("reviews", [])
                if not reviews:
                    break

                for r in reviews:
                    all_reviews.append(_parse_review(r, res_id))

                pagination = data.get("pagination", {})
                if not pagination.get("has_more"):
                    break
                offset = pagination.get("next_start", offset + len(reviews))
                pages += 1

    db = SessionLocal()
    saved_count = 0
    try:
        for rev in all_reviews:
            existing = db.query(Review).filter(
                Review.platform == "zomato",
                Review.platform_review_id == rev["platform_review_id"],
            ).first()
            if existing:
                continue

            review = Review(
                brand_id=MOCK_BRAND_ID,
                platform="zomato",
                platform_review_id=rev["platform_review_id"],
                reviewer_name=rev["reviewer_name"],
                reviewer_avatar_url=rev.get("reviewer_avatar_url"),
                rating=rev["rating"],
                text=rev["text"],
                sentiment=_classify_sentiment(rev["rating"], rev["text"]),
                topics=_extract_topics(rev["text"]),
            )
            review_date = _parse_display_date(rev.get("display_date"))
            if review_date:
                review.created_at = review_date
            db.add(review)
            saved_count += 1
        db.commit()
    finally:
        db.close()

    return {
        "success": True,
        "total_fetched": len(all_reviews),
        "new_saved": saved_count,
        "reviews": all_reviews[:5],
    }


def _parse_review(r: dict, res_id: str) -> dict:
    customer = r.get("customer_details", {})
    info = r.get("review_info", {})
    return {
        "platform_review_id": str(r.get("review_id", "")),
        "reviewer_name": customer.get("name", "Anonymous"),
        "reviewer_avatar_url": (customer.get("image") or {}).get("url"),
        "rating": int(info.get("rating", 0)),
        "text": r.get("review_text", ""),
        "review_type": info.get("review_type", ""),
        "display_date": info.get("display_date", ""),
        "reply_count": info.get("reply_count", 0),
        "res_id": res_id,
    }


class BulkReviewItem(BaseModel):
    platform_review_id: str
    reviewer_name: str
    rating: int
    text: str = ""
    res_id: str = ""
    location_id: str = ""
    display_date: str = ""


class BulkImportRequest(BaseModel):
    reviews: list[BulkReviewItem]


class LocationItem(BaseModel):
    res_id: str
    name: str
    subzone: str = ""
    city: str = ""
    address: str = ""


class SetupLocationsRequest(BaseModel):
    locations: list[LocationItem]


@router.post("/setup-locations")
async def setup_locations(body: SetupLocationsRequest):
    from app.models.location import Location

    db = SessionLocal()
    created = 0
    res_to_loc = {}
    try:
        for loc in body.locations:
            existing = db.query(Location).filter(
                Location.brand_id == MOCK_BRAND_ID,
                Location.name == loc.name,
            ).first()
            if existing:
                res_to_loc[loc.res_id] = str(existing.id)
                continue

            location = Location(
                brand_id=MOCK_BRAND_ID,
                name=loc.name,
                address=loc.address or f"{loc.subzone}, {loc.city}",
                city=loc.city or "Ahmedabad",
            )
            db.add(location)
            db.flush()
            res_to_loc[loc.res_id] = str(location.id)
            created += 1
        db.commit()
    finally:
        db.close()

    return {"success": True, "created": created, "mapping": res_to_loc}


@router.post("/init-integration")
async def init_zomato_integration():
    from app.models.integration import Integration
    from datetime import datetime, timezone

    db = SessionLocal()
    try:
        existing = db.query(Integration).filter(
            Integration.brand_id == MOCK_BRAND_ID,
            Integration.platform == "zomato",
        ).first()
        if existing:
            existing.is_connected = True
            existing.status = "active"
            existing.last_synced = datetime.now(timezone.utc).isoformat()
            db.commit()
            return {"success": True, "message": "Updated existing integration", "id": str(existing.id)}

        integration = Integration(
            brand_id=MOCK_BRAND_ID,
            platform="zomato",
            account_name="Zomato Partner",
            status="active",
            is_connected=True,
            last_synced=datetime.now(timezone.utc).isoformat(),
        )
        db.add(integration)
        db.commit()
        db.refresh(integration)
        return {"success": True, "message": "Created integration", "id": str(integration.id)}
    finally:
        db.close()


@router.post("/sync")
async def manual_sync():
    from app.services.zomato_sync import sync_zomato_reviews
    sync_zomato_reviews()
    return {"success": True, "message": "Sync completed"}


@router.post("/bulk-import")
async def bulk_import_reviews(body: BulkImportRequest):
    import uuid as uuid_mod

    db = SessionLocal()
    saved_count = 0
    skipped = 0
    updated_loc = 0
    try:
        for rev in body.reviews:
            existing = db.query(Review).filter(
                Review.platform == "zomato",
                Review.platform_review_id == rev.platform_review_id,
            ).first()
            if existing:
                if rev.location_id and not existing.location_id:
                    existing.location_id = uuid_mod.UUID(rev.location_id)
                    updated_loc += 1
                skipped += 1
                continue

            review = Review(
                brand_id=MOCK_BRAND_ID,
                platform="zomato",
                platform_review_id=rev.platform_review_id,
                reviewer_name=rev.reviewer_name,
                rating=rev.rating,
                text=rev.text,
                sentiment=_classify_sentiment(rev.rating, rev.text),
                topics=_extract_topics(rev.text),
            )
            if rev.location_id:
                review.location_id = uuid_mod.UUID(rev.location_id)
            review_date = _parse_display_date(rev.display_date)
            if review_date:
                review.created_at = review_date
            db.add(review)
            saved_count += 1
        db.commit()
    finally:
        db.close()

    return {
        "success": True,
        "saved": saved_count,
        "skipped": skipped,
        "updated_location": updated_loc,
    }


def _classify_sentiment(rating: int, text: str | None) -> str:
    if rating >= 4:
        return "positive"
    elif rating <= 2:
        return "negative"
    if text:
        lower = text.lower()
        if any(w in lower for w in ["bad", "worst", "terrible", "poor", "disappointed", "awful", "never", "pathetic"]):
            return "negative"
        if any(w in lower for w in ["great", "amazing", "love", "excellent", "best", "fantastic", "good", "nice"]):
            return "positive"
    return "neutral"


def _extract_topics(text: str | None) -> list[str]:
    if not text:
        return []
    lower = text.lower()
    topic_map = {
        "food_quality": ["food", "taste", "delicious", "fresh", "quality", "flavour", "flavor", "overrated"],
        "service": ["service", "staff", "waiter", "rude", "polite", "friendly", "slow", "santosh"],
        "delivery": ["delivery", "late", "quick", "fast", "packaging", "delivered"],
        "ambiance": ["ambiance", "ambience", "clean", "dirty", "atmosphere", "decor"],
        "price": ["price", "expensive", "cheap", "value", "cost", "overpriced", "affordable", "prices"],
        "portion": ["portion", "quantity", "small", "large", "enough", "size"],
    }
    topics = []
    for topic, keywords in topic_map.items():
        if any(kw in lower for kw in keywords):
            topics.append(topic)
    return topics
