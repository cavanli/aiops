from tests.conftest import get_token

def auth(client, username="ts1"):
    return {"Authorization": f"Bearer {get_token(client, username)}"}

def test_create_request(client, ts_user):
    r = client.post("/api/requests", json={
        "project_name": "Alpha", "product_version": "v1.0",
        "env_type": "test", "env_description": "Standard test env"
    }, headers=auth(client))
    assert r.status_code == 201
    assert r.json()["req_no"].startswith("REQ-")
    assert r.json()["status"] == "pending"

def test_list_requests_tech_support_sees_own_only(client, ts_user, pm_user):
    client.post("/api/requests", json={
        "project_name": "A", "product_version": "v1", "env_type": "dev", "env_description": "x"
    }, headers=auth(client, "ts1"))
    r = client.get("/api/requests", headers=auth(client, "pm1"))
    assert len(r.json()["items"]) == 1  # pm sees all
    r2 = client.get("/api/requests", headers=auth(client, "ts1"))
    assert len(r2.json()["items"]) == 1  # ts1 sees own

def test_update_pending_request(client, ts_user):
    r = client.post("/api/requests", json={
        "project_name": "B", "product_version": "v1", "env_type": "dev", "env_description": "old"
    }, headers=auth(client))
    req_id = r.json()["id"]
    r2 = client.put(f"/api/requests/{req_id}", json={"env_description": "new"}, headers=auth(client))
    assert r2.status_code == 200
    assert r2.json()["env_description"] == "new"

def test_cancel_pending_request(client, ts_user):
    r = client.post("/api/requests", json={
        "project_name": "C", "product_version": "v1", "env_type": "dev", "env_description": "x"
    }, headers=auth(client))
    req_id = r.json()["id"]
    r2 = client.post(f"/api/requests/{req_id}/cancel", headers=auth(client))
    assert r2.status_code == 200
    assert r2.json()["status"] == "cancelled"

def test_pm_cannot_create_request(client, pm_user):
    r = client.post("/api/requests", json={
        "project_name": "X", "product_version": "v1", "env_type": "dev", "env_description": "x"
    }, headers=auth(client, "pm1"))
    assert r.status_code == 403
