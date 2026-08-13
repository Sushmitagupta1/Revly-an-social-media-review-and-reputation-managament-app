import json
import logging
import time
import uuid
from datetime import datetime, timezone

import httpx

from app.core.constants import MOCK_BRAND_ID
from app.core.database import SessionLocal
from app.models.integration import Integration
from app.models.review import Review

logger = logging.getLogger("swiggy_sync")

SWIGGY_GQL_URL = "https://vhc-composer.swiggy.com/query"
PAGE_SIZE = 100


def _gql_request(token: str, query: str) -> dict:
    """POST a GraphQL query to the Swiggy VHC composer, returning parsed JSON."""
    resp = httpx.post(
        SWIGGY_GQL_URL,
        headers={
            "access_token": token,
            "Content-Type": "application/json",
        },
        json={"query": query},
        timeout=30,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Swiggy GraphQL returned {resp.status_code}: {resp.text[:300]}")
    return resp.json()


def _gql_data(token: str, query: str) -> dict:
    body = _gql_request(token, query)
    if "errors" in body:
        raise RuntimeError(f"Swiggy GraphQL errors: {json.dumps(body['errors'])[:500]}")
    return body.get("data", {})


def fetch_restaurants(token: str) -> list[dict]:
    """Fetch the merchant's restaurants via get_user."""
    query = """
    {
      get_user {
        id
        restaurants {
          rest_id
          rest_name
          area_id
          locality
          city_name
          city_id
          rating
          isPOS
        }
      }
    }
    """
    data = _gql_data(token, query)
    return (data.get("get_user") or {}).get("restaurants", []) or []


def _build_ratings_query(rest_ids: list[str], start_ms: int, end_ms: int, page_size: int) -> str:
    ids = ", ".join(f'"{r}"' for r in rest_ids)
    return f"""
    query {{
      getRestaurantRatingsAndReviews(requestInput: {{
        restaurantIds: [{ids}]
        startDateEpoch: {int(start_ms)}
        endDateEpoch: {int(end_ms)}
        pageSize: {page_size}
      }}) {{
        ordersInfo {{
          orderID
          restaurantID
          rating
          ratingState
          customerReview
          orderTimeEpoch
          ratingTimeEpoch
          itemsInfo {{
            name
            quantity
            subTotal
            isVeg
            category
          }}
          customerInfo {{
            id
            name
            type
          }}
        }}
      }}
    }}
    """


def fetch_reviews_page(token: str, rest_ids: list[str], start_ms: int, end_ms: int) -> list[dict]:
    """Fetch one page (up to PAGE_SIZE) of order reviews for the given restaurants/time window."""
    query = _build_ratings_query(rest_ids, start_ms, end_ms, PAGE_SIZE)
    data = _gql_data(token, query)
    return (data.get("getRestaurantRatingsAndReviews") or {}).get("ordersInfo", []) or []


def fetch_order_details(token: str, order_id: str, restaurant_id: str) -> dict | None:
    """Fetch bill/order details for a single order."""
    query = f"""
    {{
      getOrderRatingDetails(orderId: "{order_id}", restaurantId: "{restaurant_id}") {{
        orderInfo {{
          orderID
          rating
          ratingState
          customerReview
          orderTimeEpoch
          itemsInfo {{
            name
            quantity
            subTotal
            isVeg
            category
          }}
          customerInfo {{
            id
            name
            type
          }}
        }}
        billDetails {{
          itemTotal
          billTotal
          discount
          couponCode
        }}
      }}
    }}
    """
    try:
        data = _gql_data(token, query)
    except RuntimeError:
        return None
    return (data.get("getOrderRatingDetails") or {})


def _parse_epoch_ms(value) -> datetime | None:
    """orderTimeEpoch is seconds, ratingTimeEpoch is ms. Accept either."""
    if value is None:
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        return None
    if value > 10_000_000_000:
        value = value / 1000.0
    return datetime.fromtimestamp(value, tz=timezone.utc)


def _classify_sentiment(rating: int, text: str | None) -> str:
    if rating >= 4:
        return "positive"
    if rating <= 2:
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
        "service": ["service", "staff", "waiter", "rude", "polite", "friendly", "slow"],
        "delivery": ["delivery", "late", "quick", "fast", "packaging", "delivered"],
        "ambience": ["ambiance", "ambience", "clean", "dirty", "atmosphere", "decor"],
        "pricing": ["price", "expensive", "cheap", "value", "cost", "overpriced", "affordable", "prices"],
        "portion": ["portion", "quantity", "small", "large", "enough", "size"],
    }
    topics = []
    for topic, keywords in topic_map.items():
        if any(kw in lower for kw in keywords):
            topics.append(topic)
    return topics


