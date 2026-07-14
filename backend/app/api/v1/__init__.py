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
from app.api.v1.competitors import router as competitors_router
from app.api.v1.reports import router as reports_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.locations import router as locations_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.automation import router as automation_router
from app.api.v1.auto_responses import router as auto_responses_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.resolve import router as resolve_router
from app.api.v1.google import router as google_router
from app.api.v1.platforms import router as platforms_router

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
router.include_router(competitors_router, prefix="/competitors", tags=["competitors"])
router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
router.include_router(reports_router, prefix="/reports", tags=["reports"])
router.include_router(locations_router, prefix="/locations", tags=["locations"])
router.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])
router.include_router(automation_router, prefix="/automation", tags=["automation"])
router.include_router(auto_responses_router, prefix="/auto-responses", tags=["auto-responses"])
router.include_router(integrations_router, prefix="/integrations", tags=["integrations"])
router.include_router(resolve_router, prefix="/resolve", tags=["resolve"])
router.include_router(google_router, prefix="/google", tags=["google"])
router.include_router(platforms_router, prefix="/platforms", tags=["platforms"])
