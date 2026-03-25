# 部署资源申请系统 — 设计文档

**日期**：2026-03-25
**版本**：v1.2
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
    ├─ 通过 → 状态: approved → 广播通知所有测试人员
    └─ 拒绝 → 状态: rejected → 通知申请人（流程终止，需重新提交）
    ↓（通过）
测试人员 → [提供环境配置] → 状态: ready → 通知申请人
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
| `cancelled` | 申请人主动取消，流程终止，记录保留 |

### 状态转换规则（完整）

| 当前状态 | 允许的转换 | 执行角色 | 备注 |
|---|---|---|---|
| `pending` | → `approved` | pm | |
| `pending` | → `rejected` | pm | |
| `pending` | → `cancelled` | tech_support | 仅申请人可取消，记录保留 |
| `approved` | → `ready` | tester | |
| `ready` | → `completed` | tech_support | 仅当状态为 `ready` 时可提交反馈 |
| `rejected` | 无 | — | 流程终止，不可重新激活，需重新提交新申请 |
| `cancelled` | 无 | — | 流程终止，记录保留用于审计 |
| `completed` | 无 | — | 不可重新打开 |

---

## 4. 通知触发点

| 触发事件 | 通知对象 | 通知方式 |
|---|---|---|
| 申请提交 | 所有 `pm` 角色用户 | 企微/钉钉 Webhook 广播 |
| 审批通过 | 所有 `tester` 角色用户 | 企微/钉钉 Webhook 广播 |
| 审批拒绝 | 申请人（tech_support） | 企微/钉钉 Webhook |
| 资源就绪 | 申请人（tech_support） | 企微/钉钉 Webhook |
| 部署完成 | 所有 `pm` 角色用户 | 企微/钉钉 Webhook 广播 |

**广播策略**：通知发给对应角色的所有用户（小团队，广播可接受）。通知服务查询 `users` 表按 `role` 过滤，依次调用各用户的 `notification_handle` 发送消息。

---

## 5. 表单字段设计

### 5.1 申请单（技术支持填写）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| 申请编号 | 字符串 | 自动 | 格式：`REQ-YYYY-MMDD-NNN`，NNN 为全局自增序号，不按日期重置 |
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
id, username, password_hash,
role: tech_support | pm | tester,
name,
notification_platform: wechat | dingtalk,   # 通知平台选择
notification_handle,                          # 对应平台的 webhook/userid
created_at
```

### DeployRequest
```
id, req_no (UNIQUE, 全局自增),
project_name, product_version,
env_type: dev | test | staging | prod,
env_description, expected_date, remarks,
status: pending | approved | rejected | ready | completed | cancelled,
applicant_id (FK→User),
created_at, updated_at
```

### Approval
```
id,
request_id (FK→DeployRequest, UNIQUE),   # 每个申请只有一条审批记录
reviewer_id (FK→User),
action: approved | rejected,
comment,
created_at
```

### ResourceConfig
```
id,
request_id (FK→DeployRequest, UNIQUE),   # 每个申请只有一条资源配置
db_config, middleware_versions, network_policy,
provider_id (FK→User),
created_at, updated_at
```

### DeployFeedback
```
id,
request_id (FK→DeployRequest, UNIQUE),   # 每个申请只有一条反馈
deploy_start, deploy_end, summary,
submitter_id (FK→User),
created_at
```

---

## 8. 角色工作台

### 技术支持工作台
- 统计卡片：我的申请总数、待审批、待部署、已完成
- 申请列表：支持按 `status` 筛选，分页（page/limit），操作列显示当前可执行动作
- 新建申请入口；`pending` 状态的申请可修改或取消

### 项目经理工作台
- 待审批队列：显示所有 `pending` 状态申请，支持按 `status` 筛选，分页
- 审批操作：通过/拒绝 + 填写意见

### 测试人员工作台
- 待提供资源列表：显示所有 `approved` 状态申请，支持按 `status` 筛选，分页
- 资源配置填写入口
- 历史记录

---

## 9. API 设计（核心端点）

```
POST   /api/auth/register          # 注册（含 role 选择）
POST   /api/auth/login             # 登录（返回 JWT）

# 申请单 CRUD
GET    /api/requests               # 申请列表
                                   # 查询参数：?status=&page=1&limit=20
                                   # tech_support 只看自己的；pm/tester 看全部
POST   /api/requests               # 创建申请（tech_support）
GET    /api/requests/{id}          # 申请详情（含关联的审批/资源/反馈）
PUT    /api/requests/{id}          # 修改申请（tech_support，仅 status=pending）
POST   /api/requests/{id}/cancel   # 取消申请（tech_support，仅 status=pending）
                                   # 将 status 设为 cancelled，HTTP 200 返回更新后的申请

# 流程操作
POST   /api/requests/{id}/approve  # 审批（pm，仅 status=pending）
POST   /api/requests/{id}/resource # 提交资源配置（tester，仅 status=approved）
POST   /api/requests/{id}/feedback # 提交部署反馈（tech_support，仅 status=ready）
                                   # status≠ready 时返回 422
```

---

## 10. 权限规则

- `tech_support`：只能查看自己的申请；可创建、修改（pending）、取消（pending）、提交反馈（ready）
- `pm`：可查看所有申请；只能执行审批操作（pending）
- `tester`：可查看所有 approved/ready/completed 申请；只能填写资源配置（approved）
- 所有接口需要 JWT 鉴权，角色权限和状态前置条件在后端强制校验，不符合条件返回 `403` 或 `422`

---

## 11. 部署方式

- Docker Compose 单机部署（backend + frontend + postgresql）
- 企微/钉钉 Webhook URL 及通知配置通过环境变量注入
