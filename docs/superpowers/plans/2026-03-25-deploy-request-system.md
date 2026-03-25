# 部署资源申请系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone web app (FastAPI + Vue 3 + PostgreSQL) that manages the full lifecycle of deployment resource requests — from tech support submission through PM approval, tester resource provisioning, and final deployment feedback, with WeChat/DingTalk webhook notifications at each transition.

**Architecture:** Backend is a FastAPI app with SQLAlchemy models and a service-layer state machine that enforces valid state transitions. Frontend is a Vue 3 SPA with role-based routing — each of the three roles (tech_support, pm, tester) sees a dedicated workbench. Notifications fire asynchronously via httpx after each state change.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL 15, python-jose (JWT), passlib (bcrypt), httpx; Vue 3, Vite, Element Plus, Pinia, Vue Router, Axios; Docker Compose.

**Spec:** `docs/superpowers/specs/2026-03-25-deploy-resource-request-design.md`

---

## File Map

```
deploy-request-system/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          POST /api/auth/register, POST /api/auth/login
│   │   │   └── requests.py      All /api/requests/* endpoints
│   │   ├── models/
│   │   │   └── models.py        SQLAlchemy: User, DeployRequest, Approval,
│   │   │                        ResourceConfig, DeployFeedback
│   │   ├── schemas/
│   │   │   ├── auth.py          RegisterIn, LoginIn, TokenOut, UserOut
│   │   │   └── requests.py      RequestCreate, RequestUpdate, ApproveIn,
│   │   │                        ResourceIn, FeedbackIn, RequestOut (full)
│   │   ├── services/
│   │   │   ├── workflow.py      State machine — all transition logic
│   │   │   └── notification.py  Webhook sender (wechat + dingtalk)
│   │   └── core/
│   │       ├── config.py        Settings (pydantic-settings, reads .env)
│   │       ├── database.py      Engine + SessionLocal + get_db
│   │       ├── security.py      JWT create/verify, bcrypt hash/verify
│   │       └── deps.py          get_current_user, require_role
│   ├── alembic/
│   │   └── versions/            Migrations
│   ├── tests/
│   │   ├── conftest.py          Pytest fixtures: test DB, test client, users
│   │   ├── test_auth.py         Register + login tests
│   │   ├── test_requests.py     CRUD + cancel tests
│   │   └── test_workflow.py     State machine + permission tests
│   ├── main.py                  FastAPI app, CORS, router registration
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js         Instance + JWT interceptor + 401 redirect
│   │   │   ├── auth.js          register(), login()
│   │   │   └── requests.js      list(), get(), create(), update(), cancel(),
│   │   │                        approve(), submitResource(), submitFeedback()
│   │   ├── stores/
│   │   │   ├── auth.js          token, user, login(), logout()
│   │   │   └── requests.js      list, current, actions
│   │   ├── router/
│   │   │   └── index.js         Routes + beforeEach role guard
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   ├── TechSupportDashboard.vue   Stat cards + request table
│   │   │   ├── PMDashboard.vue            Approval queue + full list
│   │   │   ├── TesterDashboard.vue        Resource pending list
│   │   │   ├── CreateRequestView.vue      New request form
│   │   │   ├── EditRequestView.vue        Edit pending request
│   │   │   └── RequestDetailView.vue      Detail + context-sensitive action form
│   │   └── components/
│   │       ├── StatusBadge.vue            Color-coded status chip
│   │       ├── RequestTable.vue           Shared table with slot for action col
│   │       └── StatCards.vue             4-card summary row (tech_support only)
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── .env.example
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `deploy-request-system/backend/requirements.txt`
- Create: `deploy-request-system/backend/Dockerfile`
- Create: `deploy-request-system/docker-compose.yml`
- Create: `deploy-request-system/.env.example`

- [ ] **Step 1: Create root directory and backend requirements**

```
deploy-request-system/
backend/requirements.txt:
```

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
pydantic-settings==2.2.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.27.0
python-multipart==0.0.9
pytest==8.2.0
pytest-asyncio==0.23.6
```

- [ ] **Step 2: Write backend Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Write docker-compose.yml**

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: deploy_request
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://app:${DB_PASSWORD}@db:5432/deploy_request
      SECRET_KEY: ${SECRET_KEY}
      WECHAT_WEBHOOK_URL: ${WECHAT_WEBHOOK_URL}
      DINGTALK_WEBHOOK_URL: ${DINGTALK_WEBHOOK_URL}
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

- [ ] **Step 4: Write .env.example**

```
DB_PASSWORD=changeme
SECRET_KEY=change-this-to-a-random-32-char-string
WECHAT_WEBHOOK_URL=
DINGTALK_WEBHOOK_URL=
```

- [ ] **Step 5: Initialize frontend with Vite**

```bash
cd deploy-request-system
npm create vite@latest frontend -- --template vue
cd frontend
npm install element-plus @element-plus/icons-vue pinia vue-router axios
```

- [ ] **Step 6: Commit**

```bash
git add deploy-request-system/
git commit -m "chore: scaffold project structure and docker-compose"
```

---

## Task 2: Backend Core (Config, DB, Security, Deps)

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/core/deps.py`
- Create: `backend/main.py`

- [ ] **Step 1: Write core/config.py**

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    WECHAT_WEBHOOK_URL: str = ""
    DINGTALK_WEBHOOK_URL: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 2: Write core/database.py**

```python
# backend/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 3: Write core/security.py**

```python
# backend/app/core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, settings.SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
```

- [ ] **Step 4: Write core/deps.py**

```python
# backend/app/core/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = decode_token(token)
        user_id: int = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_role(*roles: str):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return current_user
    return checker
```

- [ ] **Step 5: Write main.py**

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, requests

