def test_register_success(client):
    r = client.post("/api/auth/register", json={
        "username": "user1", "password": "secret", "name": "Alice",
        "role": "tech_support", "notification_platform": "wechat", "notification_handle": ""
    })
    assert r.status_code == 201
    assert r.json()["username"] == "user1"
    assert "password" not in r.json()

def test_register_duplicate_username(client):
    payload = {"username": "u1", "password": "pw", "name": "U", "role": "pm",
               "notification_platform": "wechat", "notification_handle": ""}
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 409

def test_login_success(client, ts_user):
    r = client.post("/api/auth/login", data={"username": "ts1", "password": "pass123"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_wrong_password(client, ts_user):
    r = client.post("/api/auth/login", data={"username": "ts1", "password": "wrong"})
    assert r.status_code == 401
