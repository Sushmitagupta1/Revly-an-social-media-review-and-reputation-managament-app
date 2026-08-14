import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings
from app.core.constants import MOCK_BRAND_ID
from app.core.database import SessionLocal
from app.models.integration import Integration
from app.models.review import Review

logger = logging.getLogger("zomato_sync")

ZOMATO_API_BASE = "https://api.zomato.com/merchant-gw/web"
SET_CSRF_URL = "https://api.zomato.com/merchant-gw/set-csrf"
NPS_GET_URL = "https://www.zomato.com/merchant-api/nps/get"
ORDER_DETAILS_URL = "https://www.zomato.com/merchant-api/orders/order-details"
RESTAURANTS_URL = "https://www.zomato.com/merchant-api/restaurants/get-all"


def _build_order_headers(integration: Integration) -> dict:
    """Headers for the www.zomato.com merchant-api endpoints (e.g. order-details)."""
    return {
        "accept": "application/json, text/plain, */*",
        "x-client-id": "zomato_web_merchant",
        "x-zomato-app-version": "2",
        "x-zomato-csrft": integration.csrf_token or "",
        "x-zomato-mx-csrf-token": integration.mx_csrf_token or "",
        "x-zomato-source-identifier": "merchant-dashboard",
        "x-zomato-trace-id": "web-revly-autosync",
        "referer": "https://www.zomato.com/partners/onlineordering/reviews/",
        "origin": "https://www.zomato.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "cookie": f"X-Zomato-Mx-Auth-Token={integration.auth_token}; {integration.cookies or ''}",
    }


def _parse_order_details(data: dict) -> dict:
    """Extract a compact order summary from the order-details API response."""
    order = data.get("order") or {}
    cart = order.get("cartDetails") or {}
    dishes = []
    for d in (cart.get("items") or {}).get("dishes", []) or []:
        dishes.append({
            "name": d.get("name", ""),
            "quantity": d.get("quantity", 1),
            "unit_cost": d.get("unitCost"),
            "total_cost": d.get("totalCost"),
        })
    total = None
    total_block = cart.get("total") or {}
    total_amount = (total_block.get("amountDetails") or {}).get("totalCost")
    if total_amount is not None:
        total = total_amount
    creator = order.get("creator") or {}
    address = creator.get("address") or {}
    return {
        "order_id": str(order.get("id", "")),
        "res_id": str(order.get("resId", "")) or None,
        "ordered_at": order.get("createdAt"),
        "state": order.get("state"),
        "delivery_mode": order.get("deliveryMode"),
        "payment_method": order.get("paymentMethod"),
        "customer_name": creator.get("name"),
        "customer_address": {
            "address": address.get("address", ""),
            "locality": address.get("locality", ""),
        } if address else None,
        "dishes": dishes,
        "total": total,
    }


def _with_restaurant(order_details: dict | None, restaurant: dict | None) -> dict | None:
    """Attach restaurant/outlet info to stored order details."""
    if not order_details:
        return None
    merged = dict(order_details)
    if restaurant:
        merged["restaurant"] = restaurant
    return merged


def _fetch_restaurants(integration: Integration) -> dict[str, dict]:
    """Fetch outlet info (name, subzone, city, address) for the integration's restaurants."""
    restaurant_ids = []
    if integration.restaurant_ids:
        try:
            restaurant_ids = json.loads(integration.restaurant_ids)
        except (json.JSONDecodeError, TypeError):
            restaurant_ids = []
    if not restaurant_ids:
        return {}
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.get(
                RESTAURANTS_URL,
                headers=_build_order_headers(integration),
                params={"res_id": ",".join(restaurant_ids)},
            )
            if resp.status_code != 200:
                logger.warning(f"restaurants/get-all returned {resp.status_code}")
                return {}
            out = {}
            for e in resp.json().get("entities", []) or []:
                rid = str(e.get("id", ""))
                if rid:
                    out[rid] = {
                        "name": e.get("name", ""),
                        "subzone": e.get("subzone", ""),
                        "city": e.get("city_name", ""),
                        "address": e.get("address", ""),
                    }
            return out
    except Exception as e:
        logger.warning(f"restaurants/get-all error: {e}")
        return {}


