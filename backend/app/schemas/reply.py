import uuid
from datetime import datetime

from pydantic import BaseModel


class ReplyResponse(BaseModel):
    id: uuid.UUID
    review_id: uuid.UUID
    user_id: uuid.UUID | None
    text: str
    is_ai_generated: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReplyCreate(BaseModel):
    text: str


class ReplyGenerate(BaseModel):
    tone: str = "professional"


class ReplyUpdate(BaseModel):
    status: str