app = FastAPI(title="Deploy Request System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(requests.router, prefix="/api/requests", tags=["requests"])
```

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: add backend core config, db, security, deps"
```

---

## Task 3: SQLAlchemy Models + Alembic Migration

**Files:**
- Create: `backend/app/models/models.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/001_initial.py` (auto-generated)

- [ ] **Step 1: Write models.py**

```python
# backend/app/models/models.py
import enum
from datetime import datetime, date
from sqlalchemy import String, Text, Enum, ForeignKey, Date, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    tech_support = "tech_support"
    pm = "pm"
    tester = "tester"

class NotificationPlatform(str, enum.Enum):
    wechat = "wechat"
    dingtalk = "dingtalk"

class RequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    ready = "ready"
    completed = "completed"
    cancelled = "cancelled"

class EnvType(str, enum.Enum):
    dev = "dev"
    test = "test"
    staging = "staging"
    prod = "prod"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole))
    name: Mapped[str] = mapped_column(String(64))
    notification_platform: Mapped[NotificationPlatform] = mapped_column(Enum(NotificationPlatform))
    notification_handle: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class DeployRequest(Base):
    __tablename__ = "deploy_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    req_no: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    project_name: Mapped[str] = mapped_column(String(128))
    product_version: Mapped[str] = mapped_column(String(64))
    env_type: Mapped[EnvType] = mapped_column(Enum(EnvType))
    env_description: Mapped[str] = mapped_column(Text)
    expected_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[RequestStatus] = mapped_column(Enum(RequestStatus), default=RequestStatus.pending)
    applicant_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    applicant: Mapped["User"] = relationship("User", foreign_keys=[applicant_id])
    approval: Mapped["Approval | None"] = relationship("Approval", back_populates="request", uselist=False)
    resource_config: Mapped["ResourceConfig | None"] = relationship("ResourceConfig", back_populates="request", uselist=False)
    feedback: Mapped["DeployFeedback | None"] = relationship("DeployFeedback", back_populates="request", uselist=False)

class Approval(Base):
    __tablename__ = "approvals"
    __table_args__ = (UniqueConstraint("request_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("deploy_requests.id"))
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(16))  # approved | rejected
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    request: Mapped["DeployRequest"] = relationship("DeployRequest", back_populates="approval")

class ResourceConfig(Base):
    __tablename__ = "resource_configs"
    __table_args__ = (UniqueConstraint("request_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("deploy_requests.id"))
    db_config: Mapped[str] = mapped_column(Text)
    middleware_versions: Mapped[str] = mapped_column(Text)
    network_policy: Mapped[str] = mapped_column(Text)
    provider_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    request: Mapped["DeployRequest"] = relationship("DeployRequest", back_populates="resource_config")

class DeployFeedback(Base):
    __tablename__ = "deploy_feedbacks"
    __table_args__ = (UniqueConstraint("request_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("deploy_requests.id"))
    deploy_start: Mapped[date] = mapped_column(Date)
    deploy_end: Mapped[date] = mapped_column(Date)
    summary: Mapped[str] = mapped_column(Text)
    submitter_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    request: Mapped["DeployRequest"] = relationship("DeployRequest", back_populates="feedback")
```

- [ ] **Step 2: Initialize Alembic**

```bash
cd backend
alembic init alembic
```

Edit `alembic/env.py` — add after imports:
```python
from app.core.config import settings
from app.core.database import Base
import app.models.models  # noqa: ensure models are registered

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata
```

- [ ] **Step 3: Generate and run initial migration**

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Expected: 5 tables created in PostgreSQL.

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/ backend/alembic/
git commit -m "feat: add SQLAlchemy models and initial migration"
```

---

## Task 4: Auth API (Register + Login)

**Files:**
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/api/auth.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write failing tests first**

```python
# backend/tests/conftest.py
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
```

```python
# backend/tests/test_auth.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && pytest tests/test_auth.py -v
```
Expected: ImportError or 404 — auth routes not yet defined.

- [ ] **Step 3: Write schemas/auth.py**

```python
# backend/app/schemas/auth.py
from pydantic import BaseModel
from app.models.models import UserRole, NotificationPlatform

class RegisterIn(BaseModel):
    username: str
    password: str
    name: str
    role: UserRole
    notification_platform: NotificationPlatform
    notification_handle: str = ""

class UserOut(BaseModel):
    id: int
    username: str
    name: str
    role: UserRole
    notification_platform: NotificationPlatform

    model_config = {"from_attributes": True}

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
```

- [ ] **Step 4: Write api/auth.py**

```python
# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import User
from app.schemas.auth import RegisterIn, UserOut, TokenOut

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        name=data.name,
        role=data.role,
        notification_platform=data.notification_platform,
        notification_handle=data.notification_handle,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.id})
    return TokenOut(access_token=token, user=UserOut.model_validate(user))
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_auth.py -v
```
Expected: 4 PASSED

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/auth.py backend/app/api/auth.py backend/tests/
git commit -m "feat: add auth register and login endpoints with tests"
```

---

## Task 5: Deploy Request CRUD + Cancel

**Files:**
- Create: `backend/app/schemas/requests.py`
- Create: `backend/app/api/requests.py` (CRUD portion)
- Create: `backend/tests/test_requests.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_requests.py
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_requests.py -v
```
Expected: All FAIL (no routes yet).

- [ ] **Step 3: Write schemas/requests.py**

```python
# backend/app/schemas/requests.py
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.models import RequestStatus, EnvType
from app.schemas.auth import UserOut

class RequestCreate(BaseModel):
    project_name: str
    product_version: str
    env_type: EnvType
    env_description: str
    expected_date: Optional[date] = None
    remarks: Optional[str] = None

class RequestUpdate(BaseModel):
    project_name: Optional[str] = None
    product_version: Optional[str] = None
    env_type: Optional[EnvType] = None
    env_description: Optional[str] = None
    expected_date: Optional[date] = None
    remarks: Optional[str] = None

class ApproveIn(BaseModel):
    action: str  # "approved" | "rejected"
    comment: Optional[str] = None

class ResourceIn(BaseModel):
    db_config: str
    middleware_versions: str
    network_policy: str

class FeedbackIn(BaseModel):
    deploy_start: date
    deploy_end: date
    summary: str

class ApprovalOut(BaseModel):
    action: str
    comment: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

class ResourceOut(BaseModel):
    db_config: str
    middleware_versions: str
    network_policy: str
    created_at: datetime
    model_config = {"from_attributes": True}

class FeedbackOut(BaseModel):
    deploy_start: date
    deploy_end: date
    summary: str
    created_at: datetime
    model_config = {"from_attributes": True}

class RequestOut(BaseModel):
    id: int
    req_no: str
    project_name: str
    product_version: str
    env_type: EnvType
    env_description: str
    expected_date: Optional[date]
    remarks: Optional[str]
    status: RequestStatus
    applicant: UserOut
    approval: Optional[ApprovalOut]
    resource_config: Optional[ResourceOut]
    feedback: Optional[FeedbackOut]
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class RequestListOut(BaseModel):
    items: list[RequestOut]
    total: int
```