def _match_location_id(restaurant: dict, locations: list[tuple[str, str]]) -> str | None:
    """Match a Swiggy restaurant to a Revly Location by locality/name.

    locations: list of (location_id, location_name).
    """
    rest_name = (restaurant.get("rest_name") or "").strip().lower()
    locality = (restaurant.get("locality") or "").strip().lower()
    if not rest_name and not locality:
        return None

    def _norm(s: str) -> str:
        return " ".join(s.lower().split())

    norm_map = {_norm(name): loc_id for loc_id, name in locations}
    if locality:
        lid = norm_map.get(_norm(locality))
        if lid:
            return lid
    if rest_name:
        lid = norm_map.get(_norm(rest_name))
        if lid:
            return lid

    # Locality substring match first (more specific than the shared brand name).
    if locality:
        for loc_id, name in locations:
            if locality in _norm(name):
                return loc_id
    # Brand-name substring match as a last resort, but only when it is not
    # shared by every location (avoid mapping everything to the first outlet).
    if rest_name:
        matching = [loc_id for loc_id, name in locations if rest_name in _norm(name)]
        if len(matching) == 1:
            return matching[0]
    return None


def _restaurant_by_id(restaurants: list[dict], rest_id) -> dict | None:
    for r in restaurants:
        if str(r.get("rest_id", "")) == str(rest_id):
            return r
    return None


