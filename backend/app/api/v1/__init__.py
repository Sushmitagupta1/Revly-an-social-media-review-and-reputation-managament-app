from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.replies import router as replies_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.ai import router as ai_router
from app.api.v1.inbox import router as inbox_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.praises import router as praises_router
from app.api.v1.leaderboard import router as leaderboard_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
router.include_router(replies_router, prefix="", tags=["replies"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
router.include_router(ai_router, prefix="/ai", tags=["ai"])
router.include_router(inbox_router, prefix="/inbox", tags=["inbox"])
router.include_router(complaints_router, prefix="/complaints", tags=["complaints"])
router.include_router(praises_router, prefix="/praises", tags=["praises"])
router.include_router(leaderboard_router, prefix="/leaderboard", tags=["leaderboard"])
