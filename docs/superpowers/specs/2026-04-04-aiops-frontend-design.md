# AIOps 部署中台 — 前端设计规范 v1.0

> 日期：2026-04-04
> 作者：lizhen
> 状态：已确认

---

## 1. 概述

基于 PRD v1.0，为 AIOps 部署中台构建 React 单页应用，覆盖 MVP 全部 5 个功能模块。

**目标用户**：企业运维工程师、DevOps、SRE  
**设计风格**：扁平化，简洁现代，与 Ant Design 默认风格一致

---

## 2. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vite | 5 | 构建工具 |
| React | 18 | UI 框架 |
| TypeScript | 5 | 类型安全 |
| Ant Design | 5 | UI 组件库 |
| React Router | v6 | 路由 |
| Zustand | latest | Auth 状态（仅） |
| TanStack Query | v5 | 服务器状态管理 |
| Axios | latest | HTTP 客户端（已完成） |
| ReactFlow | latest | 工作流可视化画布 |

---

## 3. 设计规范

### 3.1 配色

| 名称 | 值 |
|------|-----|
| 主色（Primary） | `#2563EB` |
| 背景（Layout BG） | `#F8FAFC` |
| 文字（Primary Text） | `#1E293B` |
| 次要文字 | `#64748B` |
| 边框 | `#E2E8F0` |
| 成功 | `#10B981` |
| 警告 | `#F59E0B` |
| 危险 | `#EF4444` |

### 3.2 圆角 & 间距

- 圆角：8px（卡片、按钮、抽屉）
- 间距基准：8px 网格

### 3.3 Ant Design 主题配置

```typescript
theme: {
  token: {
    colorPrimary: '#2563EB',
    borderRadius: 8,
    colorBgLayout: '#F8FAFC',
  }
}
```

---

## 4. 布局

### 4.1 整体框架

```
┌─────────────────────────────────────────────┐
│  Sider (220px, 可折叠)  │  Header (64px)     │
│  ┌──────────────────┐  │  ─────────────────  │
│  │ Logo: AIOps      │  │  ≡  [User ▾]        │
│  ├──────────────────┤  ├─────────────────────┤
│  │ 概览             │  │                     │
│  │ 主机管理          │  │   Content Area      │
│  │ 模型广场          │  │   (bg: #F8FAFC)     │
│  │ 工作流            │  │                     │
│  │ 部署执行          │  │                     │
│  └──────────────────┘  └─────────────────────┘
```

- Sider：白色背景，右边框 `#E2E8F0`，可折叠（collapse trigger 在 Header 左侧）
- Header：白色背景，下边框 `#E2E8F0`，高度 64px，右侧显示用户名 + 头像下拉（含退出登录）
- Content：`margin: 24px`，内部白色卡片 `border-radius: 8px`

### 4.2 用户下拉菜单

Header 右侧 Avatar + 用户名，点击展开：
- 退出登录 → 调用 `POST /api/v1/auth/logout`，清除 Zustand Auth，跳转 `/login`

---

## 5. 路由设计

```
/login                    → Login（无需认证）
/                         → AppLayout（AuthGuard 保护）
  index                   → Dashboard
  /hosts                  → 主机管理（列表 + 右侧抽屉）
  /models                 → 模型广场（列表 + 右侧抽屉）
  /workflows              → 工作流列表
  /workflows/:id/edit     → WorkflowEditor（ReactFlow 全屏，独立页面）
  /deployments            → 部署执行（Tab: 部署模板 | 部署任务）
*                         → redirect to /
```

**AuthGuard**：检查 Zustand `isAuthenticated()`，未认证则 `<Navigate to="/login" replace />`

---

## 6. 文件结构

```
AIops/frontend/src/
├── api/
│   ├── client.ts          # Axios 实例 + interceptors（已完成）
│   ├── dashboard.ts       # GET /stats, GET /recent-activity
│   ├── hosts.ts           # CRUD + testConnection
│   ├── models.ts          # CRUD + testModel
│   ├── workflows.ts       # CRUD + execute
│   └── deployments.ts     # templates CRUD + tasks CRUD + cancel
├── features/
│   ├── hosts/
│   │   ├── HostList.tsx       # Ant Design Table
│   │   ├── HostDrawer.tsx     # 新建/编辑抽屉
│   │   └── useHosts.ts        # React Query hooks
│   ├── models/
│   │   ├── ModelList.tsx
│   │   ├── ModelDrawer.tsx
│   │   └── useModels.ts
│   ├── workflows/
│   │   ├── WorkflowList.tsx
│   │   ├── WorkflowCanvas.tsx  # ReactFlow 画布组件
│   │   ├── NodePalette.tsx     # 左侧节点面板
│   │   ├── NodeProperties.tsx  # 右侧属性面板
│   │   └── useWorkflows.ts
│   └── deployments/
│       ├── TemplateList.tsx
│       ├── TemplateDrawer.tsx
│       ├── TaskList.tsx
│       ├── TaskLogDrawer.tsx   # 部署日志查看（轮询）
│       └── useDeployments.ts
├── layouts/
│   └── AppLayout.tsx           # Sider + Header + Outlet
├── pages/
│   ├── Dashboard.tsx
│   ├── Hosts.tsx
│   ├── Models.tsx
│   ├── Workflows.tsx
│   ├── WorkflowEditor.tsx      # 全屏 ReactFlow 页面
│   └── Deployments.tsx
├── store/
│   └── authStore.ts            # Zustand（已完成）
├── types/
│   ├── auth.ts                 # 已完成
│   ├── host.ts
│   ├── model.ts
│   ├── workflow.ts
│   └── deployment.ts
├── App.tsx                     # Router + ConfigProvider
└── main.tsx                    # Entry
```

