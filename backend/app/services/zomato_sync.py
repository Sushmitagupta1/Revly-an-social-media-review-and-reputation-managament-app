import json
import logging
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.core.constants import MOCK_BRAND_ID
from app.core.database import SessionLocal
from app.models.integration import Integration
from app.models.review import Review

logger = logging.getLogger("zomato_sync")

ZOMATO_API_BASE = "https://api.zomato.com/merchant-gw/web"


def _build_headers(integration: Integration) -> dict:
    return {
        "accept": "application/json, text/plain, */*",
        "x-client-id": "zomato_web_merchant",
        "x-zomato-app-version": "2",
        "x-zomato-csrft": integration.csrf_token or "",
        "x-zomato-mx-csrf-token": integration.mx_csrf_token or "",
        "x-zomato-source-identifier": "merchant-dashboard",
        "x-zomato-trace-id": "web-revly-autosync",
        "referer": "https://www.zomato.com/",
        "origin": "https://www.zomato.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "cookie": f"X-Zomato-Mx-Auth-Token={integration.auth_token}; {integration.cookies or ''}",
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


def _resolve_location_ids(db, restaurant_ids: list[str]) -> dict[str, str]:
    from app.models.location import Location
    rows = db.query(Location.id, Location.name).all()
    name_to_id = {r.name: str(r.id) for r in rows}
    res_to_loc = {}
    for res_id in restaurant_ids:
        for name, loc_id in name_to_id.items():
            res_to_loc[res_id] = loc_id
            break
    return res_to_loc


def sync_zomato_reviews():
    """Fetch new reviews from Zomato for all connected integrations."""
    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(
            Integration.brand_id == MOCK_BRAND_ID,
            Integration.platform == "zomato",
            Integration.is_connected == True,
        ).first()

        if not integration:
            logger.debug("No connected Zomato integration found, skipping sync")
            return

        if not integration.auth_token:
            logger.warning("Zomato integration has no auth token, skipping sync")
            return

        restaurant_ids = []
        if integration.restaurant_ids:
            try:
                restaurant_ids = json.loads(integration.restaurant_ids)
            except (json.JSONDecodeError, TypeError):
                restaurant_ids = []

        if not restaurant_ids:
            logger.warning("No restaurant IDs configured, skipping sync")
            return

        headers = _build_headers(integration)
        new_count = 0
        updated_count = 0

        with httpx.Client(timeout=60) as client:
            for res_id in restaurant_ids:
                offset = 0
                pages = 0
                max_pages = 5

                while pages < max_pages:
                    try:
                        resp = client.get(
                            f"{ZOMATO_API_BASE}/reviews/get/all",
                            headers=headers,
                            params={"res_id": res_id, "offset": offset},
                        )
                        if resp.status_code != 200:
                            logger.warning(f"Zomato API returned {resp.status_code} for restaurant {res_id}")
                            break

                        data = resp.json()
                        reviews = data.get("reviews", [])
                        if not reviews:
                            break

                        for r in reviews:
                            customer = r.get("customer_details", {})
                            info = r.get("review_info", {})
                            platform_review_id = str(r.get("review_id", ""))

                            existing = db.query(Review).filter(
                                Review.platform == "zomato",
                                Review.platform_review_id == platform_review_id,
                            ).first()

                            if existing:
                                if existing.rating != int(info.get("rating", 0)):
                                    existing.rating = int(info.get("rating", 0))
                                    existing.sentiment = _classify_sentiment(
                                        existing.rating, existing.text
                                    )
                                    updated_count += 1
                                continue

                            rating = int(info.get("rating", 0))
                            text = r.get("review_text", "")
                            review = Review(
                                brand_id=MOCK_BRAND_ID,
                                platform="zomato",
                                platform_review_id=platform_review_id,
                                reviewer_name=customer.get("name", "Anonymous"),
                                reviewer_avatar_url=(customer.get("image") or {}).get("url"),
                                rating=rating,
                                text=text,
                                sentiment=_classify_sentiment(rating, text),
                                topics=_extract_topics(text),
                            )
                            db.add(review)
                            new_count += 1

                        pagination = data.get("pagination", {})
                        if not pagination.get("has_more"):
                            break
                        offset = pagination.get("next_start", offset + len(reviews))
                        pages += 1

                    except Exception as e:
                        logger.error(f"Error fetching reviews for restaurant {res_id}: {e}")
                        break

        db.commit()

        integration.last_synced = datetime.now(timezone.utc).isoformat()
        db.commit()

        logger.info(f"Zomato sync complete: {new_count} new, {updated_count} updated")

    except Exception as e:
        logger.error(f"Zomato sync failed: {e}")
        db.rollback()
    finally:
        db.close()
