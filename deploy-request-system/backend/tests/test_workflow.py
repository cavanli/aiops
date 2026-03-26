from tests.conftest import get_token

def _ts_auth(client): return {"Authorization": f"Bearer {get_token(client, 'ts1')}"}
def _pm_auth(client): return {"Authorization": f"Bearer {get_token(client, 'pm1')}"}
def _tester_auth(client): return {"Authorization": f"Bearer {get_token(client, 'tester1')}"}

def make_request(client):
    r = client.post("/api/requests", json={
        "project_name": "P", "product_version": "v1", "env_type": "test", "env_description": "env"
    }, headers=_ts_auth(client))
    return r.json()["id"]

def test_full_happy_path(client, ts_user, pm_user, tester_user):
    req_id = make_request(client)
    r = client.post(f"/api/requests/{req_id}/approve",
                    json={"action": "approved", "comment": "LGTM"}, headers=_pm_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "approved"
    r = client.post(f"/api/requests/{req_id}/resource", json={
        "db_config": "pg 15", "middleware_versions": "redis 7", "network_policy": "open 8080"
    }, headers=_tester_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "ready"
    r = client.post(f"/api/requests/{req_id}/feedback", json={
        "deploy_start": "2026-03-25", "deploy_end": "2026-03-26", "summary": "Done"
    }, headers=_ts_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "completed"

def test_approve_rejects_wrong_role(client, ts_user, tester_user):
    req_id = make_request(client)
    r = client.post(f"/api/requests/{req_id}/approve",
                    json={"action": "approved"}, headers=_tester_auth(client))
    assert r.status_code == 403

def test_feedback_blocked_before_ready(client, ts_user, pm_user):
    req_id = make_request(client)
    r = client.post(f"/api/requests/{req_id}/feedback", json={
        "deploy_start": "2026-03-25", "deploy_end": "2026-03-26", "summary": "premature"
    }, headers=_ts_auth(client))
    assert r.status_code == 422

def test_pm_rejects_request(client, ts_user, pm_user):
    req_id = make_request(client)
    r = client.post(f"/api/requests/{req_id}/approve",
                    json={"action": "rejected", "comment": "Not ready"}, headers=_pm_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "rejected"
