from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse, AuditLogListResponse

router = APIRouter()


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    db: DbSession,
    _user: CurrentUser,
    action: str | None = None,
    entity_type: str | None = None,
):
    query = db.query(AuditLog).filter(AuditLog.brand_id == MOCK_BRAND_ID)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).limit(100).all()
    return AuditLogListResponse(
        logs=[AuditLogResponse.model_validate(l) for l in logs],
        total=total,
    )
