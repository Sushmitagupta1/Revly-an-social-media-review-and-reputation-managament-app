# Revly — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete project scaffolding — backend API with auth, frontend shell with sidebar/routing, Docker Compose orchestration — so all subsequent phases can add features on top.

**Architecture:** FastAPI backend with JWT auth + PostgreSQL. React 19 frontend with Vite, React Router, Tailwind CSS, shadcn/ui, Zustand. Docker Compose orchestrates frontend, backend, postgres, and nginx services.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, React Router 7, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16 (pgvector), PyJWT, bcrypt, Docker, Nginx

---

## File Map

| File | Purpose |
|---|---|
| `.gitignore` | Git ignore rules |
| `.env.example` | Environment variable template |
| `docker-compose.yml` | Multi-service orchestration |
| `nginx/nginx.conf` | Reverse proxy config |
| **Backend** | |
| `backend/requirements.txt` | Python dependencies |
| `backend/Dockerfile` | Backend container |
| `backend/app/__init__.py` | Package marker |
| `backend/app/main.py` | FastAPI app entry, CORS, router mounting |
| `backend/app/core/__init__.py` | Package marker |
| `backend/app/core/config.py` | Settings via pydantic-settings |
| `backend/app/core/database.py` | Engine, SessionLocal, Base |
| `backend/app/core/security.py` | JWT encode/decode, password hash/verify |
| `backend/app/models/__init__.py` | Model imports |
| `backend/app/models/base.py` | Declarative base with common columns |
| `backend/app/models/user.py` | User SQLAlchemy model |
| `backend/app/models/role.py` | Role SQLAlchemy model |
| `backend/app/schemas/__init__.py` | Schema imports |
| `backend/app/schemas/auth.py` | Login/Register/Token Pydantic schemas |
| `backend/app/schemas/user.py` | User response/request schemas |
| `backend/app/api/__init__.py` | Package marker |
| `backend/app/api/deps.py` | get_db, get_current_user dependencies |
| `backend/app/api/v1/__init__.py` | v1 router |
| `backend/app/api/v1/auth.py` | Auth endpoints |
| `backend/app/api/v1/users.py` | User endpoints |
| `backend/alembic.ini` | Alembic config |
| `backend/alembic/env.py` | Migration environment |
| `backend/alembic/script.py.mako` | Migration template |
| `backend/tests/__init__.py` | Package marker |
| `backend/tests/conftest.py` | Pytest fixtures |
| `backend/tests/test_auth.py` | Auth endpoint tests |
| `backend/tests/test_users.py` | User endpoint tests |
| **Frontend** | |
| `frontend/package.json` | Node dependencies |
| `frontend/vite.config.ts` | Vite config |
| `frontend/tsconfig.json` | TypeScript config |
| `frontend/tailwind.config.ts` | Tailwind config |
| `frontend/components.json` | shadcn config |
| `frontend/index.html` | HTML entry |
| `frontend/Dockerfile` | Frontend container (nginx serve) |
| `frontend/public/manifest.json` | PWA manifest |
| `frontend/public/icons/` | PWA icons (placeholder) |
| `frontend/src/main.tsx` | React entry point |
| `frontend/src/App.tsx` | Root component with RouterProvider |
| `frontend/src/app/routes.tsx` | Route tree definitions |
| `frontend/src/app/routes/` | Page components (one per route) |
| `frontend/src/components/ui/` | shadcn primitives |
| `frontend/src/components/layout/sidebar.tsx` | Left sidebar |
| `frontend/src/components/layout/header.tsx` | Top header |
| `frontend/src/components/layout/page-wrapper.tsx` | Page container |
| `frontend/src/components/layout/brand-selector.tsx` | Brand dropdown |
| `frontend/src/components/modals/location-filter-modal.tsx` | Location filter |
| `frontend/src/components/modals/date-filter-modal.tsx` | Date filter |
| `frontend/src/components/modals/platform-filter-modal.tsx` | Platform filter |
| `frontend/src/components/shared/kpi-card.tsx` | KPI display card |
| `frontend/src/components/shared/rating-badge.tsx` | Star rating badge |
| `frontend/src/components/shared/trend-indicator.tsx` | Trend arrow + text |
| `frontend/src/components/shared/empty-state.tsx` | Empty state placeholder |
| `frontend/src/components/shared/loading-spinner.tsx` | Loading spinner |
| `frontend/src/hooks/use-auth.ts` | Auth hook |
| `frontend/src/hooks/use-api.ts` | API fetch hook |
| `frontend/src/hooks/use-debounce.ts` | Debounce hook |
| `frontend/src/lib/api-client.ts` | Axios wrapper |
| `frontend/src/lib/utils.ts` | cn(), formatNumber() |
| `frontend/src/lib/constants.ts` | API URLs, defaults |
| `frontend/src/stores/auth-store.ts` | Zustand auth state |
| `frontend/src/stores/filter-store.ts` | Global filter state |
| `frontend/src/types/auth.ts` | Auth types |
| `frontend/src/types/user.ts` | User types |
| `frontend/src/types/api.ts` | API response types |
| `frontend/src/index.css` | Tailwind + design system CSS vars |

---

## Task 1: Initialize Git Repository

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

Run: `cd D:\Revly && git init`

- [ ] **Step 2: Create .gitignore**

```gitignore
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Build
dist/
build/
*.egg-info/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker
pgdata/

# Alembic
backend/alembic/versions/*.py
!backend/alembic/versions/.gitkeep

# Logs
*.log
```

