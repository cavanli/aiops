import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from main import app

TEST_DB = "sqlite:///./test.db"
engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(bind=engine)

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def ts_user(client):
    r = client.post("/api/auth/register", json={
        "username": "ts1", "password": "pass123", "name": "Tech Support 1",
        "role": "tech_support", "notification_platform": "wechat", "notification_handle": ""
    })
    return r.json()

@pytest.fixture
def pm_user(client):
    r = client.post("/api/auth/register", json={
        "username": "pm1", "password": "pass123", "name": "PM 1",
        "role": "pm", "notification_platform": "wechat", "notification_handle": ""
    })
    return r.json()

@pytest.fixture
def tester_user(client):
    r = client.post("/api/auth/register", json={
        "username": "tester1", "password": "pass123", "name": "Tester 1",
        "role": "tester", "notification_platform": "wechat", "notification_handle": ""
    })
    return r.json()

def get_token(client, username="ts1", password="pass123"):
    r = client.post("/api/auth/login", data={"username": username, "password": password})
    return r.json()["access_token"]
