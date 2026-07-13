# Phase 7: Remaining Feature Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 6 remaining stub pages — Automation, Integrations, Audit Logs, Auto-Response, Platform Integration, and Resolve — with full backend models, endpoints, and frontend UIs.

**Architecture:** Each feature gets its own SQLAlchemy model, Pydantic schemas, FastAPI router, Zustand store, TypeScript types, page component, and supporting UI components. All follow existing patterns: UUID PKs, MOCK_BRAND_ID brand scoping, `Base + TimestampMixin`, Zustand stores with `isLoading` + `fetch*()`, and Tailwind `rounded-2xl` card-based layouts.

**Tech Stack:** SQLAlchemy 2, Pydantic v2, FastAPI, React 19, Zustand, Tailwind CSS, lucide-react icons

---

## Task 1: Audit Log Model + Endpoint + Seed

**Files:**
- Create: `backend/app/models/audit_log.py`
- Create: `backend/app/schemas/audit_log.py`
- Create: `backend/app/api/v1/audit_logs.py`
- Create: `backend/app/seeds/audit_logs.py`
- Modify: `backend/app/models/__init__.py` (add import)
- Modify: `backend/app/api/v1/__init__.py` (register router)
- Create: `backend/tests/test_audit_logs.py`

- [ ] **Step 1: Create AuditLog model**

```python
# backend/app/models/audit_log.py
import uuid
from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class AuditLog(Base, TimestampMixin):
    __initable__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
```

- [ ] **Step 2: Create AuditLog Pydantic schemas**

```python
# backend/app/schemas/audit_log.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    action: str
    entity_type: str
    entity_id: str | None = None
    details: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int
```

- [ ] **Step 3: Create AuditLog API endpoint**

```python
# backend/app/api/v1/audit_logs.py
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
```

- [ ] **Step 4: Register router and model import**

```python
# Add to backend/app/models/__init__.py (after existing imports)
from app.models.audit_log import AuditLog
```

```python
# Add to backend/app/api/v1/__init__.py (after existing router includes)
from app.api.v1.audit_logs import router as audit_logs_router
router.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])
```

- [ ] **Step 5: Create seed script**

```python
# backend/app/seeds/audit_logs.py
import uuid
from app.core.database import SessionLocal
from app.models.audit_log import AuditLog
from app.core.constants import MOCK_BRAND_ID

ACTIONS = [
    ("reply_sent", "reply", "Sent auto-reply to review"),
    ("review_resolved", "review", "Resolved review manually"),
    ("location_added", "location", "Added new location: SG Highway"),
    ("competitor_tracked", "competitor", "Started tracking competitor: Taste of Punjab"),
    ("settings_updated", "settings", "Updated auto-response settings"),
    ("integration_connected", "integration", "Connected Google Business account"),
    ("auto_reply_triggered", "automation", "Auto-reply triggered for positive review"),
]

SEED_USER_ID = uuid.uuid4()


def seed_audit_logs():
    db = SessionLocal()
    try:
        if db.query(AuditLog).count() > 0:
            print("Audit logs already seeded. Skipping.")
            return
        for action, entity_type, details in ACTIONS:
            db.add(AuditLog(
                brand_id=MOCK_BRAND_ID,
                user_id=SEED_USER_ID,
                user_name="System",
                action=action,
                entity_type=entity_type,
                details=details,
            ))
        db.commit()
        print(f"Seeded {len(ACTIONS)} audit logs.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_audit_logs()
```

- [ ] **Step 6: Write and run tests**

```python
# backend/tests/test_audit_logs.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.audit_log import AuditLog
from app.core.constants import MOCK_BRAND_ID


@pytest.fixture(autouse=True)
def _seed_audit_logs(db_session):
    from app.seeds.audit_logs import ACTIONS, SEED_USER_ID
    for action, entity_type, details in ACTIONS:
        db_session.add(AuditLog(
            brand_id=MOCK_BRAND_ID,
            user_id=SEED_USER_ID,
            user_name="System",
            action=action,
            entity_type=entity_type,
            details=details,
        ))
    db_session.commit()


client = TestClient(app)


def test_list_audit_logs():
    resp = client.get("/api/v1/audit-logs", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 7
    assert len(data["logs"]) == 7


def test_list_audit_logs_filter_action():
    resp = client.get("/api/v1/audit-logs?action=reply_sent", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_list_audit_logs_filter_entity():
    resp = client.get("/api/v1/audit-logs?entity_type=review", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
```

```bash
cd backend && python -m pytest tests/test_audit_logs.py -v
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/audit_log.py backend/app/schemas/audit_log.py backend/app/api/v1/audit_logs.py backend/app/seeds/audit_logs.py backend/tests/test_audit_logs.py backend/app/models/__init__.py backend/app/api/v1/__init__.py
git commit -m "feat: add Audit Log model, CRUD endpoint, seed, and tests"
```

---

## Task 2: Automation Model + Endpoint

**Files:**
- Create: `backend/app/models/automation_rule.py`
- Create: `backend/app/schemas/automation.py`
- Create: `backend/app/api/v1/automation.py`
- Create: `backend/app/seeds/automation_rules.py`
- Modify: `backend/app/models/__init__.py` (add import)
- Modify: `backend/app/api/v1/__init__.py` (register router)
- Create: `backend/tests/test_automation.py`

- [ ] **Step 1: Create AutomationRule model**

```python
# backend/app/models/automation_rule.py
import uuid
from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class AutomationRule(Base, TimestampMixin):
    __tablename__ = "automation_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    trigger: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "sentiment_negative", "sentiment_positive", "topic_delivery"
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "auto_reply", "flag_urgent", "assign_team"
    template: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    execution_count: Mapped[int] = mapped_column(Integer, default=0)
```

- [ ] **Step 2: Create Pydantic schemas**

```python
# backend/app/schemas/automation.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class AutomationRuleCreate(BaseModel):
    name: str
    trigger: str
    action: str
    template: str | None = None


class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    trigger: str | None = None
    action: str | None = None
    template: str | None = None
    is_active: bool | None = None


class AutomationRuleResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    name: str
    trigger: str
    action: str
    template: str | None = None
    is_active: bool
    execution_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AutomationRuleListResponse(BaseModel):
    rules: list[AutomationRuleResponse]
    total: int
```

- [ ] **Step 3: Create API endpoint**

```python
# backend/app/api/v1/automation.py
import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.automation_rule import AutomationRule
from app.schemas.automation import (
    AutomationRuleCreate, AutomationRuleUpdate, AutomationRuleResponse, AutomationRuleListResponse,
)

router = APIRouter()


@router.get("", response_model=AutomationRuleListResponse)
def list_rules(db: DbSession, _user: CurrentUser):
    rows = db.query(AutomationRule).filter(AutomationRule.brand_id == MOCK_BRAND_ID).order_by(AutomationRule.created_at.desc()).all()
    return AutomationRuleListResponse(
        rules=[AutomationRuleResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=AutomationRuleResponse)
def create_rule(body: AutomationRuleCreate, db: DbSession, _user: CurrentUser):
    rule = AutomationRule(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return AutomationRuleResponse.model_validate(rule)


@router.patch("/{rule_id}", response_model=AutomationRuleResponse)
def update_rule(rule_id: str, body: AutomationRuleUpdate, db: DbSession, _user: CurrentUser):
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == uuid.UUID(rule_id),
        AutomationRule.brand_id == MOCK_BRAND_ID,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return AutomationRuleResponse.model_validate(rule)


@router.delete("/{rule_id}")
def delete_rule(rule_id: str, db: DbSession, _user: CurrentUser):
    rule = db.query(AutomationRule).filter(
        AutomationRule.id == uuid.UUID(rule_id),
        AutomationRule.brand_id == MOCK_BRAND_ID,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"ok": True}
```

