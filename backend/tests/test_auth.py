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