def sync_swiggy_reviews():
    """Fetch new reviews from Swiggy for all connected integrations."""
    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(
            Integration.brand_id == MOCK_BRAND_ID,
            Integration.platform == "swiggy",
            Integration.is_connected == True,
        ).first()

        if not integration:
            logger.debug("No connected Swiggy integration found, skipping sync")
            return
        if not integration.auth_token:
            logger.warning("Swiggy integration has no access token, skipping sync")
            return

        token = integration.auth_token

        try:
            restaurants = fetch_restaurants(token)
        except RuntimeError as e:
            logger.error(f"Swiggy get_user failed: {e}")
            return

        if not restaurants:
            logger.warning("No restaurants returned by Swiggy, skipping sync")
            return

        restaurant_ids = []
        if integration.restaurant_ids:
            try:
                restaurant_ids = json.loads(integration.restaurant_ids)
            except (json.JSONDecodeError, TypeError):
                restaurant_ids = []
        if not restaurant_ids:
            restaurant_ids = [str(r.get("rest_id")) for r in restaurants]

        from app.models.location import Location
        loc_pairs = [
            (str(loc.id), loc.name)
            for loc in db.query(Location).filter(Location.brand_id == MOCK_BRAND_ID).all()
        ]

        # Walk time windows back to 2024-01-01 (or last synced order).
        now_ms = int(time.time() * 1000)
        window_end = now_ms
        start_ms = 1704047400000  # 2024-01-01
        try:
            latest = db.query(Review.created_at).filter(
                Review.platform == "swiggy"
            ).order_by(Review.created_at.desc()).first()
            if latest and latest[0]:
                window_end = int(latest[0].timestamp() * 1000) + 1000
                start_ms = window_end - 90 * 24 * 3600 * 1000  # 90 days before latest
        except Exception:
            pass

        new_count = 0
        updated_count = 0
        seen_order_ids = set()

        while window_end > start_ms:
            try:
                orders = fetch_reviews_page(token, restaurant_ids, start_ms, window_end)
            except RuntimeError as e:
                logger.error(f"Swiggy ratings fetch failed: {e}")
                break
            except httpx.HTTPError as e:
                logger.warning(f"Swiggy HTTP error (retry window later): {e}")
                break

            if not orders:
                break

            oldest_ms = None
            for o in orders:
                order_id = str(o.get("orderID", ""))
                if not order_id or order_id in seen_order_ids:
                    continue
                seen_order_ids.add(order_id)

                restaurant = _restaurant_by_id(restaurants, o.get("restaurantID"))
                order_time = _parse_epoch_ms(o.get("orderTimeEpoch"))
                if order_time:
                    candidate_ms = order_time.timestamp() * 1000
                    oldest_ms = candidate_ms if oldest_ms is None else min(oldest_ms, candidate_ms)

                existing = db.query(Review).filter(
                    Review.platform == "swiggy",
                    Review.platform_review_id == order_id,
                ).first()

                rating = int(o.get("rating", 0) or 0)
                text = (o.get("customerReview") or "").strip() or None
                customer = o.get("customerInfo") or {}
                items = o.get("itemsInfo") or []

                items_payload = [
                    {
                        "name": it.get("name", ""),
                        "quantity": it.get("quantity", 1),
                        "sub_total": it.get("subTotal"),
                        "is_veg": it.get("isVeg"),
                        "category": it.get("category", ""),
                    }
                    for it in items
                ]
                customer_payload = {
                    "id": customer.get("id"),
                    "name": customer.get("name", ""),
                    "type": customer.get("type", ""),
                    "is_repeat": customer.get("type") == "RTR",
                }

                if existing:
                    changed = False
                    if existing.rating != rating:
                        existing.rating = rating
                        existing.sentiment = _classify_sentiment(rating, text)
                        changed = True
                    if text != existing.text:
                        existing.text = text
                        existing.sentiment = _classify_sentiment(rating, text)
                        existing.topics = _extract_topics(text)
                        changed = True
                    if order_time and existing.created_at != order_time:
                        existing.created_at = order_time
                        changed = True
                    if changed:
                        updated_count += 1
                    continue

                review = Review(
                    brand_id=MOCK_BRAND_ID,
                    platform="swiggy",
                    platform_review_id=order_id,
                    reviewer_name=customer.get("name", "Anonymous"),
                    rating=rating,
                    text=text,
                    sentiment=_classify_sentiment(rating, text),
                    topics=_extract_topics(text),
                    order_id=order_id,
                    order_details={
                        "order_id": order_id,
                        "restaurant": {
                            "id": str(o.get("restaurantID", "")),
                            "name": (restaurant or {}).get("rest_name", ""),
                            "locality": (restaurant or {}).get("locality", ""),
                            "city": (restaurant or {}).get("city_name", ""),
                        },
                        "rating_state": o.get("ratingState"),
                        "items": items_payload,
                        "customer": customer_payload,
                    },
                )
                if order_time:
                    review.created_at = order_time

                # Fetch bill details per order (best effort).
                try:
                    details = fetch_order_details(token, order_id, str(o.get("restaurantID", "")))
                    if details:
                        bill = details.get("billDetails") or {}
                        review.order_details["bill"] = {
                            "item_total": bill.get("itemTotal"),
                            "bill_total": bill.get("billTotal"),
                            "discount": bill.get("discount"),
                            "coupon_code": bill.get("couponCode", ""),
                        }
                except Exception:
                    pass
                time.sleep(0.4)

                lid = _match_location_id(restaurant or {}, loc_pairs)
                if lid:
                    try:
                        review.location_id = uuid.UUID(lid)
                    except (ValueError, AttributeError):
                        pass

                db.add(review)
                new_count += 1

            if oldest_ms is None:
                # No parseable timestamps; avoid an infinite loop.
                break
            window_end = int(oldest_ms) - 1
            time.sleep(0.5)

        db.commit()
        integration.last_synced = datetime.now(timezone.utc).isoformat()
        db.commit()
        logger.info(f"Swiggy sync complete: {new_count} new, {updated_count} updated")

    except Exception as e:
        logger.error(f"Swiggy sync failed: {e}")
        db.rollback()
    finally:
        db.close()
