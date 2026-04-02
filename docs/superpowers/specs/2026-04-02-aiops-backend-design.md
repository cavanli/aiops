# AIOps 部署中台 - 后端设计文档 v1.0

> 日期：2026-04-02  
> 范围：MVP v1.0 后端（Go + PostgreSQL）  
> 技术栈：Go + Gin + GORM + PostgreSQL + Redis  

---

## 1. 项目结构

采用**经典分层架构**：Handler → Service → Repository → Model

```
AIops/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── internal/
│   │   ├── handler/
│   │   │   ├── auth_handler.go
│   │   │   ├── user_handler.go
│   │   │   ├── host_handler.go
│   │   │   ├── model_handler.go
│   │   │   ├── workflow_handler.go
│   │   │   └── deployment_handler.go
│   │   ├── service/
│   │   │   ├── auth_service.go
│   │   │   ├── user_service.go
│   │   │   ├── host_service.go
│   │   │   ├── model_service.go
│   │   │   ├── workflow_service.go
│   │   │   └── deployment_service.go
│   │   ├── repository/
│   │   │   ├── user_repo.go
│   │   │   ├── host_repo.go
│   │   │   ├── model_repo.go
│   │   │   ├── workflow_repo.go
│   │   │   └── deployment_repo.go
│   │   ├── model/
│   │   │   ├── user.go
│   │   │   ├── host.go
│   │   │   ├── model.go
│   │   │   ├── workflow.go
│   │   │   └── deployment.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   ├── cors.go
│   │   │   └── logger.go
│   │   └── pkg/
│   │       ├── config/
│   │       ├── database/
│   │       ├── redis/
│   │       ├── jwt/
│   │       └── response/
│   ├── migrations/
│   ├── go.mod
│   └── go.sum
└── frontend/                   # 前端（后续迭代）
```

**分层职责：**
- **Handler**：参数校验、响应格式化，不含业务逻辑
- **Service**：所有业务规则，调用 Repository 和外部服务
- **Repository**：封装 GORM 数据库操作
- **Model**：GORM 数据结构定义

---

## 2. 数据库设计

### 2.1 用户权限模块