- [ ] **Step 4: Register router and model**

```python
# Add to backend/app/models/__init__.py
from app.models.automation_rule import AutomationRule
```

```python
# Add to backend/app/api/v1/__init__.py
from app.api.v1.automation import router as automation_router
router.include_router(automation_router, prefix="/automation", tags=["automation"])
```

- [ ] **Step 5: Create seed script**

```python
# backend/app/seeds/automation_rules.py
from app.core.database import SessionLocal
from app.models.automation_rule import AutomationRule
from app.core.constants import MOCK_BRAND_ID

RULES = [
    ("Auto-reply to positive reviews", "sentiment_positive", "auto_reply", "Thank you for the wonderful feedback! We're glad you enjoyed your experience."),
    ("Auto-reply to negative reviews", "sentiment_negative", "auto_reply", "We're sorry to hear about your experience. Please contact us so we can make it right."),
    ("Flag urgent complaints", "topic_urgent", "flag_urgent", None),
    ("Assign delivery issues to manager", "topic_delivery", "assign_team", None),
]


def seed_automation_rules():
    db = SessionLocal()
    try:
        if db.query(AutomationRule).count() > 0:
            print("Automation rules already seeded. Skipping.")
            return
        for name, trigger, action, template in RULES:
            db.add(AutomationRule(brand_id=MOCK_BRAND_ID, name=name, trigger=trigger, action=action, template=template))
        db.commit()
        print(f"Seeded {len(RULES)} automation rules.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_automation_rules()
```

- [ ] **Step 6: Write and run tests**

```python
# backend/tests/test_automation.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.automation_rule import AutomationRule
from app.core.constants import MOCK_BRAND_ID


@pytest.fixture(autouse=True)
def _seed_rules(db_session):
    from app.seeds.automation_rules import RULES
    for name, trigger, action, template in RULES:
        db_session.add(AutomationRule(brand_id=MOCK_BRAND_ID, name=name, trigger=trigger, action=action, template=template))
    db_session.commit()


client = TestClient(app)


def test_list_rules():
    resp = client.get("/api/v1/automation", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 4


def test_create_rule():
    resp = client.post("/api/v1/automation", json={"name": "Test rule", "trigger": "sentiment_positive", "action": "auto_reply"}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test rule"
    assert resp.json()["is_active"] is True


def test_update_rule():
    list_resp = client.get("/api/v1/automation", headers={"Authorization": "Bearer test-token"})
    rule_id = list_resp.json()["rules"][0]["id"]
    resp = client.patch(f"/api/v1/automation/{rule_id}", json={"is_active": False}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_delete_rule():
    list_resp = client.get("/api/v1/automation", headers={"Authorization": "Bearer test-token"})
    rule_id = list_resp.json()["rules"][0]["id"]
    resp = client.delete(f"/api/v1/automation/{rule_id}", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    list_resp2 = client.get("/api/v1/automation", headers={"Authorization": "Bearer test-token"})
    assert list_resp2.json()["total"] == 3
```

```bash
cd backend && python -m pytest tests/test_automation.py -v
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/automation_rule.py backend/app/schemas/automation.py backend/app/api/v1/automation.py backend/app/seeds/automation_rules.py backend/tests/test_automation.py backend/app/models/__init__.py backend/app/api/v1/__init__.py
git commit -m "feat: add Automation Rule model, CRUD endpoint, seed, and tests"
```

---

## Task 3: Auto-Response Model + Endpoint

**Files:**
- Create: `backend/app/models/auto_response.py`
- Create: `backend/app/schemas/auto_response.py`
- Create: `backend/app/api/v1/auto_responses.py`
- Create: `backend/app/seeds/auto_responses.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`
- Create: `backend/tests/test_auto_responses.py`

- [ ] **Step 1: Create AutoResponse model**

```python
# backend/app/models/auto_response.py
import uuid
from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class AutoResponse(Base, TimestampMixin):
    __tablename__ = "auto_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    sentiment: Mapped[str] = mapped_column(String(50), nullable=False)  # positive, negative, neutral
    topic: Mapped[str] = mapped_column(String(100), nullable=False)  # food, service, delivery, ambiance, general
    template: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

- [ ] **Step 2: Create Pydantic schemas**

```python
# backend/app/schemas/auto_response.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class AutoResponseCreate(BaseModel):
    sentiment: str
    topic: str
    template: str


class AutoResponseUpdate(BaseModel):
    sentiment: str | None = None
    topic: str | None = None
    template: str | None = None
    is_active: bool | None = None


class AutoResponseResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    sentiment: str
    topic: str
    template: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AutoResponseListResponse(BaseModel):
    responses: list[AutoResponseResponse]
    total: int
```

- [ ] **Step 3: Create API endpoint**

```python
# backend/app/api/v1/auto_responses.py
import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.auto_response import AutoResponse
from app.schemas.auto_response import (
    AutoResponseCreate, AutoResponseUpdate, AutoResponseResponse, AutoResponseListResponse,
)

router = APIRouter()


