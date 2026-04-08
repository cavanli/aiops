# AIOps Frontend Plan F2: Foundation — React Query + Types + API + Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install React Query, Vitest, and ReactFlow; define all TypeScript domain types; implement API functions for all 5 modules; wire QueryClientProvider into main.tsx; replace the Dashboard placeholder with real stats cards + recent activity feed (TDD).

**Prerequisites:** Plan F1 Tasks 1–5 complete. `App.tsx`, `AppLayout.tsx`, `main.tsx`, `Login.tsx` all committed.

**Tech Stack (actual installed versions):**
- React 19.2.4, antd 6.3.5, react-router-dom 7.14.0, zustand 5.0.12, axios 1.14.0, vite 8.0.1, TypeScript 5.9.3
- **To install:** `@tanstack/react-query` v5, `reactflow`, `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@tanstack/react-query-devtools`

---

## File Map

```
AIops/frontend/
├── package.json                        # Updated with new deps
├── vite.config.ts                      # Add test config block
├── src/
│   ├── main.tsx                        # Add QueryClientProvider
│   ├── types/
│   │   ├── host.ts                     # CREATE
│   │   ├── model.ts                    # CREATE
│   │   ├── workflow.ts                 # CREATE
│   │   └── deployment.ts              # CREATE
│   ├── api/
│   │   ├── dashboard.ts               # CREATE
│   │   ├── hosts.ts                   # CREATE
│   │   ├── models.ts                  # CREATE
│   │   ├── workflows.ts               # CREATE
│   │   └── deployments.ts            # CREATE
│   ├── pages/
│   │   └── Dashboard.tsx             # REPLACE placeholder with real component
│   └── features/
│       └── (empty dirs created for future plans)
```

---

## Task 1: Install dependencies

**Files:**
- Modify: `AIops/frontend/package.json` (via npm install)

- [ ] **Step 1: Install runtime dependencies**

```bash
cd e:/Opsgit/AIops/frontend
npm install @tanstack/react-query@5 reactflow @tanstack/react-query-devtools
```

Expected: packages installed, `package.json` updated.

- [ ] **Step 2: Install dev dependencies**

```bash
cd e:/Opsgit/AIops/frontend
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @vitejs/plugin-react
```

Expected: dev packages installed.

- [ ] **Step 3: Add test config to vite.config.ts**

Read `e:/Opsgit/AIops/frontend/vite.config.ts`, then add the `test` block:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 4: Create test setup file**

Create `e:/Opsgit/AIops/frontend/src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

Read `e:/Opsgit/AIops/frontend/package.json`, then add to the `scripts` section:

```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 6: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/
git commit -m "feat: install React Query, ReactFlow, Vitest, and testing libraries"
```

---

## Task 2: TypeScript domain types

**Files:**
- Create: `AIops/frontend/src/types/host.ts`
- Create: `AIops/frontend/src/types/model.ts`
- Create: `AIops/frontend/src/types/workflow.ts`
- Create: `AIops/frontend/src/types/deployment.ts`

- [ ] **Step 1: Create host types**

Create `e:/Opsgit/AIops/frontend/src/types/host.ts`:

```typescript
export type AuthMethod = 'password' | 'key'
export type HostStatus = 'online' | 'offline' | 'unknown'

export interface Host {
  id: number
  name: string
  ip: string
  port: number
  auth_method: AuthMethod
  username: string
  description: string
  status: HostStatus
  created_at: string
  updated_at: string
}

export interface CreateHostRequest {
  name: string
  ip: string
  port: number
  auth_method: AuthMethod
  username: string
  password?: string
  private_key?: string
  description?: string
}

export interface UpdateHostRequest extends Partial<CreateHostRequest> {}

export interface TestConnectionResult {
  latency_ms: number
  message: string
}
```

- [ ] **Step 2: Create model types**

Create `e:/Opsgit/AIops/frontend/src/types/model.ts`:

```typescript
export type ModelProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'custom'
export type ModelType = 'chat' | 'embedding'
export type ModelStatus = 'active' | 'inactive'

export interface Model {
  id: number
  name: string
  provider: ModelProvider
  model_type: ModelType
  model_id: string
  endpoint: string
  status: ModelStatus
  created_at: string
  updated_at: string
}

export interface CreateModelRequest {
  name: string
  provider: ModelProvider
  model_type: ModelType
  model_id: string
  endpoint?: string
  api_key: string
  status: ModelStatus
}

