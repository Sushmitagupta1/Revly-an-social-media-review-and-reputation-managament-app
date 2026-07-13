from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, CurrentUser
from app.core.ai_mock import generate_reply
from app.models.reply import Reply
from app.models.review import Review
from app.schemas.reply import ReplyCreate, ReplyGenerate, ReplyResponse, ReplyUpdate

router = APIRouter()


@router.post("/reviews/{review_id}/replies/generate", response_model=ReplyResponse)
def generate_ai_reply(
    review_id: str,
    body: ReplyGenerate,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    review = db.query(Review).filter(Review.id == uuid.UUID(review_id)).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    reply_text = generate_reply(
        text=review.text,
        rating=review.rating,
        reviewer_name=review.reviewer_name,
        tone=body.tone,
    )

    reply = Reply(
        review_id=review.id,
        user_id=user.id,
        text=reply_text,
        is_ai_generated=True,
        status="draft",
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return ReplyResponse.model_validate(reply)


@router.post("/reviews/{review_id}/replies", response_model=ReplyResponse)
def create_reply(
    review_id: str,
    body: ReplyCreate,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    review = db.query(Review).filter(Review.id == uuid.UUID(review_id)).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    reply = Reply(
        review_id=review.id,
        user_id=user.id,
        text=body.text,
        is_ai_generated=False,
        status="draft",
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return ReplyResponse.model_validate(reply)


@router.patch("/replies/{reply_id}", response_model=ReplyResponse)
def update_reply(
    reply_id: str,
    body: ReplyUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    reply = db.query(Reply).filter(Reply.id == uuid.UUID(reply_id)).first()
    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")

    reply.status = body.status
    db.commit()
    db.refresh(reply)
    return ReplyResponse.model_validate(reply)


@router.delete("/replies/{reply_id}")
def delete_reply(
    reply_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
):
    import uuid
    reply = db.query(Reply).filter(Reply.id == uuid.UUID(reply_id)).first()
    if not reply:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")

    db.delete(reply)
    db.commit()
    return {"message": "Deleted"}