@router.get("", response_model=AutoResponseListResponse)
def list_auto_responses(db: DbSession, _user: CurrentUser):
    rows = db.query(AutoResponse).filter(AutoResponse.brand_id == MOCK_BRAND_ID).order_by(AutoResponse.sentiment, AutoResponse.topic).all()
    return AutoResponseListResponse(
        responses=[AutoResponseResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=AutoResponseResponse)
def create_auto_response(body: AutoResponseCreate, db: DbSession, _user: CurrentUser):
    ar = AutoResponse(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(ar)
    db.commit()
    db.refresh(ar)
    return AutoResponseResponse.model_validate(ar)


@router.patch("/{response_id}", response_model=AutoResponseResponse)
def update_auto_response(response_id: str, body: AutoResponseUpdate, db: DbSession, _user: CurrentUser):
    ar = db.query(AutoResponse).filter(
        AutoResponse.id == uuid.UUID(response_id),
        AutoResponse.brand_id == MOCK_BRAND_ID,
    ).first()
    if not ar:
        raise HTTPException(status_code=404, detail="Auto-response not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ar, k, v)
    db.commit()
    db.refresh(ar)
    return AutoResponseResponse.model_validate(ar)


@router.delete("/{response_id}")
def delete_auto_response(response_id: str, db: DbSession, _user: CurrentUser):
    ar = db.query(AutoResponse).filter(
        AutoResponse.id == uuid.UUID(response_id),
        AutoResponse.brand_id == MOCK_BRAND_ID,
    ).first()
    if not ar:
        raise HTTPException(status_code=404, detail="Auto-response not found")
    db.delete(ar)
    db.commit()
    return {"ok": True}
```

- [ ] **Step 4: Register router and model**

```python
# Add to backend/app/models/__init__.py
from app.models.auto_response import AutoResponse
```

```python
# Add to backend/app/api/v1/__init__.py
from app.api.v1.auto_responses import router as auto_responses_router
router.include_router(auto_responses_router, prefix="/auto-responses", tags=["auto-responses"])
```

- [ ] **Step 5: Create seed script**

```python
# backend/app/seeds/auto_responses.py
from app.core.database import SessionLocal
from app.models.auto_response import AutoResponse
from app.core.constants import MOCK_BRAND_ID

AUTO_RESPONSES = [
    ("positive", "food", "Thank you for the wonderful feedback about our food! We're thrilled you enjoyed it."),
    ("positive", "service", "Thanks for the kind words about our service! Our team works hard to make every visit special."),
    ("positive", "ambiance", "We're so glad you loved the ambiance! We put a lot of thought into creating a great atmosphere."),
    ("negative", "food", "We're sorry the food didn't meet your expectations. Please reach out so we can make it right."),
    ("negative", "service", "We apologize for the service experience. This isn't up to our standards and we'll address it."),
    ("negative", "delivery", "We're sorry about the delivery issue. We're working with our delivery partners to improve."),
    ("neutral", "general", "Thank you for your feedback! We appreciate you taking the time to share your experience."),
]


def seed_auto_responses():
    db = SessionLocal()
    try:
        if db.query(AutoResponse).count() > 0:
            print("Auto-responses already seeded. Skipping.")
            return
        for sentiment, topic, template in AUTO_RESPONSES:
            db.add(AutoResponse(brand_id=MOCK_BRAND_ID, sentiment=sentiment, topic=topic, template=template))
        db.commit()
        print(f"Seeded {len(AUTO_RESPONSES)} auto-responses.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_auto_responses()
```

- [ ] **Step 6: Write and run tests**

```python
# backend/tests/test_auto_responses.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.auto_response import AutoResponse
from app.core.constants import MOCK_BRAND_ID


@pytest.fixture(autouse=True)
def _seed_responses(db_session):
    from app.seeds.auto_responses import AUTO_RESPONSES
    for sentiment, topic, template in AUTO_RESPONSES:
        db_session.add(AutoResponse(brand_id=MOCK_BRAND_ID, sentiment=sentiment, topic=topic, template=template))
    db_session.commit()


client = TestClient(app)


def test_list_auto_responses():
    resp = client.get("/api/v1/auto-responses", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 7


def test_create_auto_response():
    resp = client.post("/api/v1/auto-responses", json={"sentiment": "positive", "topic": "delivery", "template": "Thanks!"}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["topic"] == "delivery"


def test_update_auto_response():
    list_resp = client.get("/api/v1/auto-responses", headers={"Authorization": "Bearer test-token"})
    rid = list_resp.json()["responses"][0]["id"]
    resp = client.patch(f"/api/v1/auto-responses/{rid}", json={"is_active": False}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_delete_auto_response():
    list_resp = client.get("/api/v1/auto-responses", headers={"Authorization": "Bearer test-token"})
    rid = list_resp.json()["responses"][0]["id"]
    resp = client.delete(f"/api/v1/auto-responses/{rid}", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert client.get("/api/v1/auto-responses", headers={"Authorization": "Bearer test-token"}).json()["total"] == 6
```

```bash
cd backend && python -m pytest tests/test_auto_responses.py -v
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/auto_response.py backend/app/schemas/auto_response.py backend/app/api/v1/auto_responses.py backend/app/seeds/auto_responses.py backend/tests/test_auto_responses.py backend/app/models/__init__.py backend/app/api/v1/__init__.py
git commit -m "feat: add Auto-Response model, CRUD endpoint, seed, and tests"
```

---

## Task 4: Integration + Platform Models + Endpoints

**Files:**
- Create: `backend/app/models/integration.py`
- Create: `backend/app/schemas/integration.py`
- Create: `backend/app/api/v1/integrations.py`
- Create: `backend/app/seeds/integrations.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`
- Create: `backend/tests/test_integrations.py`

- [ ] **Step 1: Create Integration model**

```python
# backend/app/models/integration.py
import uuid
from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class Integration(Base, TimestampMixin):
    __tablename__ = "integrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)  # google, yelp, tripadvisor, facebook, zomato
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active, inactive, error
    last_synced: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)
```

- [ ] **Step 2: Create Pydantic schemas**

```python
# backend/app/schemas/integration.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class IntegrationCreate(BaseModel):
    platform: str
    account_name: str
    is_connected: bool = False


class IntegrationUpdate(BaseModel):
    account_name: str | None = None
    status: str | None = None
    is_connected: bool | None = None
    last_synced: str | None = None


class IntegrationResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    platform: str
    account_name: str
    status: str
    last_synced: str | None = None
    is_connected: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class IntegrationListResponse(BaseModel):
    integrations: list[IntegrationResponse]
    total: int
```

- [ ] **Step 3: Create API endpoint**

```python
# backend/app/api/v1/integrations.py
import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.integration import Integration
from app.schemas.integration import (
    IntegrationCreate, IntegrationUpdate, IntegrationResponse, IntegrationListResponse,
)

router = APIRouter()


@router.get("", response_model=IntegrationListResponse)
def list_integrations(db: DbSession, _user: CurrentUser):
    rows = db.query(Integration).filter(Integration.brand_id == MOCK_BRAND_ID).order_by(Integration.platform).all()
    return IntegrationListResponse(
        integrations=[IntegrationResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=IntegrationResponse)
def create_integration(body: IntegrationCreate, db: DbSession, _user: CurrentUser):
    integration = Integration(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return IntegrationResponse.model_validate(integration)


@router.patch("/{integration_id}", response_model=IntegrationResponse)
def update_integration(integration_id: str, body: IntegrationUpdate, db: DbSession, _user: CurrentUser):
    integration = db.query(Integration).filter(
        Integration.id == uuid.UUID(integration_id),
        Integration.brand_id == MOCK_BRAND_ID,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(integration, k, v)
    db.commit()
    db.refresh(integration)
    return IntegrationResponse.model_validate(integration)


@router.delete("/{integration_id}")
def delete_integration(integration_id: str, db: DbSession, _user: CurrentUser):
    integration = db.query(Integration).filter(
        Integration.id == uuid.UUID(integration_id),
        Integration.brand_id == MOCK_BRAND_ID,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    db.delete(integration)
    db.commit()
    return {"ok": True}
```

- [ ] **Step 4: Register router and model**

```python
# Add to backend/app/models/__init__.py
from app.models.integration import Integration
```

```python
# Add to backend/app/api/v1/__init__.py
from app.api.v1.integrations import router as integrations_router
router.include_router(integrations_router, prefix="/integrations", tags=["integrations"])
```

- [ ] **Step 5: Create seed script**

```python
# backend/app/seeds/integrations.py
from app.core.database import SessionLocal
from app.models.integration import Integration
from app.core.constants import MOCK_BRAND_ID

INTEGRATIONS = [
    ("google", "Upper Crust - Google Business", "active", True),
    ("yelp", "Upper Crust - Yelp", "active", True),
    ("tripadvisor", "Upper Crust - TripAdvisor", "inactive", False),
    ("facebook", "Upper Crust - Facebook", "active", True),
    ("zomato", "Upper Crust - Zomato", "error", True),
]


def seed_integrations():
    db = SessionLocal()
    try:
        if db.query(Integration).count() > 0:
            print("Integrations already seeded. Skipping.")
            return
        for platform, account_name, status, is_connected in INTEGRATIONS:
            db.add(Integration(brand_id=MOCK_BRAND_ID, platform=platform, account_name=account_name, status=status, is_connected=is_connected))
        db.commit()
        print(f"Seeded {len(INTEGRATIONS)} integrations.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_integrations()
```

- [ ] **Step 6: Write and run tests**

```python
# backend/tests/test_integrations.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.integration import Integration
from app.core.constants import MOCK_BRAND_ID


@pytest.fixture(autouse=True)
def _seed_integrations(db_session):
    from app.seeds.integrations import INTEGRATIONS
    for platform, account_name, status, is_connected in INTEGRATIONS:
        db_session.add(Integration(brand_id=MOCK_BRAND_ID, platform=platform, account_name=account_name, status=status, is_connected=is_connected))
    db_session.commit()


client = TestClient(app)


def test_list_integrations():
    resp = client.get("/api/v1/integrations", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 5


def test_create_integration():
    resp = client.post("/api/v1/integrations", json={"platform": "reelo", "account_name": "Upper Crust - Reelo", "is_connected": False}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["platform"] == "reelo"
    assert resp.json()["status"] == "active"


def test_update_integration():
    list_resp = client.get("/api/v1/integrations", headers={"Authorization": "Bearer test-token"})
    iid = list_resp.json()["integrations"][0]["id"]
    resp = client.patch(f"/api/v1/integrations/{iid}", json={"status": "inactive"}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"


def test_delete_integration():
    list_resp = client.get("/api/v1/integrations", headers={"Authorization": "Bearer test-token"})
    iid = list_resp.json()["integrations"][0]["id"]
    resp = client.delete(f"/api/v1/integrations/{iid}", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert client.get("/api/v1/integrations", headers={"Authorization": "Bearer test-token"}).json()["total"] == 4
```

```bash
cd backend && python -m pytest tests/test_integrations.py -v
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/integration.py backend/app/schemas/integration.py backend/app/api/v1/integrations.py backend/app/seeds/integrations.py backend/tests/test_integrations.py backend/app/models/__init__.py backend/app/api/v1/__init__.py
git commit -m "feat: add Integration model, CRUD endpoint, seed, and tests"
```

---

## Task 5: Resolve Model + Endpoint

**Files:**
- Create: `backend/app/models/resolve_policy.py`
- Create: `backend/app/schemas/resolve.py`
- Create: `backend/app/api/v1/resolve.py`
- Create: `backend/app/seeds/resolve_policies.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/api/v1/__init__.py`
- Create: `backend/tests/test_resolve.py`

- [ ] **Step 1: Create ResolvePolicy model**

```python
# backend/app/models/resolve_policy.py
import uuid
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin


class ResolvePolicy(Base, TimestampMixin):
    __tablename__ = "resolve_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    auto_resolve_after_reply: Mapped[bool] = mapped_column(Boolean, default=False)
    sla_hours: Mapped[int] = mapped_column(Integer, default=48)
    escalate_after_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

- [ ] **Step 2: Create Pydantic schemas**

```python
# backend/app/schemas/resolve.py
import uuid
from datetime import datetime
from pydantic import BaseModel


class ResolvePolicyCreate(BaseModel):
    name: str
    auto_resolve_after_reply: bool = False
    sla_hours: int = 48
    escalate_after_hours: int | None = None


class ResolvePolicyUpdate(BaseModel):
    name: str | None = None
    auto_resolve_after_reply: bool | None = None
    sla_hours: int | None = None
    escalate_after_hours: int | None = None
    is_active: bool | None = None


class ResolvePolicyResponse(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    name: str
    auto_resolve_after_reply: bool
    sla_hours: int
    escalate_after_hours: int | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolvePolicyListResponse(BaseModel):
    policies: list[ResolvePolicyResponse]
    total: int
```

- [ ] **Step 3: Create API endpoint**

```python
# backend/app/api/v1/resolve.py
import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DbSession
from app.core.constants import MOCK_BRAND_ID
from app.models.resolve_policy import ResolvePolicy
from app.schemas.resolve import (
    ResolvePolicyCreate, ResolvePolicyUpdate, ResolvePolicyResponse, ResolvePolicyListResponse,
)

router = APIRouter()


@router.get("", response_model=ResolvePolicyListResponse)
def list_policies(db: DbSession, _user: CurrentUser):
    rows = db.query(ResolvePolicy).filter(ResolvePolicy.brand_id == MOCK_BRAND_ID).order_by(ResolvePolicy.created_at.desc()).all()
    return ResolvePolicyListResponse(
        policies=[ResolvePolicyResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


@router.post("", response_model=ResolvePolicyResponse)
def create_policy(body: ResolvePolicyCreate, db: DbSession, _user: CurrentUser):
    policy = ResolvePolicy(brand_id=MOCK_BRAND_ID, **body.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return ResolvePolicyResponse.model_validate(policy)


@router.patch("/{policy_id}", response_model=ResolvePolicyResponse)
def update_policy(policy_id: str, body: ResolvePolicyUpdate, db: DbSession, _user: CurrentUser):
    policy = db.query(ResolvePolicy).filter(
        ResolvePolicy.id == uuid.UUID(policy_id),
        ResolvePolicy.brand_id == MOCK_BRAND_ID,
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(policy, k, v)
    db.commit()
    db.refresh(policy)
    return ResolvePolicyResponse.model_validate(policy)


@router.delete("/{policy_id}")
def delete_policy(policy_id: str, db: DbSession, _user: CurrentUser):
    policy = db.query(ResolvePolicy).filter(
        ResolvePolicy.id == uuid.UUID(policy_id),
        ResolvePolicy.brand_id == MOCK_BRAND_ID,
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
    return {"ok": True}
```

- [ ] **Step 4: Register router and model**

```python
# Add to backend/app/models/__init__.py
from app.models.resolve_policy import ResolvePolicy
```

```python
# Add to backend/app/api/v1/__init__.py
from app.api.v1.resolve import router as resolve_router
router.include_router(resolve_router, prefix="/resolve", tags=["resolve"])
```

- [ ] **Step 5: Create seed script**

```python
# backend/app/seeds/resolve_policies.py
from app.core.database import SessionLocal
from app.models.resolve_policy import ResolvePolicy
from app.core.constants import MOCK_BRAND_ID

POLICIES = [
    ("Standard", True, 48, 72),
    ("VIP Customers", False, 24, 48),
    ("Urgent Complaints", False, 12, 24),
]


def seed_resolve_policies():
    db = SessionLocal()
    try:
        if db.query(ResolvePolicy).count() > 0:
            print("Resolve policies already seeded. Skipping.")
            return
        for name, auto_resolve, sla, escalate in POLICIES:
            db.add(ResolvePolicy(brand_id=MOCK_BRAND_ID, name=name, auto_resolve_after_reply=auto_resolve, sla_hours=sla, escalate_after_hours=escalate))
        db.commit()
        print(f"Seeded {len(POLICIES)} resolve policies.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_resolve_policies()
```

- [ ] **Step 6: Write and run tests**

```python
# backend/tests/test_resolve.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.resolve_policy import ResolvePolicy
from app.core.constants import MOCK_BRAND_ID


@pytest.fixture(autouse=True)
def _seed_policies(db_session):
    from app.seeds.resolve_policies import POLICIES
    for name, auto_resolve, sla, escalate in POLICIES:
        db_session.add(ResolvePolicy(brand_id=MOCK_BRAND_ID, name=name, auto_resolve_after_reply=auto_resolve, sla_hours=sla, escalate_after_hours=escalate))
    db_session.commit()


client = TestClient(app)


def test_list_policies():
    resp = client.get("/api/v1/resolve", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 3


def test_create_policy():
    resp = client.post("/api/v1/resolve", json={"name": "Test Policy", "sla_hours": 24}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Policy"
    assert resp.json()["sla_hours"] == 24


def test_update_policy():
    list_resp = client.get("/api/v1/resolve", headers={"Authorization": "Bearer test-token"})
    pid = list_resp.json()["policies"][0]["id"]
    resp = client.patch(f"/api/v1/resolve/{pid}", json={"is_active": False}, headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_delete_policy():
    list_resp = client.get("/api/v1/resolve", headers={"Authorization": "Bearer test-token"})
    pid = list_resp.json()["policies"][0]["id"]
    resp = client.delete(f"/api/v1/resolve/{pid}", headers={"Authorization": "Bearer test-token"})
    assert resp.status_code == 200
    assert client.get("/api/v1/resolve", headers={"Authorization": "Bearer test-token"}).json()["total"] == 2
```

```bash
cd backend && python -m pytest tests/test_resolve.py -v
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/resolve_policy.py backend/app/schemas/resolve.py backend/app/api/v1/resolve.py backend/app/seeds/resolve_policies.py backend/tests/test_resolve.py backend/app/models/__init__.py backend/app/api/v1/__init__.py
git commit -m "feat: add Resolve Policy model, CRUD endpoint, seed, and tests"
```

---

## Task 6: Frontend Types + Stores (All 6 Features)

**Files:**
- Create: `frontend/src/types/audit-log.ts`
- Create: `frontend/src/types/automation.ts`
- Create: `frontend/src/types/auto-response.ts`
- Create: `frontend/src/types/integration.ts`
- Create: `frontend/src/types/resolve.ts`
- Create: `frontend/src/stores/audit-log-store.ts`
- Create: `frontend/src/stores/automation-store.ts`
- Create: `frontend/src/stores/auto-response-store.ts`
- Create: `frontend/src/stores/integration-store.ts`
- Create: `frontend/src/stores/resolve-store.ts`

- [ ] **Step 1: Create all 5 type files**

```ts
// frontend/src/types/audit-log.ts
export interface AuditLog {
  id: string
  brand_id: string
  user_id: string
  user_name: string
  action: string
  entity_type: string
  entity_id: string | null
  details: string | null
  created_at: string
}

export interface AuditLogListResponse {
  logs: AuditLog[]
  total: number
}
```

```ts
// frontend/src/types/automation.ts
export interface AutomationRule {
  id: string
  brand_id: string
  name: string
  trigger: string
  action: string
  template: string | null
  is_active: boolean
  execution_count: number
  created_at: string
}

export interface AutomationRuleListResponse {
  rules: AutomationRule[]
  total: number
}
```

```ts
// frontend/src/types/auto-response.ts
export interface AutoResponse {
  id: string
  brand_id: string
  sentiment: string
  topic: string
  template: string
  is_active: boolean
  created_at: string
}

export interface AutoResponseListResponse {
  responses: AutoResponse[]
  total: number
}
```

```ts
// frontend/src/types/integration.ts
export interface Integration {
  id: string
  brand_id: string
  platform: string
  account_name: string
  status: string
  last_synced: string | null
  is_connected: boolean
  created_at: string
}

export interface IntegrationListResponse {
  integrations: Integration[]
  total: number
}
```

```ts
// frontend/src/types/resolve.ts
export interface ResolvePolicy {
  id: string
  brand_id: string
  name: string
  auto_resolve_after_reply: boolean
  sla_hours: number
  escalate_after_hours: number | null
  is_active: boolean
  created_at: string
}

export interface ResolvePolicyListResponse {
  policies: ResolvePolicy[]
  total: number
}
```

- [ ] **Step 2: Create all 5 store files**

```ts
// frontend/src/stores/audit-log-store.ts
import { create } from "zustand"
import type { AuditLog } from "@/types/audit-log"
import apiClient from "@/lib/api-client"

interface AuditLogState {
  logs: AuditLog[]
  total: number
  isLoading: boolean
  actionFilter: string | null
  entityFilter: string | null
  setActionFilter: (f: string | null) => void
  setEntityFilter: (f: string | null) => void
  fetchLogs: () => Promise<void>
}

export const useAuditLogStore = create<AuditLogState>((set, get) => ({
  logs: [], total: 0, isLoading: false, actionFilter: null, entityFilter: null,
  setActionFilter: (f) => { set({ actionFilter: f }); get().fetchLogs() },
  setEntityFilter: (f) => { set({ entityFilter: f }); get().fetchLogs() },
  fetchLogs: async () => {
    set({ isLoading: true })
    const { actionFilter, entityFilter } = get()
    const params = new URLSearchParams()
    if (actionFilter) params.set("action", actionFilter)
    if (entityFilter) params.set("entity_type", entityFilter)
    const qs = params.toString()
    const { data } = await apiClient.get(`/audit-logs${qs ? `?${qs}` : ""}`)
    set({ logs: data.logs, total: data.total, isLoading: false })
  },
}))
```

```ts
// frontend/src/stores/automation-store.ts
import { create } from "zustand"
import type { AutomationRule } from "@/types/automation"
import apiClient from "@/lib/api-client"

interface AutomationState {
  rules: AutomationRule[]
  total: number
  isLoading: boolean
  fetchRules: () => Promise<void>
  createRule: (data: { name: string; trigger: string; action: string; template?: string }) => Promise<void>
  toggleRule: (id: string, isActive: boolean) => Promise<void>
  deleteRule: (id: string) => Promise<void>
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
  rules: [], total: 0, isLoading: false,
  fetchRules: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/automation")
    set({ rules: data.rules, total: data.total, isLoading: false })
  },
  createRule: async (body) => {
    await apiClient.post("/automation", body)
    get().fetchRules()
  },
  toggleRule: async (id, isActive) => {
    await apiClient.patch(`/automation/${id}`, { is_active: isActive })
    get().fetchRules()
  },
  deleteRule: async (id) => {
    await apiClient.delete(`/automation/${id}`)
    get().fetchRules()
  },
}))
```

```ts
// frontend/src/stores/auto-response-store.ts
import { create } from "zustand"
import type { AutoResponse } from "@/types/auto-response"
import apiClient from "@/lib/api-client"

interface AutoResponseState {
  responses: AutoResponse[]
  total: number
  isLoading: boolean
  fetchResponses: () => Promise<void>
  createResponse: (data: { sentiment: string; topic: string; template: string }) => Promise<void>
  updateResponse: (id: string, data: { template?: string; is_active?: boolean }) => Promise<void>
  deleteResponse: (id: string) => Promise<void>
}

export const useAutoResponseStore = create<AutoResponseState>((set, get) => ({
  responses: [], total: 0, isLoading: false,
  fetchResponses: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/auto-responses")
    set({ responses: data.responses, total: data.total, isLoading: false })
  },
  createResponse: async (body) => {
    await apiClient.post("/auto-responses", body)
    get().fetchResponses()
  },
  updateResponse: async (id, body) => {
    await apiClient.patch(`/auto-responses/${id}`, body)
    get().fetchResponses()
  },
  deleteResponse: async (id) => {
    await apiClient.delete(`/auto-responses/${id}`)
    get().fetchResponses()
  },
}))
```

```ts
// frontend/src/stores/integration-store.ts
import { create } from "zustand"
import type { Integration } from "@/types/integration"
import apiClient from "@/lib/api-client"

interface IntegrationState {
  integrations: Integration[]
  total: number
  isLoading: boolean
  fetchIntegrations: () => Promise<void>
  createIntegration: (data: { platform: string; account_name: string }) => Promise<void>
  toggleConnection: (id: string, isConnected: boolean) => Promise<void>
  deleteIntegration: (id: string) => Promise<void>
}

export const useIntegrationStore = create<IntegrationState>((set, get) => ({
  integrations: [], total: 0, isLoading: false,
  fetchIntegrations: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/integrations")
    set({ integrations: data.integrations, total: data.total, isLoading: false })
  },
  createIntegration: async (body) => {
    await apiClient.post("/integrations", body)
    get().fetchIntegrations()
  },
  toggleConnection: async (id, isConnected) => {
    await apiClient.patch(`/integrations/${id}`, { is_connected: isConnected, status: isConnected ? "active" : "inactive" })
    get().fetchIntegrations()
  },
  deleteIntegration: async (id) => {
    await apiClient.delete(`/integrations/${id}`)
    get().fetchIntegrations()
  },
}))
```

```ts
// frontend/src/stores/resolve-store.ts
import { create } from "zustand"
import type { ResolvePolicy } from "@/types/resolve"
import apiClient from "@/lib/api-client"

interface ResolveState {
  policies: ResolvePolicy[]
  total: number
  isLoading: boolean
  fetchPolicies: () => Promise<void>
  createPolicy: (data: { name: string; auto_resolve_after_reply?: boolean; sla_hours?: number; escalate_after_hours?: number }) => Promise<void>
  togglePolicy: (id: string, isActive: boolean) => Promise<void>
  deletePolicy: (id: string) => Promise<void>
}

export const useResolveStore = create<ResolveState>((set, get) => ({
  policies: [], total: 0, isLoading: false,
  fetchPolicies: async () => {
    set({ isLoading: true })
    const { data } = await apiClient.get("/resolve")
    set({ policies: data.policies, total: data.total, isLoading: false })
  },
  createPolicy: async (body) => {
    await apiClient.post("/resolve", body)
    get().fetchPolicies()
  },
  togglePolicy: async (id, isActive) => {
    await apiClient.patch(`/resolve/${id}`, { is_active: isActive })
    get().fetchPolicies()
  },
  deletePolicy: async (id) => {
    await apiClient.delete(`/resolve/${id}`)
    get().fetchPolicies()
  },
}))
```

- [ ] **Step 3: Verify frontend builds**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/ frontend/src/stores/
git commit -m "feat: add frontend types and stores for all 6 remaining features"
```

---

## Task 7: Audit Logs Page

**Files:**
- Create: `frontend/src/components/audit-logs/audit-log-card.tsx`
- Create: `frontend/src/components/audit-logs/audit-log-list.tsx`
- Modify: `frontend/src/app/routes/audit-logs.tsx`

- [ ] **Step 1: Create AuditLogCard component**

```tsx
// frontend/src/components/audit-logs/audit-log-card.tsx
import { Shield, Star, MapPin, Users, Settings, Link, Zap } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import type { AuditLog } from "@/types/audit-log"

interface Props {
  log: AuditLog
}

const actionIcons: Record<string, typeof Shield> = {
  reply_sent: Star,
  review_resolved: Shield,
  location_added: MapPin,
  competitor_tracked: Users,
  settings_updated: Settings,
  integration_connected: Link,
  auto_reply_triggered: Zap,
}

const actionColors: Record<string, string> = {
  reply_sent: "bg-success/20 text-success",
  review_resolved: "bg-info/20 text-info",
  location_added: "bg-lavender/20 text-lavender",
  competitor_tracked: "bg-terracotta/20 text-terracotta",
  settings_updated: "bg-warning/20 text-warning",
  integration_connected: "bg-success/20 text-success",
  auto_reply_triggered: "bg-info/20 text-info",
}

export default function AuditLogCard({ log }: Props) {
  const Icon = actionIcons[log.action] || Shield
  const colorClass = actionColors[log.action] || "bg-card-secondary text-text-secondary"

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text">{log.details || log.action}</h4>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
            <span className="font-medium text-text">{log.user_name}</span>
            <span>·</span>
            <span className="capitalize">{log.entity_type}</span>
            <span>·</span>
            <span>{timeAgo(log.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create AuditLogList component**

```tsx
// frontend/src/components/audit-logs/audit-log-list.tsx
import AuditLogCard from "./audit-log-card"
import type { AuditLog } from "@/types/audit-log"

interface Props {
  logs: AuditLog[]
}

export default function AuditLogList({ logs }: Props) {
  return (
    <div className="grid gap-3">
      {logs.map((log) => (
        <AuditLogCard key={log.id} log={log} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Build AuditLogs page**

```tsx
// frontend/src/app/routes/audit-logs.tsx
import { useEffect } from "react"
import { useAuditLogStore } from "@/stores/audit-log-store"
import AuditLogList from "@/components/audit-logs/audit-log-list"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"

const ACTIONS = ["", "reply_sent", "review_resolved", "location_added", "competitor_tracked", "settings_updated", "integration_connected", "auto_reply_triggered"]
const ENTITIES = ["", "reply", "review", "location", "competitor", "settings", "integration", "automation"]

export default function AuditLogsPage() {
  const { logs, total, isLoading, actionFilter, entityFilter, setActionFilter, setEntityFilter, fetchLogs } = useAuditLogStore()

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">Track all activity across your account</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actionFilter || ""}
          onChange={(e) => setActionFilter(e.target.value || null)}
          className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text"
        >
          <option value="">All actions</option>
          {ACTIONS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          value={entityFilter || ""}
          onChange={(e) => setEntityFilter(e.target.value || null)}
          className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text"
        >
          <option value="">All entities</option>
          {ENTITIES.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <Badge variant="secondary">{total} entries</Badge>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs" description="Activity will appear here as actions are taken." />
      ) : (
        <AuditLogList logs={logs} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/audit-logs/ frontend/src/app/routes/audit-logs.tsx
git commit -m "feat: implement Audit Logs page with action/entity filters"
```

---

## Task 8: Automation Page

**Files:**
- Create: `frontend/src/components/automation/automation-card.tsx`
- Create: `frontend/src/components/automation/automation-form.tsx`
- Modify: `frontend/src/app/routes/automation.tsx`

- [ ] **Step 1: Create AutomationCard component**

```tsx
// frontend/src/components/automation/automation-card.tsx
import { Zap, Trash2, Power } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AutomationRule } from "@/types/automation"

interface Props {
  rule: AutomationRule
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

export default function AutomationCard({ rule, onToggle, onDelete }: Props) {
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${
      rule.is_active ? "border-border bg-surface" : "border-border bg-surface/50 opacity-60"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            rule.is_active ? "bg-info/20 text-info" : "bg-card-secondary text-text-secondary"
          }`}>
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{rule.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{rule.trigger.replace(/_/g, " ")}</Badge>
              <span className="text-xs text-text-muted">→</span>
              <Badge variant="secondary" className="capitalize">{rule.action.replace(/_/g, " ")}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(rule.id, !rule.is_active)}>
            <Power className={`h-4 w-4 ${rule.is_active ? "text-success" : "text-text-muted"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(rule.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {rule.template && (
        <p className="mt-3 rounded-lg bg-card-secondary/50 p-3 text-xs text-text-secondary">{rule.template}</p>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
        <span>Executed {rule.execution_count} times</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create AutomationForm component**

```tsx
// frontend/src/components/automation/automation-form.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { name: string; trigger: string; action: string; template?: string }) => void
}

const TRIGGERS = [
  { value: "sentiment_positive", label: "Positive Review" },
  { value: "sentiment_negative", label: "Negative Review" },
  { value: "topic_food", label: "Food Topic" },
  { value: "topic_service", label: "Service Topic" },
  { value: "topic_delivery", label: "Delivery Topic" },
  { value: "topic_urgent", label: "Urgent Topic" },
]

const ACTIONS = [
  { value: "auto_reply", label: "Auto Reply" },
  { value: "flag_urgent", label: "Flag as Urgent" },
  { value: "assign_team", label: "Assign to Team" },
]

export default function AutomationForm({ onSubmit }: Props) {
  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState("sentiment_positive")
  const [action, setAction] = useState("auto_reply")
  const [template, setTemplate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), trigger, action, template: template || undefined })
    setName("")
    setTemplate("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Create Automation Rule</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input placeholder="Rule name" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>
      <Input placeholder="Reply template (optional)" value={template} onChange={(e) => setTemplate(e.target.value)} />
      <Button type="submit" size="sm" disabled={!name.trim()}>Create Rule</Button>
    </form>
  )
}
```

- [ ] **Step 3: Build Automation page**

```tsx
// frontend/src/app/routes/automation.tsx
import { useEffect } from "react"
import { useAutomationStore } from "@/stores/automation-store"
import AutomationCard from "@/components/automation/automation-card"
import AutomationForm from "@/components/automation/automation-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function AutomationPage() {
  const { rules, isLoading, fetchRules, createRule, toggleRule, deleteRule } = useAutomationStore()

  useEffect(() => { fetchRules() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Automation</h1>
        <p className="mt-1 text-sm text-text-secondary">Set up rules to automate your review management</p>
      </div>

      <AutomationForm onSubmit={createRule} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : rules.length === 0 ? (
        <EmptyState title="No automation rules" description="Create your first rule above to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rules.map((rule) => (
            <AutomationCard key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/automation/ frontend/src/app/routes/automation.tsx
git commit -m "feat: implement Automation page with rule cards, form, and toggle"
```

---

## Task 9: Auto-Response Page

**Files:**
- Create: `frontend/src/components/auto-response/auto-response-card.tsx`
- Create: `frontend/src/components/auto-response/auto-response-form.tsx`
- Modify: `frontend/src/app/routes/account/auto-response.tsx`

- [ ] **Step 1: Create AutoResponseCard component**

```tsx
// frontend/src/components/auto-response/auto-response-card.tsx
import { Trash2, Power } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AutoResponse } from "@/types/auto-response"

interface Props {
  response: AutoResponse
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

const sentimentColors: Record<string, string> = {
  positive: "bg-success/20 text-success",
  negative: "bg-danger/20 text-danger",
  neutral: "bg-lavender/20 text-lavender",
}

export default function AutoResponseCard({ response, onToggle, onDelete }: Props) {
  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      response.is_active ? "border-border bg-surface" : "border-border bg-surface/50 opacity-60"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${sentimentColors[response.sentiment] || "bg-card-secondary"}`}>
            <span className="text-xs font-bold uppercase">{response.sentiment.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{response.sentiment}</Badge>
              <Badge variant="secondary" className="capitalize">{response.topic}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(response.id, !response.is_active)}>
            <Power className={`h-4 w-4 ${response.is_active ? "text-success" : "text-text-muted"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(response.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-card-secondary/50 p-3 text-xs text-text-secondary">{response.template}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create AutoResponseForm component**

```tsx
// frontend/src/components/auto-response/auto-response-form.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { sentiment: string; topic: string; template: string }) => void
}

const SENTIMENTS = ["positive", "negative", "neutral"]
const TOPICS = ["food", "service", "delivery", "ambiance", "general"]

export default function AutoResponseForm({ onSubmit }: Props) {
  const [sentiment, setSentiment] = useState("positive")
  const [topic, setTopic] = useState("food")
  const [template, setTemplate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!template.trim()) return
    onSubmit({ sentiment, topic, template: template.trim() })
    setTemplate("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Add Auto-Response Template</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {SENTIMENTS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text">
          {TOPICS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <Input placeholder="Response template" value={template} onChange={(e) => setTemplate(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={!template.trim()}>Add Template</Button>
    </form>
  )
}
```

- [ ] **Step 3: Build Auto-Response page**

```tsx
// frontend/src/app/routes/account/auto-response.tsx
import { useEffect } from "react"
import { useAutoResponseStore } from "@/stores/auto-response-store"
import AutoResponseCard from "@/components/auto-response/auto-response-card"
import AutoResponseForm from "@/components/auto-response/auto-response-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function AutoResponsePage() {
  const { responses, isLoading, fetchResponses, createResponse, updateResponse, deleteResponse } = useAutoResponseStore()

  useEffect(() => { fetchResponses() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Auto-Response Templates</h1>
        <p className="mt-1 text-sm text-text-secondary">Configure automated responses by sentiment and topic</p>
      </div>

      <AutoResponseForm onSubmit={createResponse} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : responses.length === 0 ? (
        <EmptyState title="No auto-response templates" description="Add your first template above." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {responses.map((r) => (
            <AutoResponseCard
              key={r.id}
              response={r}
              onToggle={(id, isActive) => updateResponse(id, { is_active: isActive })}
              onDelete={deleteResponse}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/auto-response/ frontend/src/app/routes/account/auto-response.tsx
git commit -m "feat: implement Auto-Response page with sentiment/topic templates"
```

---

## Task 10: Integrations Page

**Files:**
- Create: `frontend/src/components/integrations/integration-card.tsx`
- Create: `frontend/src/components/integrations/integration-form.tsx`
- Modify: `frontend/src/app/routes/integrations.tsx`

- [ ] **Step 1: Create IntegrationCard component**

```tsx
// frontend/src/components/integrations/integration-card.tsx
import { Trash2, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Integration } from "@/types/integration"

interface Props {
  integration: Integration
  onToggle: (id: string, isConnected: boolean) => void
  onDelete: (id: string) => void
}

const platformColors: Record<string, string> = {
  google: "bg-info/20 text-info",
  yelp: "bg-danger/20 text-danger",
  tripadvisor: "bg-success/20 text-success",
  facebook: "bg-info/20 text-info",
  zomato: "bg-terracotta/20 text-terracotta",
  reelo: "bg-lavender/20 text-lavender",
}

const platformLogos: Record<string, string> = {
  google: "G", yelp: "Y", tripadvisor: "T", facebook: "F", zomato: "Z", reelo: "R",
}

export default function IntegrationCard({ integration, onToggle, onDelete }: Props) {
  const colorClass = platformColors[integration.platform] || "bg-card-secondary text-text-secondary"

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${colorClass}`}>
            {platformLogos[integration.platform] || integration.platform.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">{integration.account_name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{integration.platform}</Badge>
              <Badge variant={integration.status === "active" ? "default" : integration.status === "error" ? "destructive" : "secondary"}>
                {integration.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(integration.id, !integration.is_connected)}>
            {integration.is_connected ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-text-muted" />
            )}
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(integration.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {integration.last_synced && (
        <p className="mt-3 text-xs text-text-muted">Last synced: {integration.last_synced}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create IntegrationForm component**

```tsx
// frontend/src/components/integrations/integration-form.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { platform: string; account_name: string }) => void
}

const PLATFORMS = ["google", "yelp", "tripadvisor", "facebook", "zomato", "reelo"]

export default function IntegrationForm({ onSubmit }: Props) {
  const [platform, setPlatform] = useState("google")
  const [accountName, setAccountName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return
    onSubmit({ platform, account_name: accountName.trim() })
    setAccountName("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Connect New Platform</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-lg border border-border bg-card-secondary px-3 py-2 text-sm text-text capitalize">
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <Input placeholder="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="sm:col-span-2" />
      </div>
      <Button type="submit" size="sm" disabled={!accountName.trim()}>Connect Platform</Button>
    </form>
  )
}
```

- [ ] **Step 3: Build Integrations page**

```tsx
// frontend/src/app/routes/integrations.tsx
import { useEffect } from "react"
import { useIntegrationStore } from "@/stores/integration-store"
import IntegrationCard from "@/components/integrations/integration-card"
import IntegrationForm from "@/components/integrations/integration-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function IntegrationsPage() {
  const { integrations, isLoading, fetchIntegrations, createIntegration, toggleConnection, deleteIntegration } = useIntegrationStore()

  useEffect(() => { fetchIntegrations() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="mt-1 text-sm text-text-secondary">Connect your review platforms</p>
      </div>

      <IntegrationForm onSubmit={createIntegration} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : integrations.length === 0 ? (
        <EmptyState title="No integrations" description="Connect your first platform above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <IntegrationCard key={i.id} integration={i} onToggle={toggleConnection} onDelete={deleteIntegration} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/integrations/ frontend/src/app/routes/integrations.tsx
git commit -m "feat: implement Integrations page with platform cards and connect form"
```

---

## Task 11: Platform Integration Page

**Files:**
- Create: `frontend/src/components/platform-integration/platform-card.tsx`
- Modify: `frontend/src/app/routes/account/platform-integration.tsx`

- [ ] **Step 1: Create PlatformCard component**

```tsx
// frontend/src/components/platform-integration/platform-card.tsx
import { CheckCircle, AlertTriangle, Clock, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Integration } from "@/types/integration"

interface Props {
  integration: Integration
  onSync: (id: string) => void
}

const statusIcons: Record<string, typeof CheckCircle> = {
  active: CheckCircle, inactive: Clock, error: AlertTriangle,
}

const statusColors: Record<string, string> = {
  active: "text-success", inactive: "text-text-muted", error: "text-danger",
}

export default function PlatformCard({ integration, onSync }: Props) {
  const Icon = statusIcons[integration.status] || Clock
  const colorClass = statusColors[integration.status] || "text-text-secondary"

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <div>
            <h3 className="text-sm font-semibold text-text capitalize">{integration.platform}</h3>
            <p className="text-xs text-text-secondary">{integration.account_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={integration.is_connected ? "default" : "secondary"}>
            {integration.is_connected ? "Connected" : "Disconnected"}
          </Badge>
          {integration.is_connected && (
            <Button variant="ghost" size="sm" onClick={() => onSync(integration.id)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {integration.last_synced && (
        <p className="mt-3 text-xs text-text-muted">Last synced: {integration.last_synced}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build Platform Integration page**

```tsx
// frontend/src/app/routes/account/platform-integration.tsx
import { useEffect } from "react"
import { useIntegrationStore } from "@/stores/integration-store"
import PlatformCard from "@/components/platform-integration/platform-card"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function PlatformIntegrationPage() {
  const { integrations, isLoading, fetchIntegrations } = useIntegrationStore()

  useEffect(() => { fetchIntegrations() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Integration</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your connected review platform accounts</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : integrations.length === 0 ? (
        <EmptyState title="No platforms connected" description="Connect platforms from the Integrations page." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.filter((i) => i.is_connected).map((i) => (
            <PlatformCard key={i.id} integration={i} onSync={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/platform-integration/ frontend/src/app/routes/account/platform-integration.tsx
git commit -m "feat: implement Platform Integration page showing connected accounts"
```

---

## Task 12: Resolve Page

**Files:**
- Create: `frontend/src/components/resolve/resolve-card.tsx`
- Create: `frontend/src/components/resolve/resolve-form.tsx`
- Modify: `frontend/src/app/routes/account/resolve.tsx`

- [ ] **Step 1: Create ResolveCard component**

```tsx
// frontend/src/components/resolve/resolve-card.tsx
import { Trash2, Power, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ResolvePolicy } from "@/types/resolve"

interface Props {
  policy: ResolvePolicy
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}

export default function ResolveCard({ policy, onToggle, onDelete }: Props) {
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${
      policy.is_active ? "border-border bg-surface" : "border-border bg-surface/50 opacity-60"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">{policy.name}</h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>SLA: {policy.sla_hours}h</span>
            </div>
            {policy.escalate_after_hours && (
              <span>Escalate: {policy.escalate_after_hours}h</span>
            )}
            {policy.auto_resolve_after_reply && (
              <Badge variant="secondary">Auto-resolve</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onToggle(policy.id, !policy.is_active)}>
            <Power className={`h-4 w-4 ${policy.is_active ? "text-success" : "text-text-muted"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => onDelete(policy.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ResolveForm component**

```tsx
// frontend/src/components/resolve/resolve-form.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  onSubmit: (data: { name: string; auto_resolve_after_reply?: boolean; sla_hours?: number; escalate_after_hours?: number }) => void
}

export default function ResolveForm({ onSubmit }: Props) {
  const [name, setName] = useState("")
  const [sla, setSla] = useState("48")
  const [escalate, setEscalate] = useState("")
  const [autoResolve, setAutoResolve] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      sla_hours: parseInt(sla) || 48,
      escalate_after_hours: escalate ? parseInt(escalate) : undefined,
      auto_resolve_after_reply: autoResolve,
    })
    setName("")
    setEscalate("")
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text">Add Resolve Policy</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input placeholder="Policy name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" min="1" placeholder="SLA (hours)" value={sla} onChange={(e) => setSla(e.target.value)} />
        <Input type="number" min="1" placeholder="Escalate after (hours)" value={escalate} onChange={(e) => setEscalate(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={autoResolve} onChange={(e) => setAutoResolve(e.target.checked)} className="rounded" />
          Auto-resolve
        </label>
      </div>
      <Button type="submit" size="sm" disabled={!name.trim()}>Add Policy</Button>
    </form>
  )
}
```

- [ ] **Step 3: Build Resolve page**

```tsx
// frontend/src/app/routes/account/resolve.tsx
import { useEffect } from "react"
import { useResolveStore } from "@/stores/resolve-store"
import ResolveCard from "@/components/resolve/resolve-card"
import ResolveForm from "@/components/resolve/resolve-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import EmptyState from "@/components/shared/empty-state"

export default function ResolvePage() {
  const { policies, isLoading, fetchPolicies, createPolicy, togglePolicy, deletePolicy } = useResolveStore()

  useEffect(() => { fetchPolicies() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resolve Policies</h1>
        <p className="mt-1 text-sm text-text-secondary">Configure how and when reviews are resolved</p>
      </div>

      <ResolveForm onSubmit={createPolicy} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>
      ) : policies.length === 0 ? (
        <EmptyState title="No resolve policies" description="Add your first policy above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {policies.map((p) => (
            <ResolveCard key={p.id} policy={p} onToggle={togglePolicy} onDelete={deletePolicy} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/resolve/ frontend/src/app/routes/account/resolve.tsx
git commit -m "feat: implement Resolve page with policy cards and SLA form"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && python -m pytest tests/ -v
```

- [ ] **Step 2: Run frontend build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Verify all imports**

```bash
cd backend && python -c "from app.api.v1.audit_logs import router; from app.api.v1.automation import router; from app.api.v1.auto_responses import router; from app.api.v1.integrations import router; from app.api.v1.resolve import router; from app.models.audit_log import AuditLog; from app.models.automation_rule import AutomationRule; from app.models.auto_response import AutoResponse; from app.models.integration import Integration; from app.models.resolve_policy import ResolvePolicy; print('All imports OK')"
```

- [ ] **Step 4: Check git log**

```bash
git log --oneline -15
```

- [ ] **Step 5: Mark plan as done**

Update the plan file to mark all tasks as complete.
