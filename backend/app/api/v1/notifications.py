import uuid as _uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate, NotificationResponse, NotificationListResponse,
)

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
def list_notifications(db: DbSession, user: CurrentUser):
    query = db.query(Notification).filter(Notification.user_id == user.id)
    total = query.count()
    unread = query.filter(Notification.is_read == False).count()
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread=unread,
    )


@router.post("", response_model=NotificationResponse)
def create_notification(
    body: NotificationCreate,
    db: DbSession,
    _user: CurrentUser,
):
    notif = Notification(**body.model_dump())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return NotificationResponse.model_validate(notif)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: str,
    db: DbSession,
    user: CurrentUser,
):
    notif = db.query(Notification).filter(
        Notification.id == _uuid.UUID(notification_id),
        Notification.user_id == user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return NotificationResponse.model_validate(notif)
