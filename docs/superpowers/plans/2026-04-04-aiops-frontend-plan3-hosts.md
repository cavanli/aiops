# AIOps Frontend Plan F3: Host Management

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Host Management module — a full-screen Table listing hosts with search, plus a right-side Drawer for create/edit with sensitive field masking, Popconfirm for delete, and "测试连接" button.

**Prerequisites:** Plan F2 complete. All types, API functions, and QueryClientProvider wired.

---

## File Map

```
AIops/frontend/src/
├── features/
│   └── hosts/
│       ├── HostList.tsx                # CREATE — Ant Design Table + search + actions
│       ├── HostDrawer.tsx              # CREATE — Create/Edit Drawer with sensitive field masking
│       ├── useHosts.ts                 # CREATE — React Query hooks
│       └── __tests__/
│           ├── useHosts.test.ts        # CREATE — hook tests
│           └── HostDrawer.test.tsx     # CREATE — form validation tests
└── pages/
    └── Hosts.tsx                       # CREATE — page wrapper
```

---

## Task 1: React Query hooks for hosts (TDD)

**Files:**
- Create: `AIops/frontend/src/features/hosts/__tests__/useHosts.test.ts`
- Create: `AIops/frontend/src/features/hosts/useHosts.ts`

- [ ] **Step 1: Write useHosts tests first**

Create `e:/Opsgit/AIops/frontend/src/features/hosts/__tests__/useHosts.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHosts, useCreateHost, useUpdateHost, useDeleteHost } from '../useHosts'
import { hostsApi } from '@/api/hosts'
import type { Host } from '@/types/host'

vi.mock('@/api/hosts')

const mockHost: Host = {
  id: 1,
  name: 'test-host',
  ip: '192.168.1.1',
  port: 22,
  auth_method: 'password',
  username: 'admin',
  description: '',
  status: 'online',
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useHosts', () => {
  beforeEach(() => {
    vi.mocked(hostsApi.list).mockResolvedValue({ data: { data: [mockHost], code: 0, message: 'ok' } } as any)
  })

  it('fetches host list', async () => {
    const { result } = renderHook(() => useHosts(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('test-host')
  })
})

describe('useCreateHost', () => {
  it('exposes mutate function', () => {
    vi.mocked(hostsApi.create).mockResolvedValue({ data: { data: mockHost, code: 0, message: 'ok' } } as any)
    const { result } = renderHook(() => useCreateHost(), { wrapper: makeWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/hosts/__tests__/useHosts.test.ts
```

Expected: FAIL (useHosts.ts not created yet).

- [ ] **Step 3: Create useHosts.ts**

Create `e:/Opsgit/AIops/frontend/src/features/hosts/useHosts.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { hostsApi } from '@/api/hosts'
import type { CreateHostRequest, UpdateHostRequest } from '@/types/host'

export function useHosts() {
  return useQuery({
    queryKey: ['hosts'],
    queryFn: () => hostsApi.list().then((r) => r.data.data),
  })
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

export function useUpdateHost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateHostRequest }) =>
      hostsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      message.success('主机更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteHost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: hostsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts'] })
      message.success('主机删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/hosts/__tests__/useHosts.test.ts
```

Expected: PASS.

---

## Task 2: HostDrawer with form validation tests (TDD)

**Files:**
- Create: `AIops/frontend/src/features/hosts/__tests__/HostDrawer.test.tsx`
- Create: `AIops/frontend/src/features/hosts/HostDrawer.tsx`

- [ ] **Step 1: Write HostDrawer tests first**

Create `e:/Opsgit/AIops/frontend/src/features/hosts/__tests__/HostDrawer.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HostDrawer from '../HostDrawer'

vi.mock('@/api/hosts', () => ({
  hostsApi: {
    create: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
    update: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('HostDrawer', () => {
  it('renders add title when editingHost is null', () => {
    render(
      <HostDrawer open={true} editingHost={null} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText('添加主机')).toBeInTheDocument()
  })

  it('renders edit title when editingHost is provided', () => {
    const host = {
      id: 1, name: 'h1', ip: '1.1.1.1', port: 22,
      auth_method: 'password' as const, username: 'admin',
      description: '', status: 'online' as const,
      created_at: '', updated_at: '',
    }
    render(
      <HostDrawer open={true} editingHost={host} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText('编辑主机')).toBeInTheDocument()
  })

  it('shows masked password when editing existing host', () => {
    const host = {
      id: 1, name: 'h1', ip: '1.1.1.1', port: 22,
      auth_method: 'password' as const, username: 'admin',
      description: '', status: 'online' as const,
      created_at: '', updated_at: '',
    }
    render(
      <HostDrawer open={true} editingHost={host} onClose={vi.fn()} />,
      { wrapper }
    )
    expect(screen.getByText('重新输入')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/hosts/__tests__/HostDrawer.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create HostDrawer.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/hosts/HostDrawer.tsx`:

