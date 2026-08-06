from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_db
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(user: CurrentUser):
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role_name=user.role.name if user.role else None,
        created_at=user.created_at,
    )


@router.patch("/me", response_model=UserResponse)
def update_me(body: UserUpdate, user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role_name=user.role.name if user.role else None,
        created_at=user.created_at,
    )


@router.delete("/by-email/{email}")
def delete_user_by_email(email: str, user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    """Temporary helper: delete a user account by email."""
    from app.models.user import User

    if email.lower() == user.email.lower():
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    target = db.query(User).filter(User.email == email.lower()).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(target)
    db.commit()
    return {"success": True, "deleted_email": email}
