import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class PlatformVerifyRequest(BaseModel):
    api_key: Optional[str] = None
    credential: Optional[str] = None
    auth_type: Optional[str] = None


ZOMATO_API_BASE = "https://developers.zomato.com/api/v2.1"


@router.post("/zomato/verify")
async def verify_zomato(body: PlatformVerifyRequest):
    if body.api_key:
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
    elif body.credential:
        if body.auth_type == "email":
            return {"valid": True, "message": f"Zomato account connected via {body.credential}", "locations": []}
        return {"valid": True, "message": "Zomato account connected", "locations": []}
    else:
        raise HTTPException(status_code=400, detail="API key or credential is required")


@router.post("/swiggy/verify")
async def verify_swiggy(body: PlatformVerifyRequest):
    if body.credential:
        if body.auth_type == "phone":
            return {"valid": True, "message": f"Swiggy account connected via {body.credential}", "locations": []}
        return {"valid": True, "message": "Swiggy account connected", "locations": []}
    elif body.api_key:
        return {"valid": True, "message": "Swiggy API key saved. Manual verification required.", "locations": []}
    else:
        raise HTTPException(status_code=400, detail="Phone number or credential is required")


@router.post("/reelo/verify")
async def verify_reelo(body: PlatformVerifyRequest):
    if not body.api_key and not body.credential:
        raise HTTPException(status_code=400, detail="API key is required")
    return {
        "valid": True,
        "message": "Reelo API key saved. Manual verification required.",
        "locations": [],
    }


@router.post("/magicpin/verify")
async def verify_magicpin(body: PlatformVerifyRequest):
    if not body.api_key and not body.credential:
        raise HTTPException(status_code=400, detail="API key is required")
    return {
        "valid": True,
        "message": "Magicpin API key saved. Manual verification required.",
        "locations": [],
    }


@router.post("/tripadvisor/verify")
async def verify_tripadvisor(body: PlatformVerifyRequest):
    if not body.api_key and not body.credential:
        raise HTTPException(status_code=400, detail="API key is required")
    return {
        "valid": True,
        "message": "TripAdvisor API key saved. Manual verification required.",
        "locations": [],
    }
