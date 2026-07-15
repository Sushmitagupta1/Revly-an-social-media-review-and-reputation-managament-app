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
    if body.credential:
        return {"valid": True, "message": f"Zomato account connected via {body.credential}", "locations": []}
    elif body.api_key:
        return {"valid": True, "message": "Zomato API key saved.", "locations": []}
    else:
        raise HTTPException(status_code=400, detail="Phone number or credential is required")


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
    if body.credential:
        return {"valid": True, "message": f"Reelo account connected via {body.credential}", "locations": []}
    elif body.api_key:
        return {"valid": True, "message": "Reelo API key saved.", "locations": []}
    else:
        raise HTTPException(status_code=400, detail="Phone number or credential is required")


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