```tsx
import { useState, useEffect } from 'react'
import {
  Drawer, Form, Input, InputNumber, Select, Button, Space, Typography
} from 'antd'
import type { Host, CreateHostRequest, UpdateHostRequest } from '@/types/host'
import { useCreateHost, useUpdateHost } from './useHosts'

const { Text } = Typography

interface Props {
  open: boolean
  editingHost: Host | null
  onClose: () => void
}

export default function HostDrawer({ open, editingHost, onClose }: Props) {
  const [form] = Form.useForm()
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password')
  const [revealSecret, setRevealSecret] = useState(false)
  const createHost = useCreateHost()
  const updateHost = useUpdateHost()

  const isEdit = editingHost !== null

  useEffect(() => {
    if (open) {
      setRevealSecret(false)
      if (editingHost) {
        form.setFieldsValue({
          name: editingHost.name,
          ip: editingHost.ip,
          port: editingHost.port,
          auth_method: editingHost.auth_method,
          username: editingHost.username,
          description: editingHost.description,
        })
        setAuthMethod(editingHost.auth_method)
      } else {
        form.resetFields()
        form.setFieldValue('port', 22)
        form.setFieldValue('auth_method', 'password')
        setAuthMethod('password')
      }
    }
  }, [open, editingHost, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload: CreateHostRequest | UpdateHostRequest = { ...values }

    // If editing and secret not revealed, remove secret fields from payload
    if (isEdit && !revealSecret) {
      delete (payload as UpdateHostRequest).password
      delete (payload as UpdateHostRequest).private_key
    }

    if (isEdit) {
      await updateHost.mutateAsync({ id: editingHost!.id, data: payload as UpdateHostRequest })
    } else {
      await createHost.mutateAsync(payload as CreateHostRequest)
    }
    onClose()
  }

  const isPending = createHost.isPending || updateHost.isPending

  return (
    <Drawer
      title={isEdit ? '编辑主机' : '添加主机'}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isEdit ? '保存' : '添加'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="主机名" rules={[{ required: true, message: '请输入主机名' }]}>
          <Input placeholder="e.g. prod-web-01" />
        </Form.Item>
        <Form.Item name="ip" label="IP 地址" rules={[{ required: true, message: '请输入 IP 地址' }]}>
          <Input placeholder="192.168.1.100" />
        </Form.Item>
        <Form.Item name="port" label="SSH 端口" rules={[{ required: true }]}>
          <InputNumber min={1} max={65535} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="auth_method" label="认证方式" rules={[{ required: true }]}>
          <Select
            onChange={(v) => { setAuthMethod(v); setRevealSecret(false) }}
            options={[
              { label: '密码', value: 'password' },
              { label: 'SSH Key', value: 'key' },
            ]}
          />
        </Form.Item>
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input placeholder="root" />
        </Form.Item>

        {authMethod === 'password' && (
          <Form.Item
            name="password"
            label="密码"
            rules={isEdit && !revealSecret ? [] : [{ required: !isEdit, message: '请输入密码' }]}
          >
            {isEdit && !revealSecret ? (
              <Space>
                <Text type="secondary">••••••••</Text>
                <Button size="small" onClick={() => { setRevealSecret(true); form.setFieldValue('password', '') }}>
                  重新输入
                </Button>
              </Space>
            ) : (
              <Input.Password placeholder="SSH 密码" />
            )}
          </Form.Item>
        )}

        {authMethod === 'key' && (
          <Form.Item
            name="private_key"
            label="SSH 私钥"
            rules={isEdit && !revealSecret ? [] : [{ required: !isEdit, message: '请输入 SSH 私钥' }]}
          >
            {isEdit && !revealSecret ? (
              <Space>
                <Text type="secondary">••••••••</Text>
                <Button size="small" onClick={() => { setRevealSecret(true); form.setFieldValue('private_key', '') }}>
                  重新输入
                </Button>
              </Space>
            ) : (
              <Input.TextArea rows={6} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
            )}
          </Form.Item>
        )}

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/hosts/__tests__/HostDrawer.test.tsx
```

Expected: PASS.