```sql
-- 用户表
users (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(64) UNIQUE NOT NULL,
  email         VARCHAR(128) UNIQUE NOT NULL,
  password_hash VARCHAR(256) NOT NULL,
  role          VARCHAR(32) NOT NULL DEFAULT 'viewer',  -- admin/operator/viewer
  status        VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- 审计日志表
audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  action        VARCHAR(32) NOT NULL,   -- create/update/delete/execute
  resource_type VARCHAR(64) NOT NULL,   -- host/workflow/deployment/model
  resource_id   VARCHAR(64),
  details       JSONB,
  ip            VARCHAR(64),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

### 2.2 主机管理模块

```sql
-- 主机表
hosts (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(128) NOT NULL,
  ip           VARCHAR(64) NOT NULL,
  port         INT NOT NULL DEFAULT 22,
  ssh_user     VARCHAR(64) NOT NULL,
  ssh_key      TEXT,                    -- AES-256 加密存储
  status       VARCHAR(16) DEFAULT 'unknown',  -- online/offline/unknown
  env          VARCHAR(32),             -- production/staging/dev
  tags         JSONB DEFAULT '[]',
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- 主机组表
host_groups (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(128) NOT NULL,
  description  TEXT,
  host_ids     JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- 主机环境变量表
host_env_vars (
  id           BIGSERIAL PRIMARY KEY,
  host_id      BIGINT NOT NULL REFERENCES hosts(id),
  key          VARCHAR(256) NOT NULL,
  value        TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

### 2.3 模型广场模块

```sql
-- 模型表
models (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(128) NOT NULL,
  provider     VARCHAR(64) NOT NULL,    -- openai/anthropic/deepseek/qwen/custom
  model_type   VARCHAR(32) NOT NULL,    -- chat/embedding
  api_endpoint VARCHAR(512),           -- 自定义模型端点
  description  TEXT,
  status       VARCHAR(16) DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- API Key 表
api_keys (
  id             BIGSERIAL PRIMARY KEY,
  model_id       BIGINT NOT NULL REFERENCES models(id),
  key_name       VARCHAR(128) NOT NULL,
  encrypted_key  TEXT NOT NULL,         -- AES-256 加密存储
  quota          BIGINT DEFAULT 0,      -- 0 = 不限制
  used_count     BIGINT DEFAULT 0,
  status         VARCHAR(16) DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

### 2.4 工作流模块

```sql
-- 工作流表
workflows (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(128) NOT NULL,
  description  TEXT,
  nodes        JSONB NOT NULL DEFAULT '[]',   -- 节点列表
  edges        JSONB NOT NULL DEFAULT '[]',   -- 连线列表
  status       VARCHAR(16) DEFAULT 'draft',   -- draft/active/inactive
  created_by   BIGINT NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- 工作流执行记录
workflow_executions (
  id           BIGSERIAL PRIMARY KEY,
  workflow_id  BIGINT NOT NULL REFERENCES workflows(id),
  status       VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending/running/success/failed/cancelled
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  logs         JSONB DEFAULT '[]',
  created_by   BIGINT NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

### 2.5 部署执行模块

```sql
-- 部署模板表
deployment_templates (
  id             BIGSERIAL PRIMARY KEY,
  name           VARCHAR(128) NOT NULL,
  description    TEXT,
  script_type    VARCHAR(32) NOT NULL,   -- shell/python/helm/docker-compose
  script_content TEXT NOT NULL,
  params         JSONB DEFAULT '{}',
  health_check   JSONB,                  -- 健康检查配置
  created_by     BIGINT NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

-- 部署任务表
deployment_tasks (
  id           BIGSERIAL PRIMARY KEY,
  template_id  BIGINT REFERENCES deployment_templates(id),
  host_ids     JSONB NOT NULL DEFAULT '[]',   -- 目标主机列表
  params       JSONB DEFAULT '{}',            -- 运行时参数
  strategy     VARCHAR(32) DEFAULT 'fail_fast',  -- fail_fast/continue_on_failure
  status       VARCHAR(16) NOT NULL DEFAULT 'pending',
  logs         JSONB DEFAULT '[]',
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  created_by   BIGINT NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

---

## 3. API 设计

基于 `/api/v1/{module}/{resource}` 规范。

### 认证
| Method | Path | 描述 |
|--------|------|------|
| POST | /api/v1/auth/register | 注册 |
| POST | /api/v1/auth/login | 登录 |
| POST | /api/v1/auth/refresh | 刷新 Token |
| POST | /api/v1/auth/logout | 登出 |

### 用户管理
| Method | Path | 描述 |
|--------|------|------|
| GET | /api/v1/users | 用户列表（分页） |
| GET | /api/v1/users/:id | 用户详情 |
| PUT | /api/v1/users/:id | 更新用户 |
| DELETE | /api/v1/users/:id | 删除用户 |
| GET | /api/v1/audit-logs | 审计日志 |

### 主机管理
| Method | Path | 描述 |
|--------|------|------|
| GET | /api/v1/hosts | 主机列表 |
| POST | /api/v1/hosts | 注册主机 |
| GET | /api/v1/hosts/:id | 主机详情 |
| PUT | /api/v1/hosts/:id | 更新主机 |
| DELETE | /api/v1/hosts/:id | 删除主机 |
| POST | /api/v1/hosts/:id/test | 测试连接 |
| GET | /api/v1/host-groups | 主机组列表 |
| POST | /api/v1/host-groups | 创建主机组 |

### 模型广场
| Method | Path | 描述 |
|--------|------|------|
| GET | /api/v1/models | 模型列表 |
| POST | /api/v1/models | 添加模型 |
| GET | /api/v1/models/:id | 模型详情 |
| PUT | /api/v1/models/:id | 更新模型 |
| DELETE | /api/v1/models/:id | 删除模型 |
| POST | /api/v1/models/:id/test | 测试模型 |
| GET | /api/v1/api-keys | API Key 列表 |
| POST | /api/v1/api-keys | 创建 API Key |
| DELETE | /api/v1/api-keys/:id | 删除 API Key |

### 工作流
| Method | Path | 描述 |
|--------|------|------|
| GET | /api/v1/workflows | 工作流列表 |
| POST | /api/v1/workflows | 创建工作流 |
| GET | /api/v1/workflows/:id | 工作流详情 |
| PUT | /api/v1/workflows/:id | 更新工作流 |
| DELETE | /api/v1/workflows/:id | 删除工作流 |
| POST | /api/v1/workflows/:id/execute | 执行工作流 |
| GET | /api/v1/workflow-executions | 执行记录列表 |
| GET | /api/v1/workflow-executions/:id | 执行详情 |

### 部署执行
| Method | Path | 描述 |
|--------|------|------|
| GET | /api/v1/deployment-templates | 模板列表 |
| POST | /api/v1/deployment-templates | 创建模板 |
| GET | /api/v1/deployment-templates/:id | 模板详情 |
| PUT | /api/v1/deployment-templates/:id | 更新模板 |
| DELETE | /api/v1/deployment-templates/:id | 删除模板 |
| POST | /api/v1/deployments | 创建部署任务 |
| GET | /api/v1/deployments | 部署任务列表 |
| GET | /api/v1/deployments/:id | 部署详情 |
| POST | /api/v1/deployments/:id/cancel | 取消部署 |

**统一响应格式：**
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

---

## 4. 认证授权

### JWT 机制
- **Access Token**：15 分钟有效期
- **Refresh Token**：7 天有效期，存储于 Redis
- **Claims 结构**：user_id、username、role

### RBAC 角色
| 角色 | 主机管理 | 部署执行 | 工作流 | 模型广场 | 系统配置 |
|------|---------|---------|-------|---------|---------|
| admin | 全部 | 全部 | 全部 | 全部 | 全部 |
| operator | 全部 | 全部 | 全部 | 查看 | 无 |
| viewer | 查看 | 无 | 无 | 查看 | 无 |

### 安全措施
- 密码：bcrypt (cost=12) 加密存储
- API Key：AES-256-GCM 加密存储
- SSH Key：AES-256-GCM 加密存储
- 审计日志：所有写操作（POST/PUT/DELETE）自动记录

---

## 5. 错误处理

### 错误码
```
0      - 成功
40001  - 参数错误
40101  - 未认证
40301  - 无权限
40401  - 资源不存在
40901  - 资源冲突
50001  - 服务器内部错误
50002  - 数据库错误
50003  - 外部服务错误
```

### 日志
- **框架**：zap
- **格式**：JSON 结构化日志
- **输出**：控制台 + 按日期轮转文件

---

## 6. 部署执行引擎

### 任务状态机
```
pending → running → success
                 → failed
                 → cancelled
```

### 核心流程
1. 接收部署任务（模板 + 目标主机列表 + 参数）
2. 任务入队（内存队列，后续可换 Redis Queue）
3. Worker Pool（默认 10 个 Worker）并发执行
4. 每主机：解密 SSH Key → 建立 SSH 连接 → 执行脚本 → 采集日志
5. 结果写回数据库
6. 执行健康检查（HTTP/TCP/Shell）
7. SSE 实时推送日志到前端

### 失败策略
- `fail_fast`：第一台失败立即停止所有任务
- `continue_on_failure`：失败后继续其他主机

### 健康检查
```json
{
  "type": "http",       // http / tcp / shell
  "target": "http://localhost:8080/health",
  "timeout": 30,
  "retries": 3
}
```

---

## 7. 技术依赖

| 用途 | 依赖 |
|------|------|
| HTTP 框架 | github.com/gin-gonic/gin |
| ORM | gorm.io/gorm + gorm.io/driver/postgres |
| JWT | github.com/golang-jwt/jwt/v5 |
| 日志 | go.uber.org/zap |
| 配置 | github.com/spf13/viper |
| Redis | github.com/redis/go-redis/v9 |
| SSH | golang.org/x/crypto/ssh |
| 加密 | crypto/aes (标准库) |
| 校验 | github.com/go-playground/validator/v10 |

---

## 8. MVP 实现顺序

1. **基础框架**：项目初始化、配置、数据库连接、日志、统一响应
2. **用户认证**：注册、登录、JWT 中间件、RBAC
3. **主机管理**：主机 CRUD、SSH 连接测试、主机组
4. **模型广场**：模型 CRUD、API Key 管理（加密存储）
5. **工作流**：工作流 CRUD、执行引擎（基础版）
6. **部署执行**：部署模板、SSH 执行引擎、健康检查、任务日志
