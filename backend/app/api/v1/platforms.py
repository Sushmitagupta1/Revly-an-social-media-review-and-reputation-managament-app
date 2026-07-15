import random
import string
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

otp_store: dict[str, str] = {}

MOCK_LOCATIONS = {
    "zomato": [
        {"id": "z1", "name": "Upper Crust - Vastrapur", "address": "Vastrapur, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "z2", "name": "Upper Crust - SG Highway", "address": "SG Highway, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "z3", "name": "Upper Crust - Vijay Cross", "address": "Vijay Cross Roads, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "z4", "name": "Upper Crust - Prahlad Nagar", "address": "Prahlad Nagar, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "z5", "name": "Upper Crust - Sindhu Bhavan", "address": "Sindhu Bhavan Road, Ahmedabad, Gujarat", "state": "Gujarat"},
    ],
    "swiggy": [
        {"id": "s1", "name": "Upper Crust - Vastrapur", "address": "Vastrapur, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "s2", "name": "Upper Crust - SG Highway", "address": "SG Highway, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "s3", "name": "Upper Crust - Vijay Cross", "address": "Vijay Cross Roads, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "s4", "name": "Upper Crust - Prahlad Nagar", "address": "Prahlad Nagar, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "s5", "name": "Upper Crust - Sindhu Bhavan", "address": "Sindhu Bhavan Road, Ahmedabad, Gujarat", "state": "Gujarat"},
    ],
    "reelo": [
        {"id": "r1", "name": "Upper Crust - Vastrapur", "address": "Vastrapur, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "r2", "name": "Upper Crust - SG Highway", "address": "SG Highway, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "r3", "name": "Upper Crust - Vijay Cross", "address": "Vijay Cross Roads, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "r4", "name": "Upper Crust - Prahlad Nagar", "address": "Prahlad Nagar, Ahmedabad, Gujarat", "state": "Gujarat"},
        {"id": "r5", "name": "Upper Crust - Sindhu Bhavan", "address": "Sindhu Bhavan Road, Ahmedabad, Gujarat", "state": "Gujarat"},
    ],
}


class SendOtpRequest(BaseModel):
    phone: str


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str
    otp_id: Optional[str] = None


class PlatformVerifyRequest(BaseModel):
    api_key: Optional[str] = None
    credential: Optional[str] = None
    auth_type: Optional[str] = None


def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


@router.post("/{platform}/send-otp")
async def send_otp(platform: str, body: SendOtpRequest):
    if not body.phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    otp_code = generate_otp()
    otp_id = f"{platform}_{body.phone}_{random.randint(1000, 9999)}"
    otp_store[otp_id] = otp_code

    print(f"[OTP] {platform} → {body.phone}: {otp_code}")

    return {
        "success": True,
        "message": f"OTP sent to {body.phone}",
        "otp_id": otp_id,
    }


@router.post("/{platform}/verify-otp")
async def verify_otp(platform: str, body: VerifyOtpRequest):
    if not body.phone or not body.otp:
        raise HTTPException(status_code=400, detail="Phone and OTP are required")

    stored_otp = otp_store.get(body.otp_id)
    if stored_otp and stored_otp == body.otp:
        otp_store.pop(body.otp_id, None)
        locations = MOCK_LOCATIONS.get(platform, [])
        return {
            "valid": True,
            "message": f"{platform.title()} account verified successfully",
            "locations": locations,
        }

    return {
        "valid": False,
        "message": "Invalid OTP. Please try again.",
        "locations": [],
    }


@router.post("/{platform}/verify")
async def verify_api_key(platform: str, body: PlatformVerifyRequest):
    if body.credential:
        locations = MOCK_LOCATIONS.get(platform, [])
        return {"valid": True, "message": f"{platform.title()} account connected", "locations": locations}
    elif body.api_key:
        return {"valid": True, "message": f"{platform.title()} API key saved.", "locations": []}
    else:
        raise HTTPException(status_code=400, detail="Phone number or API key is required")
