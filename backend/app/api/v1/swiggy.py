import json
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.core.constants import MOCK_BRAND_ID
from app.models.integration import Integration
from app.services.swiggy_sync import fetch_restaurants, sync_swiggy_reviews

router = APIRouter()


class SwiggyConnectRequest(BaseModel):
    access_token: str
    account_name: str = "Swiggy Partner"
    restaurant_ids: list[str] = []


class SwiggySyncRequest(BaseModel):
    access_token: str | None = None


@router.post("/connect")
async def connect_swiggy(body: SwiggyConnectRequest):
    if not body.access_token:
        raise HTTPException(status_code=400, detail="Access token is required")

    try:
        restaurants = fetch_restaurants(body.access_token)
    except RuntimeError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")

    if not restaurants:
        raise HTTPException(status_code=401, detail="No restaurants found for this account")

    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(
            Integration.brand_id == MOCK_BRAND_ID,
            Integration.platform == "swiggy",
        ).first()

        rest_ids = body.restaurant_ids or [str(r.get("rest_id")) for r in restaurants]
        restaurant_ids_json = json.dumps(rest_ids)

        if not integration:
            integration = Integration(
                brand_id=MOCK_BRAND_ID,
                platform="swiggy",
                account_name=body.account_name,
                status="active",
                is_connected=True,
                auth_token=body.access_token,
                restaurant_ids=restaurant_ids_json,
            )
            db.add(integration)
        else:
            integration.account_name = body.account_name
            integration.is_connected = True
            integration.status = "active"
            integration.auth_token = body.access_token
            integration.restaurant_ids = restaurant_ids_json

        db.commit()
    finally:
        db.close()

    return {
        "success": True,
        "message": "Swiggy account connected",
        "restaurants": restaurants,
        "restaurant_ids": rest_ids,
    }


@router.post("/restaurants")
async def get_swiggy_restaurants(body: SwiggySyncRequest):
    token = body.access_token
    if not token:
        db = SessionLocal()
        try:
            integration = db.query(Integration).filter(
                Integration.brand_id == MOCK_BRAND_ID,
                Integration.platform == "swiggy",
                Integration.is_connected == True,
            ).first()
            token = integration.auth_token if integration else None
        finally:
            db.close()

    if not token:
        raise HTTPException(status_code=400, detail="No access token available. Connect Swiggy first.")

    try:
        restaurants = fetch_restaurants(token)
    except RuntimeError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")
    return {"restaurants": restaurants}


@router.post("/sync")
async def manual_swiggy_sync(background_tasks: BackgroundTasks):
    db = SessionLocal()
    try:
        integration = db.query(Integration).filter(
            Integration.brand_id == MOCK_BRAND_ID,
            Integration.platform == "swiggy",
            Integration.is_connected == True,
        ).first()
    finally:
        db.close()

    if not integration:
        raise HTTPException(status_code=400, detail="No connected Swiggy integration found")

    background_tasks.add_task(sync_swiggy_reviews)
    return {"success": True, "message": "Swiggy sync started"}
