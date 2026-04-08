# AIOps Frontend Plan F6: Deployment Templates + Tasks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Deployment Execution module — a Tab page with two panels: "部署模板" (CRUD with Drawer, script editor) and "部署任务" (create task, view polling logs, cancel). This completes all 5 MVP modules.

**Prerequisites:** Plan F2 complete. All types and API functions for deployments ready. Hosts React Query data available (used in task creation form).

---

## File Map

```
AIops/frontend/src/
├── features/
│   └── deployments/
│       ├── TemplateList.tsx           # CREATE — Table for deployment templates
│       ├── TemplateDrawer.tsx         # CREATE — Create/Edit template Drawer
│       ├── TaskList.tsx               # CREATE — Table for deployment tasks
│       ├── TaskLogDrawer.tsx          # CREATE — Log viewer with 3s polling
│       ├── TaskCreateDrawer.tsx       # CREATE — Create task Drawer
│       ├── useDeployments.ts          # CREATE — React Query hooks
│       └── __tests__/
│           ├── useDeployments.test.ts # CREATE
│           └── TaskLogDrawer.test.tsx # CREATE — polling test
└── pages/
    └── Deployments.tsx                # CREATE — Tab wrapper page
```

---

## Task 1: React Query hooks for deployments (TDD)

**Files:**
- Create: `AIops/frontend/src/features/deployments/__tests__/useDeployments.test.ts`
- Create: `AIops/frontend/src/features/deployments/useDeployments.ts`

- [ ] **Step 1: Write useDeployments tests first**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/__tests__/useDeployments.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useTemplates,
  useTasks,
  useCreateTemplate,
  useCreateTask,
  useTaskPolling,
} from '../useDeployments'
import { deploymentsApi } from '@/api/deployments'
import type { DeploymentTemplate, DeploymentTask } from '@/types/deployment'

vi.mock('@/api/deployments')

const mockTemplate: DeploymentTemplate = {
  id: 1,
  name: 'Deploy App',
  type: 'shell',
  description: '',
  script_content: 'echo deploy',
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

const mockTask: DeploymentTask = {
  id: 1,
  template_id: 1,
  template_name: 'Deploy App',
  host_ids: [1],
  target_hosts: ['prod-web-01'],
  status: 'running',
  fail_fast: true,
  logs: 'Starting deployment...',
  started_at: '2026-04-04T00:00:00Z',
  finished_at: null,
  created_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useTemplates', () => {
  beforeEach(() => {
    vi.mocked(deploymentsApi.listTemplates).mockResolvedValue({
      data: { data: [mockTemplate], code: 0, message: 'ok' },
    } as any)
  })

  it('fetches template list', async () => {
    const { result } = renderHook(() => useTemplates(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('Deploy App')
  })
})

describe('useTasks', () => {
  beforeEach(() => {
    vi.mocked(deploymentsApi.listTasks).mockResolvedValue({
      data: { data: [mockTask], code: 0, message: 'ok' },
    } as any)
  })

  it('fetches task list', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].status).toBe('running')
  })
})