def _fetch_order_details(integration: Integration, order_id: str) -> dict | None:
    """Fetch compact order details for an order via the merchant-api endpoint."""
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.get(
                ORDER_DETAILS_URL,
                headers=_build_order_headers(integration),
                params={"tab_id": order_id},
            )
            if resp.status_code != 200:
                logger.warning(f"order-details for {order_id} returned {resp.status_code}")
                return None
            return _parse_order_details(resp.json())
    except Exception as e:
        logger.warning(f"order-details error for {order_id}: {e}")
        return None


def _fetch_all_reviews(integration: Integration, client: httpx.Client) -> list[dict]:
    """Fetch all review pages across the merchant's restaurants (raw review dicts)."""
    restaurant_ids = []
    if integration.restaurant_ids:
        try:
            restaurant_ids = json.loads(integration.restaurant_ids)
        except (json.JSONDecodeError, TypeError):
            restaurant_ids = []

    headers = _build_headers(integration)
    all_reviews: list[dict] = []
    for res_id in restaurant_ids:
        offset = 0
        for _ in range(100):
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
                    r["res_id"] = res_id
                all_reviews.extend(reviews)
                pagination = data.get("pagination", {})
                if not pagination.get("has_more"):
                    break
                offset = pagination.get("next_start", offset + len(reviews))
            except Exception as e:
                logger.warning(f"Error fetching reviews for restaurant {res_id}: {e}")
                break
    return all_reviews


def _parse_cookie_dict(raw: str) -> dict[str, str]:
    """Parse a semi-colon separated Cookie string into a dict."""
    result = {}
    for part in raw.split(";"):
        part = part.strip()
        if "=" in part:
            key, _, val = part.partition("=")
            result[key.strip()] = val.strip()
    return result


def _update_cookies_from_response(integration, cookie_str: str, resp):
    """Extract Set-Cookie headers from response and merge into integration.cookies."""
    cookies = _parse_cookie_dict(cookie_str)
    for set_cookie in resp.headers.get_list("set-cookie"):
        name = set_cookie.split("=", 1)[0].strip()
        rest = set_cookie.split(";", 1)[0]
        value = rest.split("=", 1)[1].strip() if "=" in rest else ""
        cookies[name] = value
    cookies.pop("X-Zomato-Mx-Auth-Token", None)
    new_parts = [f"{k}={v}" for k, v in cookies.items()]
    integration.cookies = "; ".join(new_parts)


def refresh_zomato_session(integration) -> bool:
    """Refresh Zomato session cookies by calling keepalive endpoints."""
    cookie_str = f"X-Zomato-Mx-Auth-Token={integration.auth_token}; {integration.cookies or ''}"
    headers = {
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
        "cookie": cookie_str,
    }
    try:
        with httpx.Client(timeout=15) as client:
            # 1. Refresh ALB session stickiness (7-day cookies)
            nps_ok = True
            try:
                nps_resp = client.get(NPS_GET_URL, headers=headers)
                if nps_resp.status_code == 200:
                    _update_cookies_from_response(integration, cookie_str, nps_resp)
                    cookie_str = f"X-Zomato-Mx-Auth-Token={integration.auth_token}; {integration.cookies}"
                    headers["cookie"] = cookie_str
                else:
                    nps_ok = False
                    logger.warning(f"NPS/get returned {nps_resp.status_code}")
            except Exception as e:
                nps_ok = False
                logger.warning(f"NPS/get error: {e}")

            # 2. Refresh CSRF / bot management cookie (2-hour bm_sv)
            csrf_resp = client.post(SET_CSRF_URL, headers=headers, content=b"")
            if csrf_resp.status_code != 200:
                logger.warning(f"set-csrf returned {csrf_resp.status_code}")
                return False

            _update_cookies_from_response(integration, cookie_str, csrf_resp)

            try:
                body = csrf_resp.json()
                new_token = body.get("refresh_token") or body.get("token")
                if new_token:
                    integration.auth_token = new_token
                if body.get("csrf"):
                    integration.csrf_token = body["csrf"]
                if body.get("mx_csrf"):
                    integration.mx_csrf_token = body["mx_csrf"]
            except (ValueError, AttributeError):
                pass

            return True
    except Exception as e:
        logger.error(f"Session refresh error: {e}")
        return False


