# AIOps Backend Plan 6: Docker Compose Local Dev Environment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the AIOps backend into a Docker Compose stack so any developer can run `docker compose up` and get a fully working environment (PostgreSQL + Redis + Go API) within minutes.

**Architecture:** Multi-stage Dockerfile (builder stage + distroless runtime). Docker Compose defines three services: `postgres`, `redis`, `api`. The backend reads config from environment variables already handled by `internal/pkg/config`. No code changes needed — only infrastructure files.

**Tech Stack:** Docker 24+, Docker Compose v2, Go 1.22 multi-stage build, PostgreSQL 15, Redis 7

---

## File Map

```
AIops/
├── backend/
│   ├── Dockerfile                   # Multi-stage build: builder + runtime
│   └── .dockerignore                # Exclude bin/, *.exe, test caches
├── docker-compose.yml               # Services: postgres, redis, api
├── docker-compose.override.yml      # Dev-only overrides (hot reload, volume mounts)
└── .env.example                     # Updated with Docker-friendly defaults
```

---

## Task 1: Dockerfile (multi-stage build)

**Files:**
- Create: `AIops/backend/Dockerfile`
- Create: `AIops/backend/.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# AIops/backend/Dockerfile

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

# Install build dependencies for CGO (needed by go-sqlite in tests, but api
# binary uses pure-Go postgres driver so CGO_ENABLED=0 is fine for production)
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/api ./cmd/api

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM gcr.io/distroless/static:nonroot

COPY --from=builder /app/api /api

EXPOSE 8080

ENTRYPOINT ["/api"]
```

- [ ] **Step 2: Create .dockerignore**

```
bin/
*.exe
*.test
*.out
.git/
.gitignore
docs/
```

- [ ] **Step 3: Verify Docker build locally**

```bash
cd e:/Opsgit/AIops/backend
docker build -t aiops-api:local .
```

Expected: Image builds successfully. Final image is ~20MB.

- [ ] **Step 4: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add Dockerfile .dockerignore
git commit -m "feat: add multi-stage Dockerfile for production build"
```

---

## Task 2: docker-compose.yml

**Files:**
- Create: `AIops/docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
# AIops/docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-aiops}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-aiops123}
      POSTGRES_DB: ${DB_NAME:-aiops}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-aiops} -d ${DB_NAME:-aiops}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "${APP_PORT:-8080}:8080"
    environment:
      APP_ENV: ${APP_ENV:-development}
      APP_PORT: "8080"
      DB_HOST: postgres
      DB_PORT: "5432"
      DB_USER: ${DB_USER:-aiops}
      DB_PASSWORD: ${DB_PASSWORD:-aiops123}
      DB_NAME: ${DB_NAME:-aiops}
      DB_SSLMODE: disable
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production-min-32-chars}
      JWT_ACCESS_TTL: ${JWT_ACCESS_TTL:-15m}
      JWT_REFRESH_TTL: ${JWT_REFRESH_TTL:-168h}
      CRYPTO_KEY: ${CRYPTO_KEY:-change-me-32-byte-key-for-aes256!}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit/AIops
git add docker-compose.yml
git commit -m "feat: add Docker Compose stack with postgres, redis, and api services"
```

---

## Task 3: .env.example update and Makefile docker targets

**Files:**
- Modify: `AIops/backend/.env.example`
- Modify: `AIops/backend/Makefile`

- [ ] **Step 1: Update .env.example with Docker-friendly comments**

Replace `AIops/backend/.env.example` with:

```env
# Application
APP_ENV=development
APP_PORT=8080

# Database (when running locally without Docker, point to localhost)
# When running inside Docker Compose, DB_HOST is set to "postgres" by compose
DB_HOST=localhost
DB_PORT=5432
DB_USER=aiops
DB_PASSWORD=aiops123
DB_NAME=aiops
DB_SSLMODE=disable

# Redis (when running locally without Docker, point to localhost)
# When running inside Docker Compose, REDIS_HOST is set to "redis" by compose
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT — generate a secure secret: openssl rand -hex 32
JWT_SECRET=change-me-in-production-min-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h

# AES-256 encryption key — must be exactly 32 bytes
# Generate: openssl rand -hex 16 | cut -c1-32
CRYPTO_KEY=change-me-32-byte-key-for-aes256!
```

- [ ] **Step 2: Add Docker targets to Makefile**

Replace `AIops/backend/Makefile` with:

```makefile
.PHONY: run build test lint tidy docker-build docker-up docker-down docker-logs

run:
	go run ./cmd/api/...

build:
	go build -o bin/api ./cmd/api/...

test:
	go test ./... -v -count=1

lint:
	golangci-lint run

tidy:
	go mod tidy

# Docker targets (run from AIops/ root, not backend/)
docker-build:
	cd .. && docker compose build

docker-up:
	cd .. && docker compose up -d

docker-down:
	cd .. && docker compose down

docker-logs:
	cd .. && docker compose logs -f api
```

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit/AIops/backend
git add .env.example Makefile
git commit -m "feat: update env example and add docker make targets"
```

---

## Task 4: Smoke test the stack

**Files:**
- No new files

- [ ] **Step 1: Start the stack**

```bash
cd e:/Opsgit/AIops
docker compose up -d
```

Expected: Three containers start. `docker compose ps` shows all services as `healthy`.

- [ ] **Step 2: Verify API health endpoint**

```bash
curl http://localhost:8080/health
```

Expected:
```json
{"status":"ok"}
```

- [ ] **Step 3: Verify register endpoint works end-to-end**

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234!","email":"admin@example.com","role":"admin"}'
```

Expected:
```json
{"code":0,"message":"success","data":{"token":"...","refresh_token":"..."}}
```

- [ ] **Step 4: Stop the stack**

```bash
cd e:/Opsgit/AIops
docker compose down
```

- [ ] **Step 5: Commit smoke test results (no code changes; tag the milestone)**

```bash
cd e:/Opsgit/AIops
git add .
git commit -m "feat: verify Docker Compose stack smoke test passes"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Docker Compose with PostgreSQL 15 ✓
- [x] Docker Compose with Redis 7 ✓
- [x] Multi-stage Dockerfile (builder + distroless) ✓
- [x] Environment variable driven config (no hardcoded secrets) ✓
- [x] Health checks on postgres and redis before api starts ✓
- [x] Makefile docker targets ✓
- [x] Smoke test: health endpoint + register endpoint ✓

**No Placeholders:** All steps contain exact file content.

**Type Consistency:** No Go code changes — infra files only.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-03-aiops-backend-plan6-docker-compose.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