---

## 7. 各模块页面设计

### 7.1 概览页（Dashboard）

**URL**：`/`

**内容**：
1. 统计卡片行（4 列）：主机总数 / 模型接入数 / 进行中部署数 / 工作流数
   - 数据来源：`GET /api/v1/dashboard/stats`（待后端实现，前端先用各列表 count 拼凑）
2. 最近部署活动列表：名称 / 目标主机 / 状态（成功/进行中/失败）/ 时间
   - 数据来源：`GET /api/v1/deployments?limit=10&sort=created_at:desc`

**交互**：点击活动行跳转到 `/deployments`

### 7.2 主机管理（Hosts）

**URL**：`/hosts`

**列表字段**：主机名 / IP 地址 / SSH 端口 / 认证方式 / 状态 / 操作

**操作**：
- 搜索（主机名/IP，前端过滤）
- 添加主机 → 打开 Drawer（editingItem = null）
- 编辑 → 打开 Drawer（editingItem = row）
- 删除 → Popconfirm 确认后删除
- 测试连接 → 调用 `POST /api/v1/hosts/:id/test`，Toast 显示结果

**Drawer 字段**：
- 主机名（必填）
- IP 地址（必填）
- SSH 端口（默认 22）
- 认证方式：密码 / SSH Key（Select 切换）
- 用户名（必填）
- 密码 或 SSH 私钥（textarea，密钥存储时脱敏展示）
- 描述（可选）

**敏感字段规则**：编辑已有主机时，SSH Key/密码字段显示 `••••••••`，提供"重新输入"按钮点击后才清空并可编辑。

### 7.3 模型广场（Models）

**URL**：`/models`

**列表字段**：名称 / Provider / 模型类型 / Endpoint / 状态 / 操作

**操作**：
- 添加模型 → Drawer
- 编辑 → Drawer
- 删除 → Popconfirm
- 测试模型 → `POST /api/v1/models/:id/test`，Toast 显示延迟 ms

**Drawer 字段**：
- 名称（必填）
- Provider（Select：openai / anthropic / deepseek / qwen / custom）
- 模型类型（Select：chat / embedding）
- Model ID（必填，如 `gpt-4o`）
- Endpoint（自定义时必填）
- API Key（必填，编辑时脱敏，提供"重新输入"按钮）
- 状态（Switch：启用/禁用）

### 7.4 工作流（Workflows）

**URL**：`/workflows`

**列表字段**：名称 / 状态（draft/active）/ 节点数 / 最近执行时间 / 操作

**操作**：
- 新建工作流 → Drawer 填写基础信息（名称、描述），创建后跳转 `/workflows/:id/edit`
- 编辑（设计）→ 跳转 `/workflows/:id/edit`
- 执行 → `POST /api/v1/workflows/:id/execute`，Toast 提示
- 删除 → Popconfirm

**Drawer 字段**（新建时）：名称（必填）/ 描述

---

### 7.5 工作流编辑器（WorkflowEditor）

**URL**：`/workflows/:id/edit`

**布局**：全屏，脱离 AppLayout（独立路由，不嵌套在 AppLayout 下）

```
┌────────────────────────────────────────────────────────┐
│ 面包屑: 工作流 › 名称     [保存草稿]  [发布]    [返回]  │
├─────────────┬──────────────────────────────────────────┤
│ 节点面板     │                                          │
│ (120px)     │           ReactFlow 画布                  │
│             │                                          │
│ Shell脚本   │   [开始] → [节点1] → [节点2] → [结束]     │
│ HTTP请求    │                                          │
│ LLM调用     │                                          │
│ 条件分支    │                                          │
│             │                           [节点属性面板]  │
│             │                           (点击节点展开)  │
└─────────────┴──────────────────────────────────────────┘
```

**节点类型**（MVP）：