- [ ] **Step 3: Initial commit**

```bash
git add .gitignore
git commit -m "chore: initialize repo with .gitignore"
```

---

## Task 2: Create Environment Template

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```bash
# Database
DATABASE_URL=postgresql://revly:revly@localhost:5432/revly

# JWT
JWT_SECRET=change-me-to-a-random-string-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# AI (Phase 4)
GEMINI_API_KEY=

# Google Drive (Phase 6)
GOOGLE_DRIVE_CREDENTIALS=
```

- [ ] **Step 2: Copy to .env**

Run: `copy .env.example .env`

- [ ] **Step 3: Commit**

```bash
git add .env.example .env
git commit -m "chore: add environment template"
```

---

## Task 3: Backend — FastAPI Project Setup

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/Dockerfile`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`

- [ ] **Step 1: Create backend directory structure**

```bash
mkdir -p backend/app/core backend/app/models backend/app/schemas backend/app/api/v1 backend/tests
```

- [ ] **Step 2: Create requirements.txt**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
alembic==1.14.1
psycopg2-binary==2.9.10
pydantic[email]==2.10.4
pydantic-settings==2.7.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
httpx==0.28.1
pytest==8.3.4
pytest-asyncio==0.25.0
```

- [ ] **Step 3: Create backend/app/__init__.py**

```python
```

- [ ] **Step 4: Create backend/app/core/__init__.py**

```python
```

- [ ] **Step 5: Create backend/app/core/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://revly:revly@localhost:5432/revly"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

- [ ] **Step 6: Create backend/app/core/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
```

- [ ] **Step 7: Create backend/app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(title="Revly API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 8: Create backend/Dockerfile**

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 9: Test backend starts locally**

Run: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --port 8000`
Expected: Server starts, GET http://localhost:8000/health returns `{"status": "ok"}`

- [ ] **Step 10: Commit**

```bash
git add backend/
git commit -m "feat: scaffold FastAPI backend with config and database"
```

---

## Task 4: Backend — Database Models

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/base.py`
- Create: `backend/app/models/role.py`
- Create: `backend/app/models/user.py`

- [ ] **Step 1: Create backend/app/models/base.py**

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
```

- [ ] **Step 2: Create backend/app/models/role.py**

```python
import uuid

from sqlalchemy import JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    permissions: Mapped[dict] = mapped_column(JSON, default=list)
```

- [ ] **Step 3: Create backend/app/models/user.py**

```python
import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[uuid.UUID | None] = mapped_column nullable=True)  # Removed - use DateTime

    role = relationship("Role", lazy="joined")
```

- [ ] **Step 4: Fix user.py (remove broken line)**

Replace the entire file with:

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    role = relationship("Role", lazy="joined")
```

- [ ] **Step 5: Create backend/app/models/__init__.py**

```python
from app.models.base import Base
from app.models.role import Role
from app.models.user import User

__all__ = ["Base", "Role", "User"]
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add User and Role SQLAlchemy models"
```

---

## Task 5: Backend — Security (JWT + Password Hashing)

**Files:**
- Create: `backend/app/core/security.py`

- [ ] **Step 1: Create backend/app/core/security.py**

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/security.py
git commit -m "feat: add JWT and password hashing utilities"
```

---

## Task 6: Backend — Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/schemas/user.py`

- [ ] **Step 1: Create backend/app/schemas/auth.py**

```python
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
```

- [ ] **Step 2: Create backend/app/schemas/user.py**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None
    role_name: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
```

- [ ] **Step 3: Create backend/app/schemas/__init__.py**

```python
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: add Pydantic schemas for auth and user"
```

---

## Task 7: Backend — API Dependencies

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/deps.py`

- [ ] **Step 1: Create backend/app/api/__init__.py**

```python
```

- [ ] **Step 2: Create backend/app/api/deps.py**

```python
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.user import User

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[Session, Depends(get_db)]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/
git commit -m "feat: add API dependencies (get_db, get_current_user)"
```

---

## Task 8: Backend — Auth Endpoints

**Files:**
- Create: `backend/app/api/v1/__init__.py`
- Create: `backend/app/api/v1/auth.py`
- Create: `backend/app/api/v1/users.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create backend/app/api/v1/__init__.py**

```python
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
```

- [ ] **Step 2: Create backend/app/api/v1/auth.py**

```python
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import DbSession, get_current_user, CurrentUser
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter()


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
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

    viewer_role = db.query(Role).filter(Role.name == "viewer").first()

    user = User(
        email=body.email,
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
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
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


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: DbSession):
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
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
```

- [ ] **Step 3: Create backend/app/api/v1/users.py**

```python
from fastapi import APIRouter

from app.api.deps import CurrentUser
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
def update_me(body: UserUpdate, user: CurrentUser, db: Session):
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
```

- [ ] **Step 4: Fix users.py (add missing import)**

Replace entire file with:

```python
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
```

- [ ] **Step 5: Update backend/app/main.py to mount v1 router**

Replace entire file with:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import router as v1_router
from app.core.config import settings

app = FastAPI(title="Revly API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: Test auth endpoints manually**

Run: `cd backend && uvicorn app.main:app --port 8000`

Test register:
```
POST http://localhost:8000/api/v1/auth/register
Body: {"email": "test@test.com", "password": "password123", "full_name": "Test User"}
```
Expected: 200 with user + tokens

Test login:
```
POST http://localhost:8000/api/v1/auth/login
Body: {"email": "test@test.com", "password": "password123"}
```
Expected: 200 with user + tokens

- [ ] **Step 7: Commit**

```bash
git add backend/app/api/
git commit -m "feat: add auth and user API endpoints"
```

---

## Task 9: Backend — Alembic Migrations

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`
- Create: `backend/alembic/versions/.gitkeep`