- [ ] **Step 4: Write api/requests.py — CRUD + cancel portion**

```python
# backend/app/api/requests.py
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.models import DeployRequest, RequestStatus, User
from app.schemas.requests import (
    RequestCreate, RequestUpdate, RequestOut, RequestListOut,
    ApproveIn, ResourceIn, FeedbackIn
)
from app.services import notification

router = APIRouter()

def _generate_req_no(db: Session) -> str:
    count = db.query(DeployRequest).count() + 1
    today = date.today()
    return f"REQ-{today.year}-{today.strftime('%m%d')}-{count:03d}"

@router.post("", response_model=RequestOut, status_code=201)
async def create_request(
    data: RequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = DeployRequest(
        req_no=_generate_req_no(db),
        applicant_id=current_user.id,
        **data.model_dump(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    background_tasks.add_task(notification.notify_new_request, req, db)
    return req

@router.get("", response_model=RequestListOut)
def list_requests(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(DeployRequest)
    if current_user.role == "tech_support":
        q = q.filter(DeployRequest.applicant_id == current_user.id)
    elif current_user.role == "tester":
        q = q.filter(DeployRequest.status.in_(["approved", "ready", "completed"]))
    if status:
        q = q.filter(DeployRequest.status == status)
    total = q.count()
    items = q.order_by(DeployRequest.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return RequestListOut(items=items, total=total)

@router.get("/{req_id}", response_model=RequestOut)
def get_request(req_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user.role == "tech_support" and req.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return req

@router.put("/{req_id}", response_model=RequestOut)
def update_request(
    req_id: int, data: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = db.get(DeployRequest, req_id)
    if not req or req.applicant_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status != RequestStatus.pending:
        raise HTTPException(status_code=422, detail="Can only edit pending requests")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(req, k, v)
    db.commit()
    db.refresh(req)
    return req

@router.post("/{req_id}/cancel", response_model=RequestOut)
def cancel_request(
    req_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = db.get(DeployRequest, req_id)
    if not req or req.applicant_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    if req.status != RequestStatus.pending:
        raise HTTPException(status_code=422, detail="Can only cancel pending requests")
    req.status = RequestStatus.cancelled
    db.commit()
    db.refresh(req)
    return req
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_requests.py -v
```
Expected: 5 PASSED

- [ ] **Step 6: Commit**

```bash
git add backend/app/schemas/requests.py backend/app/api/requests.py
git commit -m "feat: add request CRUD and cancel endpoints with tests"
```

---

## Task 6: Workflow State Transitions (Approve / Resource / Feedback)

**Files:**
- Create: `backend/app/services/workflow.py`
- Modify: `backend/app/api/requests.py` (add 3 endpoints)
- Create: `backend/tests/test_workflow.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_workflow.py
from tests.conftest import get_token

def ts_auth(client): return {"Authorization": f"Bearer {get_token(client, 'ts1')}"}
def pm_auth(client): return {"Authorization": f"Bearer {get_token(client, 'pm1')}"}
def tester_auth(client): return {"Authorization": f"Bearer {get_token(client, 'tester1')}"}

def make_request(client):
    r = client.post("/api/requests", json={
        "project_name": "P", "product_version": "v1", "env_type": "test", "env_description": "env"
    }, headers=ts_auth(client))
    return r.json()["id"]

def test_full_happy_path(client, ts_user, pm_user, tester_user):
    req_id = make_request(client)

    # PM approves
    r = client.post(f"/api/requests/{req_id}/approve",
                    json={"action": "approved", "comment": "LGTM"}, headers=pm_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "approved"

    # Tester provides resource
    r = client.post(f"/api/requests/{req_id}/resource", json={
        "db_config": "pg 15", "middleware_versions": "redis 7", "network_policy": "open 8080"
    }, headers=tester_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "ready"

    # Tech support submits feedback
    r = client.post(f"/api/requests/{req_id}/feedback", json={
        "deploy_start": "2026-03-25", "deploy_end": "2026-03-26", "summary": "Done"
    }, headers=ts_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "completed"

def test_approve_rejects_wrong_role(client, ts_user, tester_user):
    req_id = make_request(client)
    r = client.post(f"/api/requests/{req_id}/approve",
                    json={"action": "approved"}, headers=tester_auth(client))
    assert r.status_code == 403

def test_feedback_blocked_before_ready(client, ts_user, pm_user):
    req_id = make_request(client)
    # Request is still pending — feedback must fail
    r = client.post(f"/api/requests/{req_id}/feedback", json={
        "deploy_start": "2026-03-25", "deploy_end": "2026-03-26", "summary": "premature"
    }, headers=ts_auth(client))
    assert r.status_code == 422

def test_pm_rejects_request(client, ts_user, pm_user):
    req_id = make_request(client)
    r = client.post(f"/api/requests/{req_id}/approve",
                    json={"action": "rejected", "comment": "Not ready"}, headers=pm_auth(client))
    assert r.status_code == 200
    assert r.json()["status"] == "rejected"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_workflow.py -v
```
Expected: All FAIL.

- [ ] **Step 3: Write services/workflow.py**

```python
# backend/app/services/workflow.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.models import (
    DeployRequest, Approval, ResourceConfig, DeployFeedback, RequestStatus
)
from app.schemas.requests import ApproveIn, ResourceIn, FeedbackIn

VALID_TRANSITIONS = {
    RequestStatus.pending: [RequestStatus.approved, RequestStatus.rejected, RequestStatus.cancelled],
    RequestStatus.approved: [RequestStatus.ready],
    RequestStatus.ready: [RequestStatus.completed],
}

def _assert_transition(req: DeployRequest, target: RequestStatus):
    allowed = VALID_TRANSITIONS.get(req.status, [])
    if target not in allowed:
        raise HTTPException(status_code=422, detail=f"Cannot transition from {req.status} to {target}")

def approve(req: DeployRequest, data: ApproveIn, reviewer_id: int, db: Session) -> DeployRequest:
    target = RequestStatus.approved if data.action == "approved" else RequestStatus.rejected
    _assert_transition(req, target)
    approval = Approval(request_id=req.id, reviewer_id=reviewer_id,
                        action=data.action, comment=data.comment)
    req.status = target
    db.add(approval)
    db.commit()
    db.refresh(req)
    return req

def submit_resource(req: DeployRequest, data: ResourceIn, provider_id: int, db: Session) -> DeployRequest:
    _assert_transition(req, RequestStatus.ready)
    config = ResourceConfig(
        request_id=req.id, provider_id=provider_id,
        db_config=data.db_config, middleware_versions=data.middleware_versions,
        network_policy=data.network_policy,
    )
    req.status = RequestStatus.ready
    db.add(config)
    db.commit()
    db.refresh(req)
    return req

def submit_feedback(req: DeployRequest, data: FeedbackIn, submitter_id: int, db: Session) -> DeployRequest:
    _assert_transition(req, RequestStatus.completed)
    feedback = DeployFeedback(
        request_id=req.id, submitter_id=submitter_id,
        deploy_start=data.deploy_start, deploy_end=data.deploy_end, summary=data.summary,
    )
    req.status = RequestStatus.completed
    db.add(feedback)
    db.commit()
    db.refresh(req)
    return req
```