| 类型 | 说明 |
|------|------|
| start | 开始节点（每个工作流只有一个） |
| end | 结束节点 |
| shell | Shell 脚本（命令字符串，选择执行主机） |
| http | HTTP 请求（method/url/headers/body） |
| llm | LLM 调用（选择模型，prompt 模板） |
| condition | 条件分支（JS 表达式，true/false 两条边） |

**数据交互**：
- 加载：`GET /api/v1/workflows/:id` → 取 `nodes`/`edges` 字段初始化 ReactFlow
- 保存：`PUT /api/v1/workflows/:id` 提交 `{nodes, edges, status}`
- 保存草稿：status = draft
- 发布：status = active

### 7.6 部署执行（Deployments）

**URL**：`/deployments`

**Tab 结构**：部署模板 | 部署任务

**部署模板 Tab**：
- 列表字段：名称 / 类型（shell/helm/docker-compose）/ 描述 / 操作
- 添加/编辑 → Drawer（名称、类型、脚本内容 textarea）
- 删除 → Popconfirm

**部署任务 Tab**：
- 列表字段：模板名 / 目标主机 / 状态 / 开始时间 / 耗时 / 操作
- 新建部署 → Drawer（选择模板、选择目标主机列表、fail-fast 策略）
- 取消 → `POST /api/v1/deployments/:id/cancel`（仅 pending/running 状态）
- 查看日志 → TaskLogDrawer（轮询 `GET /api/v1/deployments/:id`，每 3 秒刷新，`<pre>` 展示 logs 字段）

---

## 8. API 层规范

```typescript
// api/hosts.ts 示例
export const hostsApi = {
  list: () => client.get<ApiResponse<Host[]>>('/api/v1/hosts'),
  get: (id: number) => client.get<ApiResponse<Host>>(`/api/v1/hosts/${id}`),
  create: (data: CreateHostRequest) => client.post<ApiResponse<Host>>('/api/v1/hosts', data),
  update: (id: number, data: UpdateHostRequest) => client.put<ApiResponse<Host>>(`/api/v1/hosts/${id}`, data),
  delete: (id: number) => client.delete(`/api/v1/hosts/${id}`),
  testConnection: (id: number) => client.post<ApiResponse<{latency_ms: number}>>(`/api/v1/hosts/${id}/test`),
}
```

所有模块遵循同一模式，`ApiResponse<T>` 类型已在 `types/auth.ts` 定义。

---

## 9. React Query 规范

```typescript
// features/hosts/useHosts.ts 示例
export function useHosts() {
  return useQuery({ queryKey: ['hosts'], queryFn: () => hostsApi.list().then(r => r.data.data) })
}

export function useCreateHost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: hostsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      message.success('主机添加成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}
```

QueryClient 在 `main.tsx` 初始化，`staleTime: 30_000`（30秒）。

---

## 10. 通用 Drawer 模式

所有列表页统一用以下模式：

```typescript
// pages/Hosts.tsx 示例
const [drawerOpen, setDrawerOpen] = useState(false)
const [editingHost, setEditingHost] = useState<Host | null>(null)

const openCreate = () => { setEditingHost(null); setDrawerOpen(true) }
const openEdit = (host: Host) => { setEditingHost(host); setDrawerOpen(true) }
const closeDrawer = () => setDrawerOpen(false)
```

Drawer 内根据 `editingHost === null` 判断显示"添加"还是"编辑"标题，提交调用对应 mutation。

---

## 11. 敏感数据展示规范

- SSH 私钥、SSH 密码、API Key 字段：列表中不展示，Drawer 中编辑已有记录时显示 `••••••••`
- 提供"重新输入"按钮，点击后清空并切换为可编辑 Input
- 新建时直接显示 Input，无需掩码
- 前端永不向控制台打印 token 或密钥

---

## 12. 错误处理

- Axios 响应拦截器（已有）处理 401 → 自动 refresh，refresh 失败 → 清除 Auth，跳转 `/login`
- React Query `onError` callback → `message.error('操作失败，请重试')`
- 表单校验：Ant Design Form 内置，必填字段统一提示
- 全局未捕获：React `ErrorBoundary` 包裹根路由，展示友好错误页

---

## 13. 测试策略

- 单元测试：Vitest + React Testing Library（每个 feature 目录 `__tests__/` 子目录）
- 覆盖范围：useXxx hooks（React Query mock）、Drawer 表单校验、AuthGuard 路由守卫
- 不测试：纯 UI 渲染、第三方组件内部行为
- CI 验证：`npm run build` 无 TypeScript 错误即为通过基线

---

## 14. 非功能要求

- 构建产物无 TypeScript 错误（`tsc --noEmit` 通过）
- 首屏加载：ReactFlow 按需懒加载（`React.lazy`）
- API Key / SSH Key 不出现在 localStorage 或网络请求的非加密字段
- 中文 locale（`antd/locale/zh_CN`）
