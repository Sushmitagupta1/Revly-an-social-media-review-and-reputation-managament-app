import uuid
from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    title: str
    message: str
    type: str


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int
    unread: int
