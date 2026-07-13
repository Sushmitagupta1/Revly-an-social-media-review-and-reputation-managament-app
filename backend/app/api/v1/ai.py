import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, CurrentUser
from app.core.ai_client import chat_completion, get_suggestions
from app.models.chat_message import ChatMessage
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatMessageResponse,
)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    user_msg = ChatMessage(
        user_id=user.id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
        .all()
    )
    history.reverse()

    messages = [{"role": m.role, "content": m.content} for m in history]

    reply_text = await chat_completion(messages)

    assistant_msg = ChatMessage(
        user_id=user.id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(
        reply=ChatMessageResponse.model_validate(assistant_msg),
        suggestions=get_suggestions(),
    )


@router.get("/chat/history", response_model=ChatHistoryResponse)
def get_chat_history(
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(100)
        .all()
    )
    return ChatHistoryResponse(
        messages=[ChatMessageResponse.model_validate(m) for m in messages]
    )


@router.delete("/chat/history")
def clear_chat_history(
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    db.query(ChatMessage).filter(ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}


@router.get("/chat/suggestions")
def suggestions():
    return {"suggestions": get_suggestions()}