- [ ] **Step 4: Add 3 endpoints to api/requests.py**

Append to `backend/app/api/requests.py`:

```python
from app.services import workflow

@router.post("/{req_id}/approve", response_model=RequestOut)
def approve_request(
    req_id: int, data: ApproveIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pm")),
):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404)
    return workflow.approve(req, data, current_user.id, db)

@router.post("/{req_id}/resource", response_model=RequestOut)
def submit_resource(
    req_id: int, data: ResourceIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tester")),
):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404)
    return workflow.submit_resource(req, data, current_user.id, db)

@router.post("/{req_id}/feedback", response_model=RequestOut)
def submit_feedback(
    req_id: int, data: FeedbackIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = db.get(DeployRequest, req_id)
    if not req or req.applicant_id != current_user.id:
        raise HTTPException(status_code=404)
    return workflow.submit_feedback(req, data, current_user.id, db)
```

- [ ] **Step 5: Run all tests**

```bash
pytest tests/ -v
```
Expected: All PASSED.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/workflow.py backend/app/api/requests.py backend/tests/test_workflow.py
git commit -m "feat: add workflow state machine and transition endpoints with tests"
```

---

## Task 7: Notification Service

**Files:**
- Create: `backend/app/services/notification.py`
- Modify: `backend/app/api/requests.py` (wire notifications)

- [ ] **Step 1: Write notification.py**

```python
# backend/app/services/notification.py
import asyncio
import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import User, DeployRequest, UserRole, NotificationPlatform

async def _send(handle: str, platform: NotificationPlatform, text: str):
    """Send message to one user via their configured platform."""
    if not handle:
        return
    if platform == NotificationPlatform.wechat and settings.WECHAT_WEBHOOK_URL:
        payload = {"msgtype": "text", "text": {"content": text, "mentioned_list": [handle]}}
        async with httpx.AsyncClient() as client:
            await client.post(settings.WECHAT_WEBHOOK_URL, json=payload, timeout=5)
    elif platform == NotificationPlatform.dingtalk and settings.DINGTALK_WEBHOOK_URL:
        payload = {"msgtype": "text", "text": {"content": text}, "at": {"atMobiles": [handle]}}
        async with httpx.AsyncClient() as client:
            await client.post(settings.DINGTALK_WEBHOOK_URL, json=payload, timeout=5)

async def _broadcast_role(role: UserRole, text: str, db: Session):
    users = db.query(User).filter(User.role == role).all()
    await asyncio.gather(*[_send(u.notification_handle, u.notification_platform, text) for u in users])

async def notify_new_request(req: DeployRequest, db: Session):
    msg = f"【新部署申请】{req.applicant.name} 提交了申请\n项目：{req.project_name} {req.product_version}\n编号：{req.req_no}"
    await _broadcast_role(UserRole.pm, msg, db)

async def notify_approved(req: DeployRequest, db: Session):
    msg = f"【申请已通过】{req.req_no} 已通过审批\n项目：{req.project_name}，请提供部署资源"
    await _broadcast_role(UserRole.tester, msg, db)

async def notify_rejected(req: DeployRequest, db: Session):
    msg = f"【申请被拒绝】{req.req_no} 审批未通过\n项目：{req.project_name}"
    await _send(req.applicant.notification_handle, req.applicant.notification_platform, msg)

async def notify_resource_ready(req: DeployRequest, db: Session):
    msg = f"【资源已就绪】{req.req_no} 部署资源已配置完成\n项目：{req.project_name}，请开始部署"
    await _send(req.applicant.notification_handle, req.applicant.notification_platform, msg)

async def notify_completed(req: DeployRequest, db: Session):
    msg = f"【部署完成】{req.req_no} 已完成部署\n项目：{req.project_name} {req.product_version}"
    await _broadcast_role(UserRole.pm, msg, db)
```

- [ ] **Step 2: Wire notifications into api/requests.py**

`from app.services import notification` is already imported (added in Task 5).
Add `background_tasks: BackgroundTasks` parameter to each of the three workflow endpoints and wire notifications using `background_tasks.add_task(...)` — this is FastAPI's built-in background task mechanism and works correctly in both sync and async route handlers.

Updated `approve_request`:
```python
@router.post("/{req_id}/approve", response_model=RequestOut)
async def approve_request(
    req_id: int, data: ApproveIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pm")),
):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404)
    updated = workflow.approve(req, data, current_user.id, db)
    if data.action == "approved":
        background_tasks.add_task(notification.notify_approved, updated, db)
    else:
        background_tasks.add_task(notification.notify_rejected, updated, db)
    return updated
```

Updated `submit_resource`:
```python
@router.post("/{req_id}/resource", response_model=RequestOut)
async def submit_resource(
    req_id: int, data: ResourceIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tester")),
):
    req = db.get(DeployRequest, req_id)
    if not req:
        raise HTTPException(status_code=404)
    updated = workflow.submit_resource(req, data, current_user.id, db)
    background_tasks.add_task(notification.notify_resource_ready, updated, db)
    return updated
```

Updated `submit_feedback`:
```python
@router.post("/{req_id}/feedback", response_model=RequestOut)
async def submit_feedback(
    req_id: int, data: FeedbackIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("tech_support")),
):
    req = db.get(DeployRequest, req_id)
    if not req or req.applicant_id != current_user.id:
        raise HTTPException(status_code=404)
    updated = workflow.submit_feedback(req, data, current_user.id, db)
    background_tasks.add_task(notification.notify_completed, updated, db)
    return updated
