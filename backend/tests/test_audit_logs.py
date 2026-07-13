import uuid
import pytest
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.constants import MOCK_BRAND_ID
from app.core.security import hash_password


@pytest.fixture()
def auth_headers(db_session):
    db_session.query(User).delete()
    db_session.commit()
    uid = uuid.uuid4()
    user = User(id=uid, email="audit@test.com", full_name="Audit User",
                password_hash=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.commit()
    from app.core.security import create_access_token
    t = create_access_token({"sub": str(uid), "type": "access"})
    return {"Authorization": f"Bearer {t}"}


@pytest.fixture(autouse=True)
def _seed_audit_logs(db_session):
    from app.seeds.audit_logs import ACTIONS, SEED_USER_ID
    for action, entity_type, entity_id, details in ACTIONS:
        db_session.add(AuditLog(
            brand_id=MOCK_BRAND_ID,
            user_id=SEED_USER_ID,
            user_name="System",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        ))
    db_session.commit()


def test_list_audit_logs(client, auth_headers):
    resp = client.get("/api/v1/audit-logs", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 7
    assert len(data["logs"]) == 7


def test_list_audit_logs_filter_action(client, auth_headers):
    resp = client.get("/api/v1/audit-logs?action=reply_sent", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


def test_list_audit_logs_filter_entity(client, auth_headers):
    resp = client.get("/api/v1/audit-logs?entity_type=review", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
