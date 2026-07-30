import os
import logging
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import router as v1_router
from app.core.config import settings
from app.core.database import engine
from app.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zomato_sync")


def _run_migrations(engine):
    """Add missing columns for integrations table."""
    import sqlalchemy as sa
    from sqlalchemy import inspect
    try:
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("integrations")]
        missing = [c for c in ["auth_token", "csrf_token", "mx_csrf_token", "cookies", "restaurant_ids"] if c not in columns]
        if missing:
            logger.info(f"Adding missing columns to integrations table: {missing}")
            with engine.connect() as conn:
                for col in missing:
                    conn.execute(sa.text(f"ALTER TABLE integrations ADD COLUMN {col} TEXT"))
                conn.commit()
            logger.info("Migration complete")
    except Exception as e:
        logger.warning(f"Migration check failed (table may not exist yet): {e}")

app = FastAPI(title="Revly API", version="0.1.0")

scheduler = BackgroundScheduler()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _run_migrations(engine)
    from app.seed_admin import seed_admin
    seed_admin()

    from app.services.zomato_sync import sync_zomato_reviews
    scheduler.add_job(sync_zomato_reviews, "interval", minutes=15, id="zomato_sync")
    scheduler.start()
    logger.info("Zomato auto-sync scheduler started (every 15 minutes)")


@app.on_event("shutdown")
def on_shutdown():
    scheduler.shutdown(wait=False)
    logger.info("Scheduler stopped")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            from fastapi.responses import FileResponse
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