```

- [ ] **Step 3: Run all tests to confirm nothing broke**

```bash
pytest tests/ -v
```
Expected: All PASSED (notification calls are fire-and-forget, won't fail tests).

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/notification.py backend/app/api/requests.py
git commit -m "feat: add WeChat/DingTalk webhook notification service"
```

---

## Task 8: Frontend Scaffolding + Axios + Auth Store

**Files:**
- Modify: `frontend/vite.config.js`
- Create: `frontend/src/api/axios.js`
- Create: `frontend/src/api/auth.js`
- Create: `frontend/src/api/requests.js`
- Create: `frontend/src/stores/auth.js`
- Modify: `frontend/src/main.js`

- [ ] **Step 1: Configure vite.config.js (API proxy)**

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

- [ ] **Step 2: Write src/api/axios.js**

```js
// frontend/src/api/axios.js
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

- [ ] **Step 3: Write src/api/auth.js and api/requests.js**

```js
// frontend/src/api/auth.js
import api from './axios'

export const register = (data) => api.post('/auth/register', data)
export const login = (username, password) => {
  const form = new URLSearchParams({ username, password })
  return api.post('/auth/login', form)
}
```

```js
// frontend/src/api/requests.js
import api from './axios'

export const listRequests = (params) => api.get('/requests', { params })
export const getRequest = (id) => api.get(`/requests/${id}`)
export const createRequest = (data) => api.post('/requests', data)
export const updateRequest = (id, data) => api.put(`/requests/${id}`, data)
export const cancelRequest = (id) => api.post(`/requests/${id}/cancel`)
export const approveRequest = (id, data) => api.post(`/requests/${id}/approve`, data)
export const submitResource = (id, data) => api.post(`/requests/${id}/resource`, data)
export const submitFeedback = (id, data) => api.post(`/requests/${id}/feedback`, data)
```

- [ ] **Step 4: Write src/stores/auth.js**

```js
// frontend/src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role)

  async function login(username, password) {
    const { data } = await apiLogin(username, password)
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  async function register(payload) {
    await apiRegister(payload)
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLoggedIn, role, login, register, logout }
})
```

- [ ] **Step 5: Wire up main.js**

```js
// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add frontend scaffolding, axios, api layer, auth store"
```

---

## Task 9: Frontend Router + Auth Views

**Files:**
- Create: `frontend/src/router/index.js`
- Create: `frontend/src/views/LoginView.vue`
- Create: `frontend/src/views/RegisterView.vue`
- Modify: `frontend/src/App.vue`

- [ ] **Step 1: Write router/index.js**

```js
// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
  { path: '/dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/requests/new', component: () => import('@/views/CreateRequestView.vue'), meta: { role: 'tech_support' } },
  { path: '/requests/:id/edit', component: () => import('@/views/EditRequestView.vue'), meta: { role: 'tech_support' } },
  { path: '/requests/:id', component: () => import('@/views/RequestDetailView.vue') },
  { path: '/', redirect: '/dashboard' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
  if (to.meta.role && auth.role !== to.meta.role) return '/dashboard'
})

export default router
```

- [ ] **Step 2: Write LoginView.vue**

```vue
<!-- frontend/src/views/LoginView.vue -->
<template>
  <div style="max-width:360px;margin:100px auto">
    <el-card header="部署资源申请系统 — 登录">
      <el-form :model="form" @submit.prevent="submit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">登录</el-button>
        <div style="margin-top:12px;text-align:center">
          <router-link to="/register">注册账号</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const router = useRouter()
