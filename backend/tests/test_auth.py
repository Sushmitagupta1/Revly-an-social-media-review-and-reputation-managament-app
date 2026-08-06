def test_register_success(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "new@test.com",
        "password": "password123",
        "full_name": "New User",
        "username": "newuser",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "new@test.com"
    assert data["user"]["username"] == "newuser"
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


def test_register_duplicate_username(client):
    client.post("/api/v1/auth/register", json={
        "email": "u1@test.com",
        "password": "password123",
        "full_name": "First User",
        "username": "same",
    })
    response = client.post("/api/v1/auth/register", json={
        "email": "u2@test.com",
        "password": "password456",
        "full_name": "Second User",
        "username": "same",
    })
    assert response.status_code == 409


def test_login_success(client):
    client.post("/api/v1/auth/register", json={
        "email": "login@test.com",
        "password": "password123",
        "full_name": "Login User",
        "username": "loginuser",
    })
    response = client.post("/api/v1/auth/login", json={
        "username": "loginuser",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_success_with_email(client):
    client.post("/api/v1/auth/register", json={
        "email": "login2@test.com",
        "password": "password123",
        "full_name": "Login Two",
    })
    response = client.post("/api/v1/auth/login", json={
        "username": "login2@test.com",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "wrong@test.com",
        "password": "password123",
        "full_name": "Wrong User",
        "username": "wronguser",
    })
    response = client.post("/api/v1/auth/login", json={
        "username": "wronguser",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/api/v1/auth/login", json={
        "username": "nonexistent",
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


def test_setup_team(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "owner@test.com",
        "password": "password123",
        "full_name": "Owner",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/v1/auth/setup-team", headers=headers, json={
        "users": [
            {"username": "Vinod Kalal", "password": "Makachiki@1991", "full_name": "Vinod Kalal"},
        ]
    })
    assert response.status_code == 200
    assert response.json()["users"][0]["action"] == "created"

    login = client.post("/api/v1/auth/login", json={
        "username": "Vinod Kalal",
        "password": "Makachiki@1991",
    })
    assert login.status_code == 200
    assert login.json()["user"]["username"] == "Vinod Kalal"

    again = client.post("/api/v1/auth/setup-team", headers=headers, json={
        "users": [
            {"username": "Vinod Kalal", "password": "newpass456", "full_name": "Vinod Kalal"},
        ]
    })
    assert again.status_code == 200
    assert again.json()["users"][0]["action"] == "updated"

    login_new = client.post("/api/v1/auth/login", json={
        "username": "Vinod Kalal",
        "password": "newpass456",
    })
    assert login_new.status_code == 200