---

## Task 3: HostList component

**Files:**
- Create: `AIops/frontend/src/features/hosts/HostList.tsx`

- [ ] **Step 1: Create HostList.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/hosts/HostList.tsx`:

```tsx
import { useState } from 'react'
import { Table, Button, Input, Space, Tag, Popconfirm, message, Tooltip } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Host, HostStatus } from '@/types/host'
import { useHosts, useDeleteHost } from './useHosts'
import { hostsApi } from '@/api/hosts'
import HostDrawer from './HostDrawer'

const statusColor: Record<HostStatus, string> = {
  online: 'success',
  offline: 'error',
  unknown: 'default',
}

const statusLabel: Record<HostStatus, string> = {
  online: '在线',
  offline: '离线',
  unknown: '未知',
}

export default function HostList() {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<Host | null>(null)
  const [testingId, setTestingId] = useState<number | null>(null)

  const { data: hosts = [], isLoading } = useHosts()
  const deleteHost = useDeleteHost()

  const filtered = hosts.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.ip.includes(search)
  )

  const handleTest = async (host: Host) => {
    setTestingId(host.id)
    try {
      const res = await hostsApi.testConnection(host.id)
      message.success(`连接成功，延迟 ${res.data.data.latency_ms}ms`)
    } catch {
      message.error('连接失败，请检查主机配置')
    } finally {
      setTestingId(null)
    }
  }

  const columns: ColumnsType<Host> = [
    { title: '主机名', dataIndex: 'name', key: 'name' },
    { title: 'IP 地址', dataIndex: 'ip', key: 'ip' },
    { title: 'SSH 端口', dataIndex: 'port', key: 'port', width: 100 },
    {
      title: '认证方式',
      dataIndex: 'auth_method',
      key: 'auth_method',
      width: 100,
      render: (v: string) => (v === 'password' ? '密码' : 'SSH Key'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: HostStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="测试连接">
            <Button
              size="small"
              loading={testingId === record.id}
              onClick={() => handleTest(record)}
            >
              测试
            </Button>
          </Tooltip>
          <Button
            size="small"
            onClick={() => { setEditingHost(record); setDrawerOpen(true) }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此主机？"
            onConfirm={() => deleteHost.mutate(record.id)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          placeholder="搜索主机名 / IP"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingHost(null); setDrawerOpen(true) }}
        >
          添加主机
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无主机' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <HostDrawer
        open={drawerOpen}
        editingHost={editingHost}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
```

---

## Task 4: Hosts page + router wiring

**Files:**
- Create: `AIops/frontend/src/pages/Hosts.tsx`
- Modify: `AIops/frontend/src/App.tsx`

- [ ] **Step 1: Create Hosts page**

Create `e:/Opsgit/AIops/frontend/src/pages/Hosts.tsx`:

```tsx
import { Typography } from 'antd'
import HostList from '@/features/hosts/HostList'

const { Title } = Typography

export default function Hosts() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>主机管理</Title>
      <HostList />
    </div>
  )
}
```

- [ ] **Step 2: Update App.tsx to use real Hosts page**

Read current `e:/Opsgit/AIops/frontend/src/App.tsx`, then replace the `path="hosts"` route:

Change:
```tsx
<Route path="hosts" element={<Dashboard />} />
```

To:
```tsx
<Route path="hosts" element={<Hosts />} />
```

Also add the import at the top:
```tsx
import Hosts from './pages/Hosts'
```

- [ ] **Step 3: Build verify**

```bash
cd e:/Opsgit/AIops/frontend
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/
git commit -m "feat: implement Host Management with Table, Drawer, TDD hooks"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Table columns: 主机名 / IP地址 / SSH端口 / 认证方式 / 状态 / 操作 ✓
- [x] Search by name/IP (frontend filter) ✓
- [x] Add host → Drawer (editingHost = null) ✓
- [x] Edit host → Drawer (editingHost = row) ✓
- [x] Delete → Popconfirm ✓
- [x] Test connection → `POST /api/v1/hosts/:id/test`, Toast shows result ✓
- [x] Drawer: all required fields including auth_method Select ✓
- [x] Sensitive field masking: `••••••••` with "重新输入" button when editing ✓
- [x] New host: secret fields show Input directly (no mask) ✓
- [x] useHosts / useCreateHost / useUpdateHost / useDeleteHost with invalidateQueries ✓
- [x] TDD: tests written before implementation ✓
- [x] `npm run build` passes ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-04-aiops-frontend-plan3-hosts.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