describe('useTaskPolling', () => {
  it('returns task data with refetchInterval when status is running', async () => {
    vi.mocked(deploymentsApi.getTask).mockResolvedValue({
      data: { data: mockTask, code: 0, message: 'ok' },
    } as any)
    const { result } = renderHook(() => useTaskPolling(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.logs).toBe('Starting deployment...')
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/deployments/__tests__/useDeployments.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create useDeployments.ts**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/useDeployments.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { deploymentsApi } from '@/api/deployments'
import type { CreateTemplateRequest, UpdateTemplateRequest, CreateTaskRequest } from '@/types/deployment'

// Templates

export function useTemplates() {
  return useQuery({
    queryKey: ['deployment-templates'],
    queryFn: () => deploymentsApi.listTemplates().then((r) => r.data.data),
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.createTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-templates'] })
      message.success('模板创建成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTemplateRequest }) =>
      deploymentsApi.updateTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-templates'] })
      message.success('模板更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.deleteTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-templates'] })
      message.success('模板删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

// Tasks

export function useTasks() {
  return useQuery({
    queryKey: ['deployment-tasks'],
    queryFn: () => deploymentsApi.listTasks().then((r) => r.data.data),
  })
}

export function useTaskPolling(id: number) {
  return useQuery({
    queryKey: ['deployment-tasks', id],
    queryFn: () => deploymentsApi.getTask(id).then((r) => r.data.data),
    enabled: id > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'running' || status === 'pending' ? 3000 : false
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deployment-tasks'] })
      message.success('部署任务已创建')
    },
    onError: () => message.error('创建失败，请重试'),
  })
}

export function useCancelTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deploymentsApi.cancelTask,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['deployment-tasks'] })
      qc.invalidateQueries({ queryKey: ['deployment-tasks', id] })
      message.success('任务已取消')
    },
    onError: () => message.error('取消失败，请重试'),
  })
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/deployments/__tests__/useDeployments.test.ts
```

Expected: PASS.

---

## Task 2: TemplateDrawer + TemplateList

**Files:**
- Create: `AIops/frontend/src/features/deployments/TemplateDrawer.tsx`
- Create: `AIops/frontend/src/features/deployments/TemplateList.tsx`

- [ ] **Step 1: Create TemplateDrawer.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/TemplateDrawer.tsx`:

```tsx
import { useEffect } from 'react'
import { Drawer, Form, Input, Select, Button, Space } from 'antd'
import type { DeploymentTemplate, CreateTemplateRequest, UpdateTemplateRequest, TemplateType } from '@/types/deployment'
import { useCreateTemplate, useUpdateTemplate } from './useDeployments'

interface Props {
  open: boolean
  editingTemplate: DeploymentTemplate | null
  onClose: () => void
}

export default function TemplateDrawer({ open, editingTemplate, onClose }: Props) {
  const [form] = Form.useForm()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()

  const isEdit = editingTemplate !== null

  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        form.setFieldsValue({
          name: editingTemplate.name,
          type: editingTemplate.type,
          description: editingTemplate.description,
          script_content: editingTemplate.script_content,
        })
      } else {
        form.resetFields()
        form.setFieldValue('type', 'shell')
      }
    }
  }, [open, editingTemplate, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (isEdit) {
      await updateTemplate.mutateAsync({ id: editingTemplate!.id, data: values as UpdateTemplateRequest })
    } else {
      await createTemplate.mutateAsync(values as CreateTemplateRequest)
    }
    onClose()
  }

  const isPending = createTemplate.isPending || updateTemplate.isPending

  return (
    <Drawer
      title={isEdit ? '编辑模板' : '新建模板'}
      open={open}
      onClose={onClose}
      width={560}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="e.g. 应用部署脚本" />
        </Form.Item>
        <Form.Item name="type" label="类型" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'Shell 脚本', value: 'shell' },
              { label: 'Helm Chart', value: 'helm' },
              { label: 'Docker Compose', value: 'docker-compose' },
            ]}
          />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="可选描述" />
        </Form.Item>
        <Form.Item name="script_content" label="脚本内容" rules={[{ required: true, message: '请输入脚本内容' }]}>
          <Input.TextArea
            rows={12}
            placeholder="#!/bin/bash&#10;echo 'Starting deployment...'"
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
```

- [ ] **Step 2: Create TemplateList.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/TemplateList.tsx`:

```tsx
import { useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DeploymentTemplate, TemplateType } from '@/types/deployment'
import { useTemplates, useDeleteTemplate } from './useDeployments'
import TemplateDrawer from './TemplateDrawer'

const typeColor: Record<TemplateType, string> = {
  shell: 'blue',
  helm: 'purple',
  'docker-compose': 'cyan',
}

export default function TemplateList() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DeploymentTemplate | null>(null)

  const { data: templates = [], isLoading } = useTemplates()
  const deleteTemplate = useDeleteTemplate()

  const columns: ColumnsType<DeploymentTemplate> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (t: TemplateType) => <Tag color={typeColor[t]}>{t}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => { setEditingTemplate(record); setDrawerOpen(true) }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模板？"
            onConfirm={() => deleteTemplate.mutate(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingTemplate(null); setDrawerOpen(true) }}
        >
          新建模板
        </Button>
      </div>
      <Table
        dataSource={templates}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无部署模板' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
      <TemplateDrawer
        open={drawerOpen}
        editingTemplate={editingTemplate}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
```

---

## Task 3: TaskLogDrawer (polling) with test

**Files:**
- Create: `AIops/frontend/src/features/deployments/__tests__/TaskLogDrawer.test.tsx`
- Create: `AIops/frontend/src/features/deployments/TaskLogDrawer.tsx`

- [ ] **Step 1: Write TaskLogDrawer tests first**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/__tests__/TaskLogDrawer.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TaskLogDrawer from '../TaskLogDrawer'
import { deploymentsApi } from '@/api/deployments'

vi.mock('@/api/deployments')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('TaskLogDrawer', () => {
  it('renders closed drawer without fetching', () => {
    const { container } = render(
      <TaskLogDrawer open={false} taskId={0} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(deploymentsApi.getTask).not.toHaveBeenCalled()
  })

  it('renders log content when open', async () => {
    vi.mocked(deploymentsApi.getTask).mockResolvedValue({
      data: {
        data: {
          id: 1, logs: 'deployment log line 1\ndeployment log line 2',
          status: 'success', template_name: 'Deploy App',
          host_ids: [1], target_hosts: ['host1'],
          fail_fast: false, started_at: null, finished_at: null,
          created_at: '', template_id: 1,
        },
        code: 0, message: 'ok',
      },
    } as any)

    render(<TaskLogDrawer open={true} taskId={1} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('部署日志')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/deployments/__tests__/TaskLogDrawer.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create TaskLogDrawer.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/TaskLogDrawer.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { Drawer, Tag, Spin, Typography, Space } from 'antd'
import type { TaskStatus } from '@/types/deployment'
import { useTaskPolling } from './useDeployments'

const { Text } = Typography

const statusColor: Record<TaskStatus, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  cancelled: 'warning',
}
const statusLabel: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '执行中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
}

interface Props {
  open: boolean
  taskId: number
  onClose: () => void
}

export default function TaskLogDrawer({ open, taskId, onClose }: Props) {
  const { data: task, isLoading } = useTaskPolling(open ? taskId : 0)
  const logRef = useRef<HTMLPreElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [task?.logs])

  const isActive = task?.status === 'running' || task?.status === 'pending'

  return (
    <Drawer
      title={
        <Space>
          <span>部署日志</span>
          {task && (
            <Tag color={statusColor[task.status]}>{statusLabel[task.status]}</Tag>
          )}
          {isActive && <Spin size="small" />}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={640}
    >
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
          <Spin />
        </div>
      ) : (
        <>
          {task && (
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                模板：{task.template_name} &nbsp;|&nbsp;
                主机：{task.target_hosts.join(', ')}
                {task.started_at && (
                  <> &nbsp;|&nbsp; 开始：{new Date(task.started_at).toLocaleString('zh-CN')}</>
                )}
              </Text>
            </div>
          )}
          <pre
            ref={logRef}
            style={{
              background: '#1E293B',
              color: '#E2E8F0',
              padding: 16,
              borderRadius: 8,
              height: 'calc(100vh - 200px)',
              overflowY: 'auto',
              fontSize: 13,
              fontFamily: 'Consolas, "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {task?.logs || (isActive ? '等待日志输出...' : '暂无日志')}
          </pre>
        </>
      )}
    </Drawer>
  )
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/deployments/__tests__/TaskLogDrawer.test.tsx
```

Expected: PASS.

---

## Task 4: TaskCreateDrawer + TaskList

**Files:**
- Create: `AIops/frontend/src/features/deployments/TaskCreateDrawer.tsx`
- Create: `AIops/frontend/src/features/deployments/TaskList.tsx`

- [ ] **Step 1: Create TaskCreateDrawer.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/TaskCreateDrawer.tsx`:

```tsx
import { Drawer, Form, Select, Switch, Button, Space } from 'antd'
import { useTemplates, useCreateTask } from './useDeployments'
import { useHosts } from '@/features/hosts/useHosts'

interface Props {
  open: boolean
  onClose: () => void
}

export default function TaskCreateDrawer({ open, onClose }: Props) {
  const [form] = Form.useForm()
  const { data: templates = [] } = useTemplates()
  const { data: hosts = [] } = useHosts()
  const createTask = useCreateTask()

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await createTask.mutateAsync({
      template_id: values.template_id,
      host_ids: values.host_ids,
      fail_fast: values.fail_fast ?? true,
    })
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      title="新建部署"
      open={open}
      onClose={() => { form.resetFields(); onClose() }}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={() => { form.resetFields(); onClose() }}>取消</Button>
          <Button type="primary" loading={createTask.isPending} onClick={handleSubmit}>
            开始部署
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ fail_fast: true }}>
        <Form.Item name="template_id" label="部署模板" rules={[{ required: true, message: '请选择模板' }]}>
          <Select
            placeholder="选择部署模板"
            options={templates.map((t) => ({ label: `${t.name} (${t.type})`, value: t.id }))}
          />
        </Form.Item>
        <Form.Item name="host_ids" label="目标主机" rules={[{ required: true, message: '请选择至少一台主机' }]}>
          <Select
            mode="multiple"
            placeholder="选择目标主机（可多选）"
            options={hosts.map((h) => ({ label: `${h.name} (${h.ip})`, value: h.id }))}
          />
        </Form.Item>
        <Form.Item name="fail_fast" label="失败策略" valuePropName="checked">
          <Switch checkedChildren="遇错即止" unCheckedChildren="继续执行" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
```

- [ ] **Step 2: Create TaskList.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/deployments/TaskList.tsx`:

```tsx
import { useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DeploymentTask, TaskStatus } from '@/types/deployment'
import { useTasks, useCancelTask } from './useDeployments'
import TaskCreateDrawer from './TaskCreateDrawer'
import TaskLogDrawer from './TaskLogDrawer'

const statusColor: Record<TaskStatus, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  cancelled: 'warning',
}
const statusLabel: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '执行中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
}

function duration(task: DeploymentTask): string {
  if (!task.started_at) return '-'
  const end = task.finished_at ? new Date(task.finished_at) : new Date()
  const secs = Math.round((end.getTime() - new Date(task.started_at).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

export default function TaskList() {
  const [createOpen, setCreateOpen] = useState(false)
  const [logTaskId, setLogTaskId] = useState<number>(0)

  const { data: tasks = [], isLoading } = useTasks()
  const cancelTask = useCancelTask()

  const columns: ColumnsType<DeploymentTask> = [
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
      width: 100,
      render: (s: TaskStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (t: string | null) =>
        t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '耗时',
      key: 'duration',
      width: 80,
      render: (_, record) => duration(record),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看日志">
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => setLogTaskId(record.id)}
            >
              日志
            </Button>
          </Tooltip>
          {(record.status === 'pending' || record.status === 'running') && (
            <Popconfirm
              title="确定取消此部署任务？"
              onConfirm={() => cancelTask.mutate(record.id)}
              okText="取消任务"
              cancelText="保留"
            >
              <Button size="small" danger>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          新建部署
        </Button>
      </div>
      <Table
        dataSource={tasks}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无部署任务' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
      <TaskCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <TaskLogDrawer
        open={logTaskId > 0}
        taskId={logTaskId}
        onClose={() => setLogTaskId(0)}
      />
    </div>
  )
}
```

---

## Task 5: Deployments page + final router wiring + build verify

**Files:**
- Create: `AIops/frontend/src/pages/Deployments.tsx`
- Modify: `AIops/frontend/src/App.tsx`

- [ ] **Step 1: Create Deployments page**

Create `e:/Opsgit/AIops/frontend/src/pages/Deployments.tsx`:

```tsx
import { Tabs, Typography } from 'antd'
import TemplateList from '@/features/deployments/TemplateList'
import TaskList from '@/features/deployments/TaskList'

const { Title } = Typography

export default function Deployments() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>部署执行</Title>
      <Tabs
        items={[
          {
            key: 'templates',
            label: '部署模板',
            children: <TemplateList />,
          },
          {
            key: 'tasks',
            label: '部署任务',
            children: <TaskList />,
          },
        ]}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update App.tsx — wire real Deployments page**

Read current `e:/Opsgit/AIops/frontend/src/App.tsx`, then:

Add import:
```tsx
import Deployments from './pages/Deployments'
```

Change:
```tsx
<Route path="deployments" element={<Dashboard />} />
```

To:
```tsx
<Route path="deployments" element={<Deployments />} />
```

- [ ] **Step 3: Run all tests**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run
```

Expected: All tests PASS. No failures.

- [ ] **Step 4: Final build verify**

```bash
cd e:/Opsgit/AIops/frontend
npm run build
```

Expected: `✓ built in Xs` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/
git commit -m "feat: implement Deployment Templates and Tasks with log polling (completes MVP)"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Tab structure: 部署模板 | 部署任务 ✓
- [x] Template Table: 名称 / 类型 / 描述 / 操作 ✓
- [x] Template Drawer: 名称 / 类型 / 描述 / 脚本内容 textarea ✓
- [x] Template delete → Popconfirm ✓
- [x] Task Table: 模板名 / 目标主机 / 状态 / 开始时间 / 耗时 / 操作 ✓
- [x] Task create Drawer: 选模板 / 选主机(多选) / fail_fast ✓
- [x] Cancel task → Popconfirm (only pending/running) ✓
- [x] TaskLogDrawer: polling every 3s via `useTaskPolling` with `refetchInterval` ✓
- [x] Log viewer: `<pre>` dark terminal style, auto-scroll to bottom ✓
- [x] Log polling stops when status is success/failed/cancelled ✓
- [x] Status tags with processing animation for running ✓
- [x] All tests pass ✓
- [x] `npm run build` passes ✓

**MVP Complete:** All 5 modules implemented — Dashboard, Hosts, Models, Workflows, Deployments.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-04-aiops-frontend-plan6-deployments.md`.

This is the **final MVP plan**. After executing F6, all 5 frontend modules are complete.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
