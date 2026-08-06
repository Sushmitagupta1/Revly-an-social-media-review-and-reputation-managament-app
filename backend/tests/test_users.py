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
