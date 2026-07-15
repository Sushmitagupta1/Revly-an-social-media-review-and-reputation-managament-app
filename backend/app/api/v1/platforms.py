import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.constants import MOCK_BRAND_ID
from app.models.platform_token import PlatformToken
from app.models.integration import Integration
from app.models.location import Location

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


class ConnectLocationsRequest(BaseModel):
    platform: str
    phone: str
    account_name: str
    location_ids: list[str]


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

        mock_token = f"mock_token_{''.join(random.choices(string.ascii_letters + string.digits, k=32))}"
        db = SessionLocal()
        try:
            existing = db.query(PlatformToken).filter(
                PlatformToken.brand_id == MOCK_BRAND_ID,
                PlatformToken.platform == platform,
                PlatformToken.phone == body.phone,
            ).first()

            if existing:
                existing.access_token = mock_token
                existing.status = "active"
                existing.last_synced_at = None
            else:
                token = PlatformToken(
                    brand_id=MOCK_BRAND_ID,
                    platform=platform,
                    phone=body.phone,
                    access_token=mock_token,
                    token_type="bearer",
                    expires_at=datetime.utcnow() + timedelta(days=30),
                    status="active",
                )
                db.add(token)
            db.commit()
        finally:
            db.close()

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


@router.post("/connect-locations")
async def connect_locations(body: ConnectLocationsRequest):
    db = SessionLocal()
    try:
        all_locations = MOCK_LOCATIONS.get(body.platform, [])
        selected = [loc for loc in all_locations if loc["id"] in body.location_ids]

        for loc_data in selected:
            existing_loc = db.query(Location).filter(
                Location.brand_id == MOCK_BRAND_ID,
                Location.name == loc_data["name"],
            ).first()

            if not existing_loc:
                loc = Location(
                    brand_id=MOCK_BRAND_ID,
                    name=loc_data["name"],
                    address=loc_data["address"],
                    city="Ahmedabad",
                    state=loc_data["state"],
                    country="India",
                )
                db.add(loc)
                db.flush()

            integration = db.query(Integration).filter(
                Integration.brand_id == MOCK_BRAND_ID,
                Integration.platform == body.platform,
                Integration.account_name == body.account_name,
            ).first()

            if not integration:
                integration = Integration(
                    brand_id=MOCK_BRAND_ID,
                    platform=body.platform,
                    account_name=body.account_name,
                    status="active",
                    is_connected=True,
                )
                db.add(integration)

        db.commit()
        return {"success": True, "message": f"Connected {len(selected)} locations"}
    finally:
        db.close()
