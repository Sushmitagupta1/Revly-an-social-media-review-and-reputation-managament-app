import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode

from app.core.config import settings

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_BUSINESS_PROFILE_SCOPES = [
    "https://www.googleapis.com/auth/business.manage",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

FRONTEND_BASE = "https://revly-an-social-media-review-and-re.vercel.app"


@router.get("/auth-url")
def get_google_auth_url():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env"
        )
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GOOGLE_BUSINESS_PROFILE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    return {"url": f"{GOOGLE_AUTH_URL}?{urlencode(params)}"}


@router.get("/callback")
async def google_callback(code: str = "", error: str = ""):
    if error:
        return RedirectResponse(
            url=f"{FRONTEND_BASE}/account/platform-integration?google_error={error}"
        )

    if not code:
        raise HTTPException(status_code=400, detail="No authorization code")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            return RedirectResponse(
                url=f"{FRONTEND_BASE}/account/platform-integration?google_error=token_exchange_failed"
            )
        tokens = token_resp.json()

        user_resp = await client.get(GOOGLE_USERINFO_URL, headers={
            "Authorization": f"Bearer {tokens['access_token']}"
        })
        user_info = user_resp.json() if user_resp.status_code == 200 else {}

    params = urlencode({
        "access_token": tokens.get("access_token", ""),
        "refresh_token": tokens.get("refresh_token", ""),
        "email": user_info.get("email", ""),
        "name": user_info.get("name", ""),
    })
    return RedirectResponse(url=f"{FRONTEND_BASE}/account/platform-integration?{params}")


@router.post("/fetch-locations")
async def fetch_google_locations(access_token: str):
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access token")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://mybusinessbusinessinformation.googleapis.com/v1/locations",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"readMask": "name,title,storefrontAddress,metadata"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        data = resp.json()
        locations = []
        for loc in data.get("locations", []):
            addr = loc.get("storefrontAddress", {})
            locations.append({
                "id": loc.get("name", "").split("/")[-1],
                "name": loc.get("title", "Unknown"),
                "address": f"{addr.get('addressLines', [''])[0]}, {addr.get('locality', '')}",
                "state": addr.get("administrativeArea", ""),
            })
        return {"locations": locations}


@router.post("/fetch-reviews")
async def fetch_google_reviews(access_token: str, location_id: str):
    if not access_token or not location_id:
        raise HTTPException(status_code=400, detail="Missing parameters")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://mybusinessbusinessinformation.googleapis.com/v1/locations/{location_id}/reviews",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"pageSize": 50},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        data = resp.json()
        reviews = []
        for r in data.get("reviews", []):
            reviews.append({
                "review_id": r.get("reviewId", ""),
                "author": r.get("reviewer", {}).get("displayName", "Anonymous"),
                "rating": r.get("starRating", {}).get("starCount", 0),
                "comment": r.get("comment", ""),
                "timestamp": r.get("updateTime", ""),
            })
        return {"reviews": reviews}