const form = ref({ username: '', password: '' })
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await auth.login(form.value.username, form.value.password)
    router.push('/dashboard')
  } catch {
    ElMessage.error('用户名或密码错误')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 3: Write RegisterView.vue**

```vue
<!-- frontend/src/views/RegisterView.vue -->
<template>
  <div style="max-width:400px;margin:80px auto">
    <el-card header="注册账号">
      <el-form :model="form" @submit.prevent="submit">
        <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width:100%">
            <el-option label="技术支持" value="tech_support" />
            <el-option label="项目经理" value="pm" />
            <el-option label="测试人员" value="tester" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知平台">
          <el-radio-group v-model="form.notification_platform">
            <el-radio value="wechat">企业微信</el-radio>
            <el-radio value="dingtalk">钉钉</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知账号"><el-input v-model="form.notification_handle" placeholder="企微userid或钉钉手机号" /></el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width:100%">注册</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const router = useRouter()
const loading = ref(false)
const form = ref({
  username: '', name: '', password: '',
  role: 'tech_support', notification_platform: 'wechat', notification_handle: ''
})

async function submit() {
  loading.value = true
  try {
    await auth.register(form.value)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 4: Write App.vue (nav bar)**

```vue
<!-- frontend/src/App.vue -->
<template>
  <div>
    <el-menu v-if="auth.isLoggedIn" mode="horizontal" style="padding:0 24px">
      <el-menu-item index="1" @click="router.push('/dashboard')">工作台</el-menu-item>
      <el-menu-item v-if="auth.role === 'tech_support'" index="2" @click="router.push('/requests/new')">新建申请</el-menu-item>
      <div style="flex:1" />
      <el-menu-item index="99" @click="handleLogout">退出 ({{ auth.user?.name }})</el-menu-item>
    </el-menu>
    <div style="padding:24px">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
```

- [ ] **Step 5: Start dev server and verify login/register flow works**

```bash
cd frontend && npm run dev
```
Open http://localhost:5173/register — register one user of each role.
Open http://localhost:5173/login — login, verify redirect to /dashboard.
**Note:** `/dashboard` will show a blank page until `DashboardView.vue` is created in Task 10. That's expected — verify only that the redirect happens (URL changes to /dashboard) without a 404 crash.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/router/ frontend/src/views/LoginView.vue frontend/src/views/RegisterView.vue frontend/src/App.vue
git commit -m "feat: add router with role guards, login and register views"
```

---

## Task 10: Shared Components + Dashboard Router

**Files:**
- Create: `frontend/src/components/StatusBadge.vue`
- Create: `frontend/src/components/RequestTable.vue`
- Create: `frontend/src/components/StatCards.vue`
- Create: `frontend/src/views/DashboardView.vue` (role router)

- [ ] **Step 1: Write StatusBadge.vue**

```vue
<!-- frontend/src/components/StatusBadge.vue -->
<template>
  <el-tag :type="typeMap[status] || 'info'" size="small">{{ labelMap[status] || status }}</el-tag>
</template>

<script setup>
defineProps({ status: String })
const typeMap = {
  pending: 'warning', approved: 'primary', rejected: 'danger',
  ready: 'success', completed: 'success', cancelled: 'info'
}
const labelMap = {
  pending: '待审批', approved: '待提供资源', rejected: '已拒绝',
  ready: '待部署', completed: '已完成', cancelled: '已取消'
}
</script>
```

- [ ] **Step 2: Write RequestTable.vue**

```vue
<!-- frontend/src/components/RequestTable.vue -->
<template>
  <el-table :data="requests" style="width:100%">
    <el-table-column prop="req_no" label="申请编号" width="180">
      <template #default="{row}">
        <router-link :to="`/requests/${row.id}`">{{ row.req_no }}</router-link>
      </template>
    </el-table-column>
    <el-table-column prop="project_name" label="项目名称" />
    <el-table-column prop="product_version" label="版本" width="100" />
    <el-table-column label="环境" width="90">
      <template #default="{row}">{{ envLabel[row.env_type] }}</template>
    </el-table-column>
    <el-table-column label="状态" width="110">
      <template #default="{row}"><StatusBadge :status="row.status" /></template>
    </el-table-column>
    <el-table-column prop="applicant.name" label="申请人" width="100" />
    <el-table-column label="操作" width="150">
      <template #default="{row}"><slot name="action" :row="row" /></template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
defineProps({ requests: Array })
const envLabel = { dev: '开发', test: '测试', staging: '预生产', prod: '生产' }
</script>
```

- [ ] **Step 3: Write StatCards.vue**

```vue
<!-- frontend/src/components/StatCards.vue -->
<template>
  <el-row :gutter="16" style="margin-bottom:20px">
    <el-col :span="6" v-for="card in cards" :key="card.label">
      <el-card shadow="never">
        <div style="font-size:28px;font-weight:700;color:#3b82f6">{{ card.value }}</div>
        <div style="color:#64748b;margin-top:4px">{{ card.label }}</div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
defineProps({ cards: Array })
// cards: [{ label: '我的申请', value: 3 }, ...]
</script>
```

- [ ] **Step 4: Write DashboardView.vue (role router)**

```vue
<!-- frontend/src/views/DashboardView.vue -->
<template>
  <TechSupportDashboard v-if="role === 'tech_support'" />
  <PMDashboard v-else-if="role === 'pm'" />
  <TesterDashboard v-else-if="role === 'tester'" />
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import TechSupportDashboard from './TechSupportDashboard.vue'
import PMDashboard from './PMDashboard.vue'
import TesterDashboard from './TesterDashboard.vue'

const role = computed(() => useAuthStore().role)
</script>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ frontend/src/views/DashboardView.vue
git commit -m "feat: add shared components and dashboard role router"
```

---

## Task 11: Tech Support Workbench

**Files:**
- Create: `frontend/src/views/TechSupportDashboard.vue`
- Create: `frontend/src/views/CreateRequestView.vue`
- Create: `frontend/src/views/EditRequestView.vue`

- [ ] **Step 1: Write TechSupportDashboard.vue**

```vue
<!-- frontend/src/views/TechSupportDashboard.vue -->
<template>
  <div>
    <StatCards :cards="statCards" />
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <el-select v-model="statusFilter" placeholder="筛选状态" clearable style="width:160px" @change="load">
        <el-option v-for="s in statuses" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <el-button type="primary" @click="router.push('/requests/new')">+ 新建申请</el-button>
    </div>
    <RequestTable :requests="items">
      <template #action="{row}">
        <el-button v-if="row.status === 'pending'" size="small" @click="router.push(`/requests/${row.id}/edit`)">编辑</el-button>
        <el-button v-if="row.status === 'pending'" size="small" type="danger" @click="doCancel(row)">取消</el-button>
        <el-button v-if="row.status === 'ready'" size="small" type="success" @click="router.push(`/requests/${row.id}`)">填写反馈</el-button>
        <el-button v-if="!['pending','ready'].includes(row.status)" size="small" @click="router.push(`/requests/${row.id}`)">详情</el-button>
      </template>
    </RequestTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listRequests, cancelRequest } from '@/api/requests'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatCards from '@/components/StatCards.vue'
import RequestTable from '@/components/RequestTable.vue'

const router = useRouter()
const items = ref([])
const total = ref(0)
const statusFilter = ref('')
const statuses = [
  { value: 'pending', label: '待审批' }, { value: 'approved', label: '待提供资源' },
  { value: 'ready', label: '待部署' }, { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }, { value: 'rejected', label: '已拒绝' },
]

const statCards = computed(() => [
  { label: '我的申请', value: total.value },
  { label: '待审批', value: items.value.filter(r => r.status === 'pending').length },
  { label: '待部署', value: items.value.filter(r => r.status === 'ready').length },
  { label: '已完成', value: items.value.filter(r => r.status === 'completed').length },
])

async function load() {
  const { data } = await listRequests({ status: statusFilter.value || undefined, limit: 100 })
  items.value = data.items
  total.value = data.total
}

async function doCancel(row) {
  await ElMessageBox.confirm(`确认取消申请 ${row.req_no}？`)
  await cancelRequest(row.id)
  ElMessage.success('已取消')
  load()
}

onMounted(load)
</script>
```

- [ ] **Step 2: Write CreateRequestView.vue**

```vue
<!-- frontend/src/views/CreateRequestView.vue -->
<template>
  <el-card header="新建部署资源申请" style="max-width:640px">
    <el-form :model="form" label-width="120px" @submit.prevent="submit">
      <el-form-item label="项目名称" required><el-input v-model="form.project_name" /></el-form-item>
      <el-form-item label="产品版本" required><el-input v-model="form.product_version" placeholder="如 v2.3.1" /></el-form-item>
      <el-form-item label="部署环境" required>
        <el-select v-model="form.env_type" style="width:100%">
          <el-option label="开发环境" value="dev" />
          <el-option label="测试环境" value="test" />
          <el-option label="预生产环境" value="staging" />
          <el-option label="生产环境" value="prod" />
        </el-select>
      </el-form-item>
      <el-form-item label="环境说明" required><el-input v-model="form.env_description" type="textarea" :rows="3" /></el-form-item>
      <el-form-item label="期望部署时间"><el-date-picker v-model="form.expected_date" type="date" style="width:100%" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remarks" type="textarea" :rows="2" /></el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading">提交申请</el-button>
        <el-button @click="router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createRequest } from '@/api/requests'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const form = ref({ project_name: '', product_version: '', env_type: 'test', env_description: '', expected_date: null, remarks: '' })

async function submit() {
  loading.value = true
  try {
    const { data } = await createRequest(form.value)
    ElMessage.success(`申请 ${data.req_no} 已提交`)
    router.push('/dashboard')
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '提交失败')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 3: Write EditRequestView.vue** (same form, pre-filled with existing data)

```vue
<!-- frontend/src/views/EditRequestView.vue -->
<template>
  <el-card header="修改申请" style="max-width:640px">
    <el-form v-if="form" :model="form" label-width="120px" @submit.prevent="submit">
      <el-form-item label="项目名称"><el-input v-model="form.project_name" /></el-form-item>
      <el-form-item label="产品版本"><el-input v-model="form.product_version" /></el-form-item>
      <el-form-item label="部署环境">
        <el-select v-model="form.env_type" style="width:100%">
          <el-option label="开发环境" value="dev" />
          <el-option label="测试环境" value="test" />
          <el-option label="预生产环境" value="staging" />
          <el-option label="生产环境" value="prod" />
        </el-select>
      </el-form-item>
      <el-form-item label="环境说明"><el-input v-model="form.env_description" type="textarea" :rows="3" /></el-form-item>
      <el-form-item label="期望部署时间"><el-date-picker v-model="form.expected_date" type="date" style="width:100%" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remarks" type="textarea" :rows="2" /></el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading">保存修改</el-button>
        <el-button @click="router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRequest, updateRequest } from '@/api/requests'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const form = ref(null)
const loading = ref(false)

onMounted(async () => {
  const { data } = await getRequest(route.params.id)
  form.value = { project_name: data.project_name, product_version: data.product_version,
    env_type: data.env_type, env_description: data.env_description,
    expected_date: data.expected_date, remarks: data.remarks }
})

async function submit() {
  loading.value = true
  try {
    await updateRequest(route.params.id, form.value)
    ElMessage.success('已保存')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 4: Manual test — create, edit, cancel a request as tech_support**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/TechSupportDashboard.vue frontend/src/views/CreateRequestView.vue frontend/src/views/EditRequestView.vue
git commit -m "feat: add tech support workbench and request create/edit views"
```

---

## Task 12: PM Workbench + Tester Workbench

**Files:**
- Create: `frontend/src/views/PMDashboard.vue`
- Create: `frontend/src/views/TesterDashboard.vue`

- [ ] **Step 1: Write PMDashboard.vue**

```vue
<!-- frontend/src/views/PMDashboard.vue -->
<template>
  <div>
    <h3>待审批申请</h3>
    <RequestTable :requests="pending">
      <template #action="{row}">
        <el-button size="small" type="success" @click="openApprove(row, 'approved')">通过</el-button>
        <el-button size="small" type="danger" @click="openApprove(row, 'rejected')">拒绝</el-button>
      </template>
    </RequestTable>

    <h3 style="margin-top:32px">全部申请</h3>
    <el-select v-model="statusFilter" clearable placeholder="筛选状态" style="width:160px;margin-bottom:12px" @change="load">
      <el-option v-for="s in statuses" :key="s.value" :label="s.label" :value="s.value" />
    </el-select>
    <RequestTable :requests="all">
      <template #action="{row}">
        <el-button size="small" @click="router.push(`/requests/${row.id}`)">详情</el-button>
      </template>
    </RequestTable>

    <el-dialog v-model="dialogVisible" :title="actionLabel">
      <el-input v-model="comment" type="textarea" placeholder="审批意见（选填）" :rows="3" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :type="approveAction === 'approved' ? 'primary' : 'danger'" :loading="loading" @click="doApprove">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listRequests, approveRequest } from '@/api/requests'
import { ElMessage } from 'element-plus'
import RequestTable from '@/components/RequestTable.vue'

const router = useRouter()
const all = ref([])
const statusFilter = ref('')
const dialogVisible = ref(false)
const approveAction = ref('')
const comment = ref('')
const currentRow = ref(null)
const loading = ref(false)

const pending = computed(() => all.value.filter(r => r.status === 'pending'))
const actionLabel = computed(() => approveAction.value === 'approved' ? '通过审批' : '拒绝申请')
const statuses = [
  { value: 'pending', label: '待审批' }, { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' }, { value: 'ready', label: '待部署' },
  { value: 'completed', label: '已完成' }
]

async function load() {
  const { data } = await listRequests({ status: statusFilter.value || undefined, limit: 100 })
  all.value = data.items
}

function openApprove(row, action) {
  currentRow.value = row
  approveAction.value = action
  comment.value = ''
  dialogVisible.value = true
}

async function doApprove() {
  loading.value = true
  try {
    await approveRequest(currentRow.value.id, { action: approveAction.value, comment: comment.value })
    ElMessage.success(approveAction.value === 'approved' ? '已通过' : '已拒绝')
    dialogVisible.value = false
    load()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
```

- [ ] **Step 2: Write TesterDashboard.vue**

```vue
<!-- frontend/src/views/TesterDashboard.vue -->
<template>
  <div>
    <h3>待提供资源申请</h3>
    <RequestTable :requests="pending">
      <template #action="{row}">
        <el-button size="small" type="primary" @click="router.push(`/requests/${row.id}`)">填写资源配置</el-button>
      </template>
    </RequestTable>

    <h3 style="margin-top:32px">历史记录</h3>
    <RequestTable :requests="history">
      <template #action="{row}">
        <el-button size="small" @click="router.push(`/requests/${row.id}`)">详情</el-button>
      </template>
    </RequestTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listRequests } from '@/api/requests'
import RequestTable from '@/components/RequestTable.vue'

const router = useRouter()
const items = ref([])
const pending = computed(() => items.value.filter(r => r.status === 'approved'))
const history = computed(() => items.value.filter(r => r.status !== 'approved'))

onMounted(async () => {
  const { data } = await listRequests({ limit: 100 })
  items.value = data.items
})
</script>
```

- [ ] **Step 3: Manual test — login as PM, approve a pending request; login as tester, verify it appears in pending list**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/PMDashboard.vue frontend/src/views/TesterDashboard.vue
git commit -m "feat: add PM approval workbench and tester resource workbench"
```

---

## Task 13: Request Detail View (All Action Forms)

**Files:**
- Create: `frontend/src/views/RequestDetailView.vue`

- [ ] **Step 1: Write RequestDetailView.vue**

```vue
<!-- frontend/src/views/RequestDetailView.vue -->
<template>
  <div v-if="req" style="max-width:720px">
    <el-descriptions :title="`申请详情 — ${req.req_no}`" :column="2" border>
      <el-descriptions-item label="项目名称">{{ req.project_name }}</el-descriptions-item>
      <el-descriptions-item label="产品版本">{{ req.product_version }}</el-descriptions-item>
      <el-descriptions-item label="部署环境">{{ envLabel[req.env_type] }}</el-descriptions-item>
      <el-descriptions-item label="状态"><StatusBadge :status="req.status" /></el-descriptions-item>
      <el-descriptions-item label="申请人">{{ req.applicant.name }}</el-descriptions-item>
      <el-descriptions-item label="期望部署时间">{{ req.expected_date || '—' }}</el-descriptions-item>
      <el-descriptions-item label="环境说明" :span="2">{{ req.env_description }}</el-descriptions-item>
      <el-descriptions-item v-if="req.remarks" label="备注" :span="2">{{ req.remarks }}</el-descriptions-item>
    </el-descriptions>

    <!-- Approval result -->
    <el-card v-if="req.approval" style="margin-top:16px" header="审批记录">
      <p>结果：<el-tag :type="req.approval.action === 'approved' ? 'success' : 'danger'">{{ req.approval.action === 'approved' ? '通过' : '拒绝' }}</el-tag></p>
      <p v-if="req.approval.comment">意见：{{ req.approval.comment }}</p>
    </el-card>

    <!-- Resource config -->
    <el-card v-if="req.resource_config" style="margin-top:16px" header="部署资源配置">
      <p><strong>数据库配置：</strong>{{ req.resource_config.db_config }}</p>
      <p><strong>中间件版本：</strong>{{ req.resource_config.middleware_versions }}</p>
      <p><strong>网络策略：</strong>{{ req.resource_config.network_policy }}</p>
    </el-card>

    <!-- Feedback -->
    <el-card v-if="req.feedback" style="margin-top:16px" header="部署反馈">
      <p><strong>部署周期：</strong>{{ req.feedback.deploy_start }} 至 {{ req.feedback.deploy_end }}</p>
      <p><strong>部署总结：</strong>{{ req.feedback.summary }}</p>
    </el-card>

    <!-- Action: Tester provides resource (status=approved) -->
    <el-card v-if="role === 'tester' && req.status === 'approved'" style="margin-top:16px" header="填写资源配置">
      <el-form :model="resourceForm" label-width="120px">
        <el-form-item label="数据库配置"><el-input v-model="resourceForm.db_config" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="中间件版本"><el-input v-model="resourceForm.middleware_versions" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="网络策略"><el-input v-model="resourceForm.network_policy" type="textarea" :rows="2" /></el-form-item>
        <el-form-item><el-button type="primary" :loading="loading" @click="doSubmitResource">提交资源配置</el-button></el-form-item>
      </el-form>
    </el-card>

    <!-- Action: Tech support submits feedback (status=ready) -->
    <el-card v-if="role === 'tech_support' && req.status === 'ready'" style="margin-top:16px" header="填写部署反馈">
      <el-form :model="feedbackForm" label-width="120px">
        <el-form-item label="部署周期">
          <el-date-picker v-model="feedbackForm.deploy_start" type="date" placeholder="开始" style="width:180px" />
          <span style="margin:0 8px">至</span>
          <el-date-picker v-model="feedbackForm.deploy_end" type="date" placeholder="结束" style="width:180px" />
        </el-form-item>
        <el-form-item label="部署总结"><el-input v-model="feedbackForm.summary" type="textarea" :rows="4" /></el-form-item>
        <el-form-item><el-button type="primary" :loading="loading" @click="doSubmitFeedback">提交反馈</el-button></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRequest, submitResource, submitFeedback } from '@/api/requests'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const req = ref(null)
const loading = ref(false)
const role = computed(() => useAuthStore().role)
const envLabel = { dev: '开发', test: '测试', staging: '预生产', prod: '生产' }

const resourceForm = ref({ db_config: '', middleware_versions: '', network_policy: '' })
const feedbackForm = ref({ deploy_start: null, deploy_end: null, summary: '' })

async function load() {
  const { data } = await getRequest(route.params.id)
  req.value = data
}

async function doSubmitResource() {
  loading.value = true
  try {
    await submitResource(req.value.id, resourceForm.value)
    ElMessage.success('资源配置已提交')
    load()
  } finally { loading.value = false }
}

async function doSubmitFeedback() {
  loading.value = true
  try {
    await submitFeedback(req.value.id, feedbackForm.value)
    ElMessage.success('部署反馈已提交')
    router.push('/dashboard')
  } finally { loading.value = false }
}

onMounted(load)
</script>
```

- [ ] **Step 2: Manual end-to-end test**

Run through the full workflow:
1. Login as tech_support → create request
2. Login as pm → approve it
3. Login as tester → open request detail → fill resource config
4. Login as tech_support → open request detail (status=ready) → fill feedback
5. Verify final status = completed with all sub-records visible

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/RequestDetailView.vue
git commit -m "feat: add request detail view with contextual action forms"
```

---

## Task 14: Docker Compose Production Build

**Files:**
- Modify: `docker-compose.yml`
- Create: `nginx.conf`
- Create: `.gitignore`

- [ ] **Step 1: Write nginx.conf**

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Build frontend and test Docker Compose**

```bash
cd frontend && npm run build
cd ..
cp .env.example .env
# Edit .env: set DB_PASSWORD and SECRET_KEY
docker-compose up --build
```

Expected: app reachable at http://localhost

- [ ] **Step 3: Write .gitignore**

```
.env
frontend/node_modules/
frontend/dist/
backend/__pycache__/
backend/*.pyc
backend/test.db
```

- [ ] **Step 4: Final commit**

```bash
git add nginx.conf .gitignore
git commit -m "feat: add nginx config and finalize docker-compose production build"
```

---

## Done ✓

Full system is implemented when:
- All backend tests pass: `cd backend && pytest -v`
- Full workflow e2e works via browser
- `docker-compose up` serves the app on port 80