- [ ] **Step 1: Create backend/alembic.ini**

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = postgresql://revly:revly@localhost:5432/revly

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 2: Create backend/alembic/env.py**

```python
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.models import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Create backend/alembic/script.py.mako**

```mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 4: Create versions directory**

Run: `mkdir -p backend/alembic/versions && touch backend/alembic/versions/.gitkeep`

- [ ] **Step 5: Generate initial migration**

Run: `cd backend && alembic revision --autogenerate -m "initial schema"`
Expected: Creates a migration file in `alembic/versions/`

- [ ] **Step 6: Run migration**

Run: `cd backend && alembic upgrade head`
Expected: Tables `users` and `roles` created in PostgreSQL

- [ ] **Step 7: Commit**

```bash
git add backend/alembic/
git commit -m "feat: add Alembic migrations for initial schema"
```

---

## Task 10: Backend — Pytest Setup

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`
- Create: `backend/tests/test_users.py`

- [ ] **Step 1: Create backend/tests/conftest.py**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides = {}
    from app.api.deps import get_db
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c
```

- [ ] **Step 2: Create backend/tests/test_auth.py**

```python
def test_register_success(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "new@test.com",
        "password": "password123",
        "full_name": "New User",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "new@test.com"
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_email(client):
    client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "password": "password123",
        "full_name": "First User",
    })
    response = client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "password": "password456",
        "full_name": "Second User",
    })
    assert response.status_code == 409


def test_login_success(client):
    client.post("/api/v1/auth/register", json={
        "email": "login@test.com",
        "password": "password123",
        "full_name": "Login User",
    })
    response = client.post("/api/v1/auth/login", json={
        "email": "login@test.com",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "wrong@test.com",
        "password": "password123",
        "full_name": "Wrong User",
    })
    response = client.post("/api/v1/auth/login", json={
        "email": "wrong@test.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "password123",
    })
    assert response.status_code == 401


def test_refresh_token(client):
    register = client.post("/api/v1/auth/register", json={
        "email": "refresh@test.com",
        "password": "password123",
        "full_name": "Refresh User",
    })
    refresh_token = register.json()["refresh_token"]
    response = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_refresh_invalid_token(client):
    response = client.post("/api/v1/auth/refresh", json={
        "refresh_token": "invalid-token",
    })
    assert response.status_code == 401
```

- [ ] **Step 3: Create backend/tests/test_users.py**

```python
def get_auth_header(client):
    client.post("/api/v1/auth/register", json={
        "email": "me@test.com",
        "password": "password123",
        "full_name": "Me User",
    })
    login = client.post("/api/v1/auth/login", json={
        "email": "me@test.com",
        "password": "password123",
    })
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_me(client):
    headers = get_auth_header(client)
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "me@test.com"


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 403


def test_update_me(client):
    headers = get_auth_header(client)
    response = client.patch("/api/v1/users/me", json={"full_name": "Updated Name"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"
```

- [ ] **Step 4: Run tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All 9 tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/tests/
git commit -m "feat: add pytest tests for auth and user endpoints"
```

---

## Task 11: Frontend — Vite + React + TypeScript Setup

**Files:**
- Create: `frontend/` (via Vite scaffolding)
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.json`
- Create: `frontend/Dockerfile`

- [ ] **Step 1: Scaffold Vite project**

Run: `cd D:\Revly && npm create vite@latest frontend -- --template react-ts`

- [ ] **Step 2: Install dependencies**

Run: `cd frontend && npm install`

- [ ] **Step 3: Install additional dependencies**

Run: `cd frontend && npm install react-router-dom@7 zustand @tanstack/react-query axios recharts framer-motion`

- [ ] **Step 4: Install Tailwind CSS**

Run: `cd frontend && npm install -D tailwindcss @tailwindcss/vite`

- [ ] **Step 5: Create frontend/Dockerfile**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 6: Create frontend/nginx.conf (for Docker)**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Vite + React + TypeScript frontend"
```

---

## Task 12: Frontend — Tailwind + Design System CSS

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Update vite.config.ts for Tailwind**

Replace entire file with:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 2: Replace frontend/src/index.css with design system**

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;

  --color-primary: #0F172A;
  --color-sidebar: #16213E;
  --color-sidebar-hover: #2E4C9A;
  --color-dashboard-bg: #0F163D;
  --color-page-bg: #182A63;

  --color-card: #F8F8F6;
  --color-card-secondary: #F3F5F8;
  --color-card-blue: #DCEAFB;
  --color-card-pink: #F8D7D9;
  --color-card-yellow: #FFF1CF;
  --color-card-green: #EDF7EF;
  --color-surface: #FFFFFF;
  --color-background: #F9FAFB;

  --color-success: #12B76A;
  --color-success-soft: #6FE5A6;
  --color-warning: #F59E0B;
  --color-warning-soft: #F8E38A;
  --color-danger: #E53935;
  --color-danger-soft: #F7C9C9;
  --color-info: #4361EE;
  --color-info-soft: #BFD8FF;

  --color-accent: #FF5A1F;
  --color-accent-teal: #0D8A74;

  --color-text: #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
  --color-border: #E5E7EB;
}

@layer base {
  body {
    @apply bg-primary text-white font-sans antialiased;
  }
}
```