def _parse_display_date(display_date: str | None) -> datetime | None:
    if not display_date:
        return None
    display_date = display_date.strip().lower()
    now = datetime.now(timezone.utc)
    if display_date == "yesterday":
        return (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    if display_date == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    m = re.match(r"^(\d+)\s+(second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago$", display_date)
    if m:
        n = int(m.group(1))
        unit = m.group(2)
        if unit.startswith("month"):
            td = timedelta(days=30 * n)
        elif unit.startswith("week"):
            td = timedelta(weeks=n)
        elif unit.startswith("day"):
            td = timedelta(days=n)
        elif unit.startswith("hour"):
            td = timedelta(hours=n)
        elif unit.startswith("minute"):
            td = timedelta(minutes=n)
        else:
            td = timedelta(seconds=n)
        return (now - td).replace(hour=0, minute=0, second=0, microsecond=0)
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


def _match_location_id(order_details: dict | None, locations: list[tuple[str, str]]) -> str | None:
    """Return the id of the Location matching the restaurant inside order_details, else None.

    locations: list of (location_id, location_name).
    Candidates tried, in order: "Name (Subzone)", "Name", "Name (City)".
    """
    restaurant = (order_details or {}).get("restaurant") or {}
    name = (restaurant.get("name") or "").strip()
    subzone = (restaurant.get("subzone") or "").strip()
    city = (restaurant.get("city") or "").strip()

    candidates = []
    if name and subzone:
        candidates.append(f"{name} ({subzone})")
    if name:
        candidates.append(name)
    if name and city:
        candidates.append(f"{name} ({city})")
    if not candidates:
        return None

    def _norm(s: str) -> str:
        return " ".join(s.lower().split())

    norm_map = {_norm(loc_name): loc_id for loc_id, loc_name in locations}
    for cand in candidates:
        lid = norm_map.get(_norm(cand))
        if lid:
            return lid
    return None


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

        refreshed = refresh_zomato_session(integration)
        if not refreshed:
            logger.warning("Session refresh failed, proceeding with existing tokens")

        from app.models.location import Location
        loc_pairs = [
            (str(loc.id), loc.name)
            for loc in db.query(Location).filter(Location.brand_id == MOCK_BRAND_ID).all()
        ]

        headers = _build_headers(integration)
        restaurant_map = _fetch_restaurants(integration)
        new_count = 0
        updated_count = 0

        with httpx.Client(timeout=60) as client:
            for res_id in restaurant_ids:
                offset = 0
                pages = 0
                max_pages = 50
                restaurant = restaurant_map.get(res_id)

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
                            order_id = str(r.get("order_id", "")) or None

                            dish_feedbacks = []
                            for df in r.get("dish_feedbacks", []) or []:
                                dish_feedbacks.append({
                                    "title": df.get("title", ""),
                                    "rating": df.get("rating", ""),
                                })

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
                                if order_id and not existing.order_id:
                                    existing.order_id = order_id
                                    existing.order_details = _with_restaurant({
                                        "order_id": order_id,
                                        "dishes": dish_feedbacks,
                                    }, restaurant)
                                    updated_count += 1
                                elif not existing.order_id and dish_feedbacks:
                                    existing.order_details = _with_restaurant({
                                        "order_id": order_id or "",
                                        "dishes": dish_feedbacks,
                                    }, restaurant)
                                    updated_count += 1
                                elif existing.order_details and not existing.order_details.get("restaurant") and order_id:
                                    existing.order_details = _with_restaurant(
                                        dict(existing.order_details), restaurant
                                    )
                                    updated_count += 1
                                continue

                            rating = int(info.get("rating", 0))
                            text = r.get("review_text", "")
                            display_date = info.get("display_date", "")
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
                                order_id=order_id,
                            )
                            if order_id:
                                order_details = _fetch_order_details(integration, order_id)
                                if order_details:
                                    review.order_details = _with_restaurant(order_details, restaurant)
                                elif dish_feedbacks:
                                    review.order_details = _with_restaurant({
                                        "order_id": order_id,
                                        "dishes": dish_feedbacks,
                                    }, restaurant)
                            if not review.location_id:
                                lid = _match_location_id(review.order_details, loc_pairs)
                                if lid:
                                    review.location_id = uuid.UUID(lid)
                            review_date = _parse_display_date(display_date)
                            if review_date:
                                review.created_at = review_date
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
        integration.last_sync_error = None
        db.commit()

        logger.info(f"Zomato sync complete: {new_count} new, {updated_count} updated")

    except Exception as e:
        logger.error(f"Zomato sync failed: {e}")
        db.rollback()
    finally:
        db.close()
