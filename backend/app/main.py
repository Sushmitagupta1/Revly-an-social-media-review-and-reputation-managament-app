import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import router as v1_router
from app.core.config import settings
from app.core.database import engine
from app.models import Base

app = FastAPI(title="Revly API", version="0.1.0")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    from app.seed_admin import seed_admin
    seed_admin()

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