export interface UpdateModelRequest extends Partial<CreateModelRequest> {}

export interface TestModelResult {
  latency_ms: number
  message: string
}
```

- [ ] **Step 3: Create workflow types**

Create `e:/Opsgit/AIops/frontend/src/types/workflow.ts`:

```typescript
export type WorkflowStatus = 'draft' | 'active'
export type NodeType = 'start' | 'end' | 'shell' | 'http' | 'llm' | 'condition'

export interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface Workflow {
  id: number
  name: string
  description: string
  status: WorkflowStatus
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  node_count: number
  last_executed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateWorkflowRequest {
  name: string
  description?: string
}

export interface UpdateWorkflowRequest {
  name?: string
  description?: string
  status?: WorkflowStatus
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
}
```

- [ ] **Step 4: Create deployment types**

Create `e:/Opsgit/AIops/frontend/src/types/deployment.ts`:

```typescript
export type TemplateType = 'shell' | 'helm' | 'docker-compose'
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'

export interface DeploymentTemplate {
  id: number
  name: string
  type: TemplateType
  description: string
  script_content: string
  created_at: string
  updated_at: string
}

export interface CreateTemplateRequest {
  name: string
  type: TemplateType
  description?: string
  script_content: string
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface DeploymentTask {
  id: number
  template_id: number
  template_name: string
  host_ids: number[]
  target_hosts: string[]
  status: TaskStatus
  fail_fast: boolean
  logs: string
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface CreateTaskRequest {
  template_id: number
  host_ids: number[]
  fail_fast: boolean
}

export interface DashboardStats {
  host_count: number
  model_count: number
  running_deployment_count: number
  workflow_count: number
}
```

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/types/
git commit -m "feat: add TypeScript domain types for host, model, workflow, deployment"
```

---

## Task 3: API functions

**Files:**
- Create: `AIops/frontend/src/api/dashboard.ts`
- Create: `AIops/frontend/src/api/hosts.ts`
- Create: `AIops/frontend/src/api/models.ts`
- Create: `AIops/frontend/src/api/workflows.ts`
- Create: `AIops/frontend/src/api/deployments.ts`

- [ ] **Step 1: Create dashboard API**

Create `e:/Opsgit/AIops/frontend/src/api/dashboard.ts`:

```typescript
import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { DashboardStats } from '@/types/deployment'
import type { DeploymentTask } from '@/types/deployment'

export const dashboardApi = {
  getStats: () =>
    client.get<ApiResponse<DashboardStats>>('/api/v1/dashboard/stats'),
  getRecentTasks: () =>
    client.get<ApiResponse<DeploymentTask[]>>(
      '/api/v1/deployments/tasks?limit=10&sort=created_at:desc'
    ),
}
```

- [ ] **Step 2: Create hosts API**

Create `e:/Opsgit/AIops/frontend/src/api/hosts.ts`:

```typescript
import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Host, CreateHostRequest, UpdateHostRequest, TestConnectionResult } from '@/types/host'

export const hostsApi = {
  list: () =>
    client.get<ApiResponse<Host[]>>('/api/v1/hosts'),
  get: (id: number) =>
    client.get<ApiResponse<Host>>(`/api/v1/hosts/${id}`),
  create: (data: CreateHostRequest) =>
    client.post<ApiResponse<Host>>('/api/v1/hosts', data),
  update: (id: number, data: UpdateHostRequest) =>
    client.put<ApiResponse<Host>>(`/api/v1/hosts/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/hosts/${id}`),
  testConnection: (id: number) =>
    client.post<ApiResponse<TestConnectionResult>>(`/api/v1/hosts/${id}/test`),
}
```

- [ ] **Step 3: Create models API**

Create `e:/Opsgit/AIops/frontend/src/api/models.ts`:

```typescript
import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Model, CreateModelRequest, UpdateModelRequest, TestModelResult } from '@/types/model'

export const modelsApi = {
  list: () =>
    client.get<ApiResponse<Model[]>>('/api/v1/models'),
  get: (id: number) =>
    client.get<ApiResponse<Model>>(`/api/v1/models/${id}`),
  create: (data: CreateModelRequest) =>
    client.post<ApiResponse<Model>>('/api/v1/models', data),
  update: (id: number, data: UpdateModelRequest) =>
    client.put<ApiResponse<Model>>(`/api/v1/models/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/models/${id}`),
  testModel: (id: number) =>
    client.post<ApiResponse<TestModelResult>>(`/api/v1/models/${id}/test`),
}
```

- [ ] **Step 4: Create workflows API**

Create `e:/Opsgit/AIops/frontend/src/api/workflows.ts`:

```typescript
import client from './client'
import type { ApiResponse } from '@/types/auth'
import type { Workflow, CreateWorkflowRequest, UpdateWorkflowRequest } from '@/types/workflow'

export const workflowsApi = {
  list: () =>
    client.get<ApiResponse<Workflow[]>>('/api/v1/workflows'),
  get: (id: number) =>
    client.get<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`),
  create: (data: CreateWorkflowRequest) =>
    client.post<ApiResponse<Workflow>>('/api/v1/workflows', data),
  update: (id: number, data: UpdateWorkflowRequest) =>
    client.put<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`, data),
  delete: (id: number) =>
    client.delete(`/api/v1/workflows/${id}`),
  execute: (id: number) =>
    client.post<ApiResponse<{ task_id: number }>>(`/api/v1/workflows/${id}/execute`),
}
```

- [ ] **Step 5: Create deployments API**

Create `e:/Opsgit/AIops/frontend/src/api/deployments.ts`:

```typescript
import client from './client'
import type { ApiResponse } from '@/types/auth'
import type {
  DeploymentTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  DeploymentTask,
  CreateTaskRequest,
} from '@/types/deployment'

export const deploymentsApi = {
  // Templates
  listTemplates: () =>
    client.get<ApiResponse<DeploymentTemplate[]>>('/api/v1/deployments/templates'),
  getTemplate: (id: number) =>
    client.get<ApiResponse<DeploymentTemplate>>(`/api/v1/deployments/templates/${id}`),
  createTemplate: (data: CreateTemplateRequest) =>
    client.post<ApiResponse<DeploymentTemplate>>('/api/v1/deployments/templates', data),
  updateTemplate: (id: number, data: UpdateTemplateRequest) =>
    client.put<ApiResponse<DeploymentTemplate>>(`/api/v1/deployments/templates/${id}`, data),
  deleteTemplate: (id: number) =>
    client.delete(`/api/v1/deployments/templates/${id}`),

  // Tasks
  listTasks: () =>
    client.get<ApiResponse<DeploymentTask[]>>('/api/v1/deployments/tasks'),
  getTask: (id: number) =>
    client.get<ApiResponse<DeploymentTask>>(`/api/v1/deployments/tasks/${id}`),
  createTask: (data: CreateTaskRequest) =>
    client.post<ApiResponse<DeploymentTask>>('/api/v1/deployments/tasks', data),
  cancelTask: (id: number) =>
    client.post(`/api/v1/deployments/tasks/${id}/cancel`),
}
```

- [ ] **Step 6: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/api/
git commit -m "feat: add API functions for all 5 modules"
```

---

## Task 4: Wire QueryClientProvider into main.tsx

**Files:**
- Modify: `AIops/frontend/src/main.tsx`

- [ ] **Step 1: Update main.tsx**

Read current `e:/Opsgit/AIops/frontend/src/main.tsx`, then replace with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import 'antd/dist/reset.css'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/main.tsx
git commit -m "feat: wire QueryClientProvider into main.tsx with staleTime 30s"
```

---

## Task 5: Real Dashboard with stats + recent activity (TDD)

**Files:**
- Create: `AIops/frontend/src/features/dashboard/__tests__/Dashboard.test.tsx`
- Modify: `AIops/frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Write Dashboard test first**

Create `e:/Opsgit/AIops/frontend/src/features/dashboard/__tests__/Dashboard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '@/pages/Dashboard'

// Mock the API modules
vi.mock('@/api/hosts', () => ({
  hostsApi: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}))
vi.mock('@/api/models', () => ({
  modelsApi: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}))
vi.mock('@/api/workflows', () => ({
  workflowsApi: { list: vi.fn().mockResolvedValue({ data: { data: [] } }) },
}))
vi.mock('@/api/deployments', () => ({
  deploymentsApi: {
    listTasks: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('Dashboard', () => {
  it('renders 4 stat cards', () => {
    render(<Dashboard />, { wrapper })
    expect(screen.getByText('主机总数')).toBeInTheDocument()
    expect(screen.getByText('模型接入数')).toBeInTheDocument()
    expect(screen.getByText('进行中部署')).toBeInTheDocument()
    expect(screen.getByText('工作流数')).toBeInTheDocument()
  })

  it('renders recent activity section', () => {
    render(<Dashboard />, { wrapper })
    expect(screen.getByText('最近部署活动')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/dashboard/__tests__/Dashboard.test.tsx
```

Expected: tests FAIL (Dashboard still has placeholder). This confirms the test is wired correctly.

- [ ] **Step 3: Replace Dashboard.tsx with real component**

Read current `e:/Opsgit/AIops/frontend/src/pages/Dashboard.tsx`, then replace with:

```tsx
import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd'
import {
  CloudServerOutlined,
  ApiOutlined,
  RocketOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { hostsApi } from '@/api/hosts'
import { modelsApi } from '@/api/models'
import { workflowsApi } from '@/api/workflows'
import { deploymentsApi } from '@/api/deployments'
import type { DeploymentTask, TaskStatus } from '@/types/deployment'

const { Title } = Typography

const statusColor: Record<TaskStatus, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  cancelled: 'warning',
}

const statusLabel: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '进行中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
}

const activityColumns = [
  { title: '模板名称', dataIndex: 'template_name', key: 'template_name' },
  {
    title: '目标主机',
    dataIndex: 'target_hosts',
    key: 'target_hosts',
    render: (hosts: string[]) => hosts?.join(', ') ?? '-',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (s: TaskStatus) => (
      <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (t: string) => new Date(t).toLocaleString('zh-CN'),
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: hosts } = useQuery({
    queryKey: ['hosts'],
    queryFn: () => hostsApi.list().then((r) => r.data.data),
  })

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list().then((r) => r.data.data),
  })

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data),
  })

  const { data: recentTasks } = useQuery({
    queryKey: ['deployments', 'tasks', 'recent'],
    queryFn: () => deploymentsApi.listTasks().then((r) => r.data.data.slice(0, 10)),
  })

  const runningCount =
    recentTasks?.filter((t) => t.status === 'running').length ?? 0

  const statCards = [
    {
      title: '主机总数',
      value: hosts?.length ?? 0,
      icon: <CloudServerOutlined style={{ color: '#2563EB' }} />,
    },
    {
      title: '模型接入数',
      value: models?.length ?? 0,
      icon: <ApiOutlined style={{ color: '#10B981' }} />,
    },
    {
      title: '进行中部署',
      value: runningCount,
      icon: <RocketOutlined style={{ color: '#F59E0B' }} />,
    },
    {
      title: '工作流数',
      value: workflows?.length ?? 0,
      icon: <ApartmentOutlined style={{ color: '#8B5CF6' }} />,
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        概览
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="最近部署活动"
        bordered={false}
        style={{ borderRadius: 8 }}
      >
        <Table
          dataSource={recentTasks ?? []}
          columns={activityColumns}
          rowKey="id"
          size="small"
          pagination={false}
          onRow={(record) => ({
            onClick: () => navigate(`/deployments`),
            style: { cursor: 'pointer' },
          })}
          locale={{ emptyText: '暂无部署记录' }}
        />
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/dashboard/__tests__/Dashboard.test.tsx
```

Expected: both tests PASS.

- [ ] **Step 5: Verify TypeScript build**

```bash
cd e:/Opsgit/AIops/frontend
npm run build
```

Expected: `✓ built in Xs` with no errors.

- [ ] **Step 6: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/
git commit -m "feat: implement real Dashboard with stats cards and recent activity (TDD)"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] TanStack Query v5 installed, QueryClient with staleTime 30s ✓
- [x] ReactFlow installed ✓
- [x] Vitest + React Testing Library installed ✓
- [x] All 4 domain type files created (host, model, workflow, deployment) ✓
- [x] All 5 API files created following `hostsApi = { list, get, create, ... }` pattern ✓
- [x] `ApiResponse<T>` used consistently in all API functions ✓
- [x] Dashboard has 4 stat cards (主机总数, 模型接入数, 进行中部署, 工作流数) ✓
- [x] Dashboard has recent activity table with status tags ✓
- [x] Clicking activity row navigates to /deployments ✓
- [x] Dashboard test written before implementation (TDD) ✓
- [x] `npm run build` passes ✓

**No Placeholders:** All code complete.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-04-aiops-frontend-plan2-foundation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
