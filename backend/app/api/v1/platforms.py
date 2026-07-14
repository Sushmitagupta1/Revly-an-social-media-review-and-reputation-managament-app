import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class PlatformVerifyRequest(BaseModel):
    api_key: str


ZOMATO_API_BASE = "https://developers.zomato.com/api/v2.1"


@router.post("/zomato/verify")
async def verify_zomato_api_key(body: PlatformVerifyRequest):
    if not body.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{ZOMATO_API_BASE}/categories",
                headers={"user-key": body.api_key},
                timeout=10.0,
            )
            if resp.status_code == 200:
                return {"valid": True, "message": "API key verified", "locations": []}
            elif resp.status_code == 403:
                return {"valid": False, "message": "Invalid API key", "locations": []}
            else:
                return {"valid": False, "message": f"Verification failed: {resp.status_code}", "locations": []}
        except httpx.TimeoutException:
            return {"valid": False, "message": "Connection timeout. Check your network.", "locations": []}
        except Exception as e:
            return {"valid": False, "message": f"Error: {str(e)}", "locations": []}


@router.post("/swiggy/verify")
async def verify_swiggy_api_key(body: PlatformVerifyRequest):
    if not body.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    return {
        "valid": True,
        "message": "Swiggy API key saved. Manual verification required.",
        "locations": [],
    }


@router.post("/reelo/verify")
async def verify_reelo_api_key(body: PlatformVerifyRequest):
    if not body.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    return {
        "valid": True,
        "message": "Reelo API key saved. Manual verification required.",
        "locations": [],
    }


@router.post("/magicpin/verify")
async def verify_magicpin_api_key(body: PlatformVerifyRequest):
    if not body.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    return {
        "valid": True,
        "message": "Magicpin API key saved. Manual verification required.",
        "locations": [],
    }


@router.post("/tripadvisor/verify")
async def verify_tripadvisor_api_key(body: PlatformVerifyRequest):
    if not body.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    return {
        "valid": True,
        "message": "TripAdvisor API key saved. Manual verification required.",
        "locations": [],
    }
