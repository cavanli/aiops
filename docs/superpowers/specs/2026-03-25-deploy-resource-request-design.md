# 部署资源申请系统 — 设计文档

**日期**：2026-03-25
**版本**：v1.0
**状态**：已确认

---

## 1. 背景与目标

项目交付技术支持团队在日常工作中，部署资源的申请、审批、资源提供和反馈等环节分散在沟通工具中，缺乏结构化记录，导致流程追溯困难。本系统旨在将该流程线上化，实现端到端可追踪的部署资源申请闭环。

---

## 2. 用户角色

| 角色 | 标识 | 职责 |
|---|---|---|
| 技术支持 | `tech_support` | 发起申请、执行部署、填写反馈 |
| 项目经理 | `pm` | 审批申请 |
| 测试人员 | `tester` | 提供环境配置资源 |

用户注册时自助选择角色，无需管理员分配。

---

## 3. 工作流

```
技术支持 → [发起申请] → 状态: pending
    ↓
项目经理 → [审批]
    ├─ 通过 → 状态: approved → 通知测试人员
    └─ 拒绝 → 状态: rejected → 通知技术支持
    ↓（通过）
测试人员 → [提供环境配置] → 状态: ready → 通知技术支持
    ↓
技术支持 → [部署 + 填写反馈] → 状态: completed → 通知项目经理
```

### 状态定义

| 状态 | 含义 |
|---|---|
| `pending` | 已提交，等待项目经理审批 |
| `approved` | 审批通过，等待测试提供资源 |
| `rejected` | 审批拒绝，流程终止 |
| `ready` | 资源已就绪，等待技术支持部署 |
| `completed` | 部署完成，流程结束 |

---

## 4. 通知触发点

| 触发事件 | 通知对象 | 通知方式 |
|---|---|---|
| 申请提交 | 项目经理 | 企微/钉钉 Webhook |
| 审批通过 | 测试人员 | 企微/钉钉 Webhook |
| 审批拒绝 | 申请人（技术支持） | 企微/钉钉 Webhook |
| 资源就绪 | 申请人（技术支持） | 企微/钉钉 Webhook |
| 部署完成 | 项目经理 | 企微/钉钉 Webhook |

---

## 5. 表单字段设计

### 5.1 申请单（技术支持填写）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 申请编号 | 字符串 | 自动 | 格式：`REQ-YYYY-MMDD-NNN`，系统生成 |
| 项目名称 | 字符串 | 是 | |
| 申请产品版本 | 字符串 | 是 | 如 `v2.3.1` |
| 部署环境类型 | 枚举 | 是 | 开发/测试/预生产/生产 |
| 部署环境说明 | 文本 | 是 | 描述环境现状和特殊约束 |
| 期望部署时间 | 日期 | 否 | |
| 备注 | 文本 | 否 | |

### 5.2 审批表单（项目经理填写）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 审批动作 | 枚举 | 是 | 通过 / 拒绝 |
| 审批意见 | 文本 | 否 | |

### 5.3 资源配置表（测试人员填写）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 数据库配置 | 文本 | 是 | 类型、版本、连接信息 |
| 中间件版本 | 文本 | 是 | Redis、MQ、Nginx 等版本信息 |
| 网络策略 | 文本 | 是 | 防火墙规则、端口开放情况 |

### 5.4 部署反馈表（技术支持填写）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 部署开始时间 | 日期 | 是 | |
| 部署结束时间 | 日期 | 是 | |
| 部署总结 | 文本 | 是 | 部署过程描述和结果说明 |

---

## 6. 技术架构

### 6.1 技术栈

| 层级 | 技术选型 |
|---|---|
| 前端 | Vue 3 + Vite + Element Plus + Vue Router + Pinia + Axios |
| 后端 | Python FastAPI + SQLAlchemy + Pydantic + JWT |
| 数据库 | PostgreSQL + Alembic（数据库迁移） |
| 通知 | 企微/钉钉 Webhook（httpx 异步推送） |

### 6.2 项目结构

```
deploy-request-system/
├── backend/
│   ├── app/
│   │   ├── api/          # 路由层（requests, auth, users）
│   │   ├── models/       # SQLAlchemy 数据模型
│   │   ├── schemas/      # Pydantic 请求/响应模型
│   │   ├── services/     # 业务逻辑（workflow, notification）
│   │   └── core/         # 配置、JWT、依赖注入
│   ├── alembic/          # 数据库迁移
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── views/        # 页面（申请列表、申请详情、各角色工作台）
│   │   ├── components/   # 通用组件
│   │   ├── stores/       # Pinia 状态（用户、申请）
│   │   ├── router/       # 路由 + 角色守卫
│   │   └── api/          # Axios 封装
│   └── vite.config.js
└── docker-compose.yml
```

---

## 7. 数据模型

### User
```
id, username, password_hash, role (tech_support|pm|tester),
name, wechat_id, created_at
```

### DeployRequest
```
id, req_no, project_name, product_version,
env_type, env_description, expected_date, remarks,
status (pending|approved|rejected|ready|completed),
applicant_id (FK→User), created_at, updated_at
```

### Approval
```
id, request_id (FK→DeployRequest), reviewer_id (FK→User),
action (approved|rejected), comment, created_at
```

### ResourceConfig
```
id, request_id (FK→DeployRequest),
db_config, middleware_versions, network_policy,
provider_id (FK→User), created_at
```

### DeployFeedback
```
id, request_id (FK→DeployRequest),
deploy_start, deploy_end, summary,
submitter_id (FK→User), created_at
```

---

## 8. 角色工作台

### 技术支持工作台
- 统计卡片：我的申请总数、待审批、待部署、已完成
- 申请列表：可筛选状态，操作列显示当前可执行动作（新建/填写反馈/查看详情）
- 新建申请入口

### 项目经理工作台
- 待审批队列：显示所有 `pending` 状态申请
- 全部申请历史：按状态筛选
- 审批操作：通过/拒绝 + 填写意见

### 测试人员工作台
- 待提供资源列表：显示所有 `approved` 状态申请
- 资源配置填写入口
- 历史记录

---

## 9. API 设计（核心端点）

```
POST   /api/auth/register          # 注册
POST   /api/auth/login             # 登录（返回JWT）

GET    /api/requests               # 申请列表（按角色过滤）
POST   /api/requests               # 创建申请（tech_support）
GET    /api/requests/{id}          # 申请详情

POST   /api/requests/{id}/approve  # 审批（pm）
POST   /api/requests/{id}/resource # 提交资源配置（tester）
POST   /api/requests/{id}/feedback # 提交部署反馈（tech_support）
```

---

## 10. 权限规则

- `tech_support`：只能查看和操作自己的申请；可创建申请、提交反馈
- `pm`：可查看所有申请；只能执行审批操作
- `tester`：可查看已审批的申请；只能填写资源配置
- 所有接口需要 JWT 鉴权，角色权限在后端强制校验

---

## 11. 部署方式

- Docker Compose 单机部署（backend + frontend + postgresql）
- 企微/钉钉 Webhook URL 通过环境变量配置