- [ ] **Step 3: Verify Tailwind works**

Run: `cd frontend && npm run dev`
Expected: Dev server starts, page loads with dark background

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css frontend/vite.config.ts
git commit -m "feat: add Tailwind CSS with Revly design system"
```

---

## Task 13: Frontend — shadcn/ui Setup

**Files:**
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/components.json`
- Create: `frontend/src/components/ui/*.tsx` (multiple shadcn components)

- [ ] **Step 1: Create frontend/src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
```

- [ ] **Step 2: Install shadcn dependencies**

Run: `cd frontend && npm install clsx tailwind-merge class-variance-authority lucide-react`

- [ ] **Step 3: Create components.json for shadcn**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 4: Manually create essential shadcn components**

Create these files (simplified shadcn implementations):

**frontend/src/components/ui/button.tsx:**
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        destructive: "bg-danger text-white hover:bg-danger/90",
        outline: "border border-border bg-transparent hover:bg-card-secondary",
        secondary: "bg-card-secondary text-text hover:bg-card-secondary/80",
        ghost: "hover:bg-card-secondary",
        link: "text-info underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**frontend/src/components/ui/input.tsx:**
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**frontend/src/components/ui/card.tsx:**
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-2xl border border-border bg-surface p-6", className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
```

**frontend/src/components/ui/badge.tsx:**
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-info text-white",
        secondary: "border-transparent bg-card-secondary text-text",
        success: "border-transparent bg-success text-white",
        warning: "border-transparent bg-warning text-white",
        destructive: "border-transparent bg-danger text-white",
        outline: "text-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/ frontend/src/components/ui/ frontend/components.json
git commit -m "feat: add shadcn/ui primitives and design utilities"
```

---

## Task 14: Frontend — Zustand Auth Store

**Files:**
- Create: `frontend/src/types/auth.ts`
- Create: `frontend/src/types/user.ts`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/stores/auth-store.ts`
- Create: `frontend/src/lib/api-client.ts`
- Create: `frontend/src/lib/constants.ts`

- [ ] **Step 1: Create frontend/src/types/auth.ts**

```typescript
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}
```

- [ ] **Step 2: Create frontend/src/types/user.ts**

```typescript
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role_name: string | null
  created_at: string
}
```

- [ ] **Step 3: Create frontend/src/types/api.ts**

```typescript
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  detail: string
}
```

- [ ] **Step 4: Create frontend/src/lib/constants.ts**

```typescript
export const API_BASE_URL = "/api/v1"

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  OVERVIEW: "/overview",
  REVIEWS: "/reviews",
  INBOX: "/inbox",
  COMPLAINTS: "/complaints",
  PRAISES: "/praises",
  LOCATION_LEADERBOARD: "/location-leaderboard",
  COMPETITORS: "/competitors",
  REPORTS: "/reports",
  ASK_REVLY: "/ask-revly",
  AUTOMATION: "/automation",
  NOTIFICATIONS: "/notifications",
  INTEGRATIONS: "/integrations",
  AUDIT_LOGS: "/audit-logs",
  ACCOUNT_PROFILE: "/account/profile",
  ACCOUNT_LOCATIONS: "/account/locations",
  ACCOUNT_TEAM: "/account/team",
  ACCOUNT_AUTO_RESPONSE: "/account/auto-response",
  ACCOUNT_PLATFORM: "/account/platform-integration",
  ACCOUNT_RESOLVE: "/account/resolve",
} as const
```

- [ ] **Step 5: Create frontend/src/lib/api-client.ts**

