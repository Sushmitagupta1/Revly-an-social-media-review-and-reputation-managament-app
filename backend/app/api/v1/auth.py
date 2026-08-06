import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession, CurrentUser
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    SetupTeamRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse

router = APIRouter()


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role_name=user.role.name if user.role else None,
        created_at=user.created_at,
    )


@router.post("/register", response_model=dict)
def register(body: RegisterRequest, db: DbSession):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if body.username:
        existing_username = db.query(User).filter(User.username == body.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

    viewer_role = db.query(Role).filter(Role.name == "viewer").first()

    user = User(
        email=body.email,
        username=body.username,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        role_id=viewer_role.id if viewer_role else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token_data = {"sub": str(user.id), "email": user.email}
    return {
        "user": user_to_response(user),
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


@router.post("/login", response_model=dict)
def login(body: LoginRequest, db: DbSession):
    identifier = body.username.strip()
    user = (
        db.query(User)
        .filter((User.username == identifier) | (User.email == identifier))
        .first()
    )
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token_data = {"sub": str(user.id), "email": user.email}
    return {
        "user": user_to_response(user),
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }


@router.post("/setup-team", response_model=dict)
def setup_team(body: SetupTeamRequest, db: DbSession, user: CurrentUser):
    """Create or update team members with username + password (username becomes the login id)."""
    results = []
    for item in body.users:
        username = item.username.strip()
        if not username:
            continue
        existing = db.query(User).filter(User.username == username).first()
        if not existing:
            existing = (
                db.query(User)
                .filter(User.full_name.ilike(item.full_name.strip()))
                .first()
                if item.full_name.strip()
                else None
            )
        if existing:
            existing.username = username
            if item.full_name.strip():
                existing.full_name = item.full_name.strip()
            existing.password_hash = hash_password(item.password)
            existing.is_active = True
            action = "updated"
        else:
            slug = username.lower().replace(" ", ".").replace("@", "_")
            email = f"{slug}@uppercrust.com"
            suffix = 1
            while db.query(User).filter(User.email == email).first():
                email = f"{slug}{suffix}@uppercrust.com"
                suffix += 1
            user_row = User(
                email=email,
                username=username,
                full_name=item.full_name.strip() or username,
                password_hash=hash_password(item.password),
                is_active=True,
            )
            db.add(user_row)
            action = "created"
        results.append({"username": username, "action": action})
    db.commit()
    return {"success": True, "users": results}


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: DbSession):
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    token_data = {"sub": str(user.id), "email": user.email}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/logout")
def logout(user: CurrentUser):
    return {"message": "Logged out"}
