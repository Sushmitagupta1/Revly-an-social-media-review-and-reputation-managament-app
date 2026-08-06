from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(user: CurrentUser):
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role_name=user.role.name if user.role else None,
        created_at=user.created_at,
    )


@router.patch("/me", response_model=UserResponse)
def update_me(body: UserUpdate, user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    if body.username is not None:
        existing = db.query(User).filter(User.username == body.username).first()
        if existing and existing.id != user.id:
            from fastapi import HTTPException
            raise HTTPException(status_code=409, detail="Username already taken")
        user.username = body.username
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role_name=user.role.name if user.role else None,
        created_at=user.created_at,
    )