```typescript
import axios from "axios"
import { API_BASE_URL } from "./constants"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          localStorage.setItem("access_token", data.access_token)
          localStorage.setItem("refresh_token", data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return apiClient(originalRequest)
        } catch {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          window.location.href = "/login"
        }
      } else {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

- [ ] **Step 6: Create frontend/src/stores/auth-store.ts**

```typescript
import { create } from "zustand"
import { User } from "@/types/user"
import apiClient from "@/lib/api-client"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await apiClient.post("/auth/login", { email, password })
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (email, password, fullName) => {
    const { data } = await apiClient.post("/auth/register", {
      email,
      password,
      full_name: fullName,
    })
    localStorage.setItem("access_token", data.access_token)
    localStorage.setItem("refresh_token", data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    try {
      const { data } = await apiClient.get("/users/me")
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
```

- [ ] **Step 7: Create frontend/src/stores/filter-store.ts**

```typescript
import { create } from "zustand"

interface FilterState {
  selectedBrand: string
  selectedLocations: string[]
  dateRange: { from: string | null; to: string | null }
  datePreset: string
  selectedPlatforms: string[]
  setBrand: (brand: string) => void
  setLocations: (locations: string[]) => void
  setDateRange: (from: string | null, to: string | null) => void
  setDatePreset: (preset: string) => void
  setPlatforms: (platforms: string[]) => void
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedBrand: "Upper Crust",
  selectedLocations: [],
  dateRange: { from: null, to: null },
  datePreset: "Past 7 Days",
  selectedPlatforms: [],
  setBrand: (brand) => set({ selectedBrand: brand }),
  setLocations: (locations) => set({ selectedLocations: locations }),
  setDateRange: (from, to) => set({ dateRange: { from, to } }),
  setDatePreset: (preset) => set({ datePreset: preset }),
  setPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
}))
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/types/ frontend/src/stores/ frontend/src/lib/api-client.ts frontend/src/lib/constants.ts
git commit -m "feat: add auth store, filter store, API client, and types"
```

---

## Task 15: Frontend — Auth Pages

**Files:**
- Create: `frontend/src/app/routes.tsx`
- Create: `frontend/src/app/routes/login.tsx`
- Create: `frontend/src/app/routes/register.tsx`
- Create: `frontend/src/app/routes/auth-layout.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create frontend/src/app/routes/auth-layout.tsx**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/app/routes/login.tsx**

```tsx
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/overview")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-text">Welcome back</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in to your Revly account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-bg p-3 text-sm text-danger">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-text-secondary">
        Don't have an account?{" "}
        <Link to="/register" className="text-info hover:underline">Register</Link>
      </p>
    </>
  )
}
```

- [ ] **Step 3: Create frontend/src/app/routes/register.tsx**

```tsx
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email, password, fullName)
      navigate("/overview")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-text">Create account</h1>
        <p className="mt-1 text-sm text-text-secondary">Get started with Revly</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-bg p-3 text-sm text-danger">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Full Name</label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link to="/login" className="text-info hover:underline">Sign in</Link>
      </p>
    </>
  )
}
```

- [ ] **Step 4: Create placeholder pages for all routes**

Create these minimal placeholder files:

**frontend/src/app/routes/overview.tsx:**
```tsx
export default function OverviewPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Overview</h1><p className="mt-2 text-text-secondary">Dashboard coming in Phase 3</p></div>
}
```

**frontend/src/app/routes/reviews.tsx:**
```tsx
export default function ReviewsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Reviews</h1><p className="mt-2 text-text-secondary">Review feed coming in Phase 2</p></div>
}
```

**frontend/src/app/routes/inbox.tsx:**
```tsx
export default function InboxPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Inbox</h1></div>
}
```

**frontend/src/app/routes/complaints.tsx:**
```tsx
export default function ComplaintsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Complaints</h1></div>
}
```

**frontend/src/app/routes/praises.tsx:**
```tsx
export default function PraisesPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Praises</h1></div>
}
```

**frontend/src/app/routes/location-leaderboard.tsx:**
```tsx
export default function LocationLeaderboardPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Location Leaderboard</h1></div>
}
```

**frontend/src/app/routes/competitors.tsx:**
```tsx
export default function CompetitorsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Competitors</h1></div>
}
```

**frontend/src/app/routes/reports.tsx:**
```tsx
export default function ReportsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Reports</h1></div>
}
```

**frontend/src/app/routes/ask-revly.tsx:**
```tsx
export default function AskRevlyPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Ask Revly</h1><p className="mt-2 text-text-secondary">AI chat coming in Phase 4</p></div>
}
```

**frontend/src/app/routes/automation.tsx:**
```tsx
export default function AutomationPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Automation</h1></div>
}
```

**frontend/src/app/routes/notifications.tsx:**
```tsx
export default function NotificationsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Notifications</h1></div>
}
```

**frontend/src/app/routes/integrations.tsx:**
```tsx
export default function IntegrationsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Integrations</h1></div>
}
```

**frontend/src/app/routes/audit-logs.tsx:**
```tsx
export default function AuditLogsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Audit Logs</h1></div>
}
```

- [ ] **Step 5: Create account placeholder pages**

**frontend/src/app/routes/account/profile.tsx:**
```tsx
export default function ProfilePage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Profile</h1></div>
}
```

**frontend/src/app/routes/account/locations.tsx:**
```tsx
export default function LocationsPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Locations</h1></div>
}
```

**frontend/src/app/routes/account/team.tsx:**
```tsx
export default function TeamPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Team</h1></div>
}
```

**frontend/src/app/routes/account/auto-response.tsx:**
```tsx
export default function AutoResponsePage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Auto Response</h1></div>
}
```

**frontend/src/app/routes/account/platform-integration.tsx:**
```tsx
export default function PlatformIntegrationPage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Platform Integration</h1></div>
}
```

**frontend/src/app/routes/account/resolve.tsx:**
```tsx
export default function ResolvePage() {
  return <div className="text-white"><h1 className="text-2xl font-bold">Resolve</h1></div>
}
```

- [ ] **Step 6: Create frontend/src/app/routes.tsx (route tree)**

```tsx
import { createBrowserRouter, Navigate } from "react-router-dom"
import AuthLayout from "./routes/auth-layout"
import LoginPage from "./routes/login"
import RegisterPage from "./routes/register"
import DashboardLayout from "./routes/dashboard-layout"
import OverviewPage from "./routes/overview"
import ReviewsPage from "./routes/reviews"
import InboxPage from "./routes/inbox"
import ComplaintsPage from "./routes/complaints"
import PraisesPage from "./routes/praises"
import LocationLeaderboardPage from "./routes/location-leaderboard"
import CompetitorsPage from "./routes/competitors"
import ReportsPage from "./routes/reports"
import AskRevlyPage from "./routes/ask-revly"
import AutomationPage from "./routes/automation"
import NotificationsPage from "./routes/notifications"
import IntegrationsPage from "./routes/integrations"
import AuditLogsPage from "./routes/audit-logs"
import ProfilePage from "./routes/account/profile"
import LocationsPage from "./routes/account/locations"
import TeamPage from "./routes/account/team"
import AutoResponsePage from "./routes/account/auto-response"
import PlatformIntegrationPage from "./routes/account/platform-integration"
import ResolvePage from "./routes/account/resolve"
import AccountLayout from "./routes/account-layout"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthLayout><LoginPage /></AuthLayout>,
  },
  {
    path: "/register",
    element: <AuthLayout><RegisterPage /></AuthLayout>,
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: "overview", element: <OverviewPage /> },
      { path: "reviews", element: <ReviewsPage /> },
      { path: "inbox", element: <InboxPage /> },
      { path: "complaints", element: <ComplaintsPage /> },
      { path: "praises", element: <PraisesPage /> },
      { path: "location-leaderboard", element: <LocationLeaderboardPage /> },
      { path: "competitors", element: <CompetitorsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "ask-revly", element: <AskRevlyPage /> },
      { path: "automation", element: <AutomationPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "integrations", element: <IntegrationsPage /> },
      { path: "audit-logs", element: <AuditLogsPage /> },
      {
        path: "account",
        element: <AccountLayout />,
        children: [
          { index: true, element: <Navigate to="profile" replace /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "locations", element: <LocationsPage /> },
          { path: "team", element: <TeamPage /> },
          { path: "auto-response", element: <AutoResponsePage /> },
          { path: "platform-integration", element: <PlatformIntegrationPage /> },
          { path: "resolve", element: <ResolvePage /> },
        ],
      },
    ],
  },
])
```

- [ ] **Step 7: Create frontend/src/app/routes/dashboard-layout.tsx**

```tsx
import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dashboard-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col ml-[280px]">
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create frontend/src/app/routes/account-layout.tsx**

```tsx
import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const links = [
  { to: "/account/profile", label: "Profile" },
  { to: "/account/locations", label: "Locations" },
  { to: "/account/team", label: "Team" },
  { to: "/account/auto-response", label: "Auto Response" },
  { to: "/account/platform-integration", label: "Platform Integration" },
  { to: "/account/resolve", label: "Resolve" },
]

export default function AccountLayout() {
  return (
    <div className="flex gap-6">
      <nav className="w-56 shrink-0 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-hover text-white"
                  : "text-text-secondary hover:bg-sidebar-hover/50 hover:text-white"
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
        <button className="mt-4 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger-bg">
          Log out
        </button>
      </nav>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Update frontend/src/App.tsx**

Replace entire file with:

```tsx
import { RouterProvider } from "react-router-dom"
import { router } from "@/app/routes"

export default function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 10: Update frontend/src/main.tsx**

Replace entire file with:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Test frontend compiles**

Run: `cd frontend && npm run dev`
Expected: Dev server starts, navigating to /login shows login form

- [ ] **Step 12: Commit**

```bash
git add frontend/src/app/ frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat: add auth pages, route tree, and dashboard layout"
```

---

## Task 16: Frontend — Sidebar Component

**Files:**
- Create: `frontend/src/components/layout/sidebar.tsx`
- Create: `frontend/src/components/layout/header.tsx`

- [ ] **Step 1: Create frontend/src/components/layout/sidebar.tsx**

```tsx
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useFilterStore } from "@/stores/filter-store"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"

const navLinks = [
  { to: "/overview", label: "Dashboard" },
  { to: "/location-leaderboard", label: "Location Leaderboard" },
  { to: "/reviews", label: "Reviews" },
  { to: "/inbox", label: "Inbox" },
  { to: "/complaints", label: "Complaints" },
  { to: "/praises", label: "Praises" },
  { to: "/ask-revly", label: "Ask Revly" },
  { to: "/competitors", label: "Competitors" },
  { to: "/reports", label: "Reports" },
  { to: "/automation", label: "Automation" },
  { to: "/notifications", label: "Notifications" },
  { to: "/integrations", label: "Integrations" },
  { to: "/audit-logs", label: "Audit Logs" },
  { to: "/account", label: "Account" },
]

export default function Sidebar() {
  const { selectedBrand, datePreset, selectedPlatforms } = useFilterStore()
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col bg-sidebar">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">R</div>
          <span className="text-lg font-bold text-white">Revly</span>
        </div>

        <div className="space-y-2">
          <button className="w-full rounded-lg bg-sidebar-hover/30 px-3 py-2 text-left text-sm text-white">
            <span className="text-text-muted text-xs">Brand</span>
            <div className="font-medium">{selectedBrand}</div>
          </button>
          <button className="w-full rounded-lg bg-sidebar-hover/30 px-3 py-2 text-left text-sm text-white">
            <span className="text-text-muted text-xs">Time</span>
            <div className="font-medium">{datePreset}</div>
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/account"}
            className={({ isActive }) =>
              cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-hover text-white"
                  : "text-text-secondary hover:bg-sidebar-hover/50 hover:text-white"
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4">
        <div className="rounded-xl bg-accent/20 p-4">
          <p className="text-xs font-medium text-accent">Upgrade to Revly Pro</p>
          <p className="mt-1 text-xs text-text-secondary">Unlock AI insights</p>
        </div>
        <Button variant="ghost" className="mt-2 w-full text-text-secondary" onClick={logout}>
          Log out
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/layout/header.tsx**

```tsx
import { useAuthStore } from "@/stores/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Header() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-sidebar/50 px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">{user?.full_name}</span>
        <Avatar>
          <AvatarFallback className="bg-info text-white">
            {user?.full_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Create Avatar component (needed by header)**

**frontend/src/components/ui/avatar.tsx:**
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  )
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/ frontend/src/components/ui/avatar.tsx
git commit -m "feat: add sidebar and header components"
```

---

## Task 17: Frontend — Filter Modals

**Files:**
- Create: `frontend/src/components/modals/location-filter-modal.tsx`
- Create: `frontend/src/components/modals/date-filter-modal.tsx`
- Create: `frontend/src/components/modals/platform-filter-modal.tsx`

- [ ] **Step 1: Create location filter modal**

**frontend/src/components/modals/location-filter-modal.tsx:**
```tsx
import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MOCK_LOCATIONS = [
  "Upper Crust Bakery Vastrapur",
  "Upper Crust Bakery Bopal",
  "Upper Crust Bakery Satellite",
  "Upper Crust Bakery Prahlad Nagar",
  "Upper Crust Bakery Vijay Cross Road",
  "Upper Crust Bakery Shilaj",
  "Upper Crust Bakery SG Highway",
  "Upper Crust Bakery Thaltej",
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function LocationFilterModal({ open, onClose }: Props) {
  const { selectedLocations, setLocations } = useFilterStore()
  const [search, setSearch] = useState("")
  const [temp, setTemp] = useState<string[]>(selectedLocations)

  const filtered = MOCK_LOCATIONS.filter((l) =>
    l.toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = temp.length === MOCK_LOCATIONS.length

  const toggleAll = () => {
    setTemp(allSelected ? [] : [...MOCK_LOCATIONS])
  }

  const toggle = (loc: string) => {
    setTemp((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    )
  }

  const apply = () => {
    setLocations(temp)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Filter Locations</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">✕</button>
        </div>
        <Input
          placeholder="Search locations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <div className="max-h-64 space-y-2 overflow-y-auto">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-card-secondary">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-text">All Locations ({MOCK_LOCATIONS.length})</span>
          </label>
          {filtered.map((loc) => (
            <label key={loc} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-card-secondary">
              <input
                type="checkbox"
                checked={temp.includes(loc)}
                onChange={() => toggle(loc)}
                className="h-4 w-4"
              />
              <span className="text-sm text-text">{loc}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create date filter modal**

**frontend/src/components/modals/date-filter-modal.tsx:**
```tsx
import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PRESETS = ["Today", "Yesterday", "Past 7 Days", "Past 30 Days"]
const GRANULARITIES = ["Daily", "Weekly", "Monthly", "Quarterly"]

interface Props {
  open: boolean
  onClose: () => void
}

export default function DateFilterModal({ open, onClose }: Props) {
  const { datePreset, setDatePreset, dateRange, setDateRange } = useFilterStore()
  const [tempPreset, setTempPreset] = useState(datePreset)
  const [tempRange, setTempRange] = useState(dateRange)

  const apply = () => {
    setDatePreset(tempPreset)
    setDateRange(tempRange.from, tempRange.to)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Filter by Date</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">✕</button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-text-secondary">Range</label>
          <div className="flex gap-2">
            {GRANULARITIES.map((g) => (
              <button
                key={g}
                onClick={() => setTempPreset(g)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  tempPreset === g
                    ? "border-info bg-info text-white"
                    : "border-border text-text-secondary hover:border-info"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-text-secondary">Quick Select</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTempPreset(p)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  tempPreset === p
                    ? "border-info bg-info text-white"
                    : "border-border text-text hover:border-info"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-text-secondary">Custom Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={tempRange.from || ""}
              onChange={(e) => setTempRange((r) => ({ ...r, from: e.target.value || null }))}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            />
            <input
              type="date"
              value={tempRange.to || ""}
              onChange={(e) => setTempRange((r) => ({ ...r, to: e.target.value || null }))}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create platform filter modal**

**frontend/src/components/modals/platform-filter-modal.tsx:**
```tsx
import { useState } from "react"
import { useFilterStore } from "@/stores/filter-store"
import { Button } from "@/components/ui/button"

const PLATFORMS = [
  { id: "google", label: "Google My Business", icon: "G" },
  { id: "zomato", label: "Zomato", icon: "Z" },
  { id: "reelo", label: "Reelo", icon: "R" },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function PlatformFilterModal({ open, onClose }: Props) {
  const { selectedPlatforms, setPlatforms } = useFilterStore()
  const [temp, setTemp] = useState<string[]>(selectedPlatforms)

  const toggle = (id: string) => {
    setTemp((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const apply = () => {
    setPlatforms(temp)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Filter Platforms</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">✕</button>
        </div>
        <div className="space-y-2">
          {PLATFORMS.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-card-secondary">
              <input
                type="checkbox"
                checked={temp.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="h-4 w-4"
              />
              <span className="flex h-6 w-6 items-center justify-center rounded bg-info text-xs font-bold text-white">{p.icon}</span>
              <span className="text-sm text-text">{p.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={apply}>Apply</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/modals/
git commit -m "feat: add location, date, and platform filter modals"
```

---

## Task 18: Frontend — Shared Components

**Files:**
- Create: `frontend/src/components/shared/kpi-card.tsx`
- Create: `frontend/src/components/shared/rating-badge.tsx`
- Create: `frontend/src/components/shared/trend-indicator.tsx`
- Create: `frontend/src/components/shared/empty-state.tsx`
- Create: `frontend/src/components/shared/loading-spinner.tsx`

- [ ] **Step 1: Create shared components**

**frontend/src/components/shared/kpi-card.tsx:**
```tsx
import { cn } from "@/lib/utils"

interface Props {
  label: string
  value: string | number
  trend?: { value: string; direction: "up" | "down" }
  className?: string
}

export default function KpiCard({ label, value, trend, className }: Props) {
  return (
    <div className={cn("rounded-2xl p-6", className)}>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-bold text-text">{value}</p>
      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trend.direction === "up" ? "text-success" : "text-danger")}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  )
}
```

**frontend/src/components/shared/rating-badge.tsx:**
```tsx
import { cn } from "@/lib/utils"

const ratingColors: Record<number, string> = {
  5: "bg-success text-white",
  4: "bg-[#5AC8FA] text-white",
  3: "bg-warning text-white",
  2: "bg-[#FF8A3D] text-white",
  1: "bg-danger text-white",
}

interface Props {
  rating: number
  size?: "sm" | "md" | "lg"
}

export default function RatingBadge({ rating, size = "md" }: Props) {
  const rounded = Math.round(rating)
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold",
        ratingColors[rounded] || "bg-gray-400 text-white",
        size === "sm" && "h-6 w-6 text-xs",
        size === "md" && "h-8 w-8 text-sm",
        size === "lg" && "h-10 w-10 text-base"
      )}
    >
      {rating.toFixed(1)}
    </span>
  )
}
```

**frontend/src/components/shared/trend-indicator.tsx:**
```tsx
import { cn } from "@/lib/utils"

interface Props {
  value: string
  direction: "up" | "down"
  className?: string
}

export default function TrendIndicator({ value, direction, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        direction === "up" ? "text-success" : "text-danger",
        className
      )}
    >
      {direction === "up" ? "↑" : "↓"} {value}
    </span>
  )
}
```

**frontend/src/components/shared/empty-state.tsx:**
```tsx
interface Props {
  title: string
  description?: string
}

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card-secondary">
        <span className="text-2xl">📊</span>
      </div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </div>
  )
}
```

**frontend/src/components/shared/loading-spinner.tsx:**
```tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-info border-t-transparent" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shared/
git commit -m "feat: add shared components (KPI card, rating badge, trend indicator)"
```

---

## Task 19: Frontend — PWA Manifest

**Files:**
- Create: `frontend/public/manifest.json`
- Create: `frontend/public/icons/` (placeholder)
- Modify: `frontend/index.html`

- [ ] **Step 1: Create frontend/public/manifest.json**

```json
{
  "name": "Revly",
  "short_name": "Revly",
  "description": "AI Review & Reputation Management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Create placeholder icons**

Run: `mkdir -p frontend/public/icons`

Create simple placeholder SVGs as PNG references (actual icons created in Phase 6).

- [ ] **Step 3: Update frontend/index.html to link manifest**

Add to `<head>`:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0F172A" />
```

- [ ] **Step 4: Commit**

```bash
git add frontend/public/ frontend/index.html
git commit -m "feat: add PWA manifest and placeholder icons"
```

---

## Task 20: Docker Compose Orchestration

**Files:**
- Create: `docker-compose.yml`
- Create: `nginx/nginx.conf`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: revly
      POSTGRES_PASSWORD: revly
      POSTGRES_DB: revly
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U revly"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://revly:revly@db:5432/revly
      JWT_SECRET: ${JWT_SECRET:-dev-secret-change-in-prod}
      CORS_ORIGINS: http://localhost:3000,http://localhost:5173
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  pgdata:
```

- [ ] **Step 2: Create nginx/nginx.conf**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;

        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml nginx/
git commit -m "feat: add Docker Compose and Nginx configuration"
```

---

## Task 21: Final Integration Test

**Files:** None (verification only)

- [ ] **Step 1: Start all services**

Run: `docker compose up --build -d`

- [ ] **Step 2: Verify backend health**

Run: `curl http://localhost/health`
Expected: `{"status": "ok"}`

- [ ] **Step 3: Verify frontend loads**

Open `http://localhost` in browser
Expected: Login page renders

- [ ] **Step 4: Test registration flow**

- Register a new user
- Redirects to /overview
- Sidebar renders with all nav links
- User name shows in header

- [ ] **Step 5: Test login flow**

- Log out
- Log in with same credentials
- Redirects to /overview

- [ ] **Step 6: Test filter modals**

- Click brand selector → (placeholder dropdown)
- Click time filter → date modal opens
- Click platform filter → platform modal opens

- [ ] **Step 7: Test account navigation**

- Click Account in sidebar
- Sub-navigation shows Profile, Locations, Team, etc.
- Each page renders placeholder content

- [ ] **Step 8: Stop services**

Run: `docker compose down`

- [ ] **Step 9: Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 Foundation complete"
```

---

## Phase 1 Complete

After this plan is executed, Revly has:

1. Working Docker Compose stack (frontend, backend, postgres, nginx)
2. JWT authentication (register, login, refresh, logout)
3. Full dashboard shell with sidebar navigation
4. Filter modals (location, date, platform)
5. Account sub-layout with navigation
6. All routes wired as placeholder pages
7. Design system CSS variables matching the Olly palette
8. PWA manifest ready
9. Backend tests passing
10. Ready for Phase 2 (Reviews) to build on top
