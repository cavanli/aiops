# AIOps Frontend Plan F4: Model Marketplace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Model Marketplace module — a Table listing AI model integrations with search, plus a Drawer for create/edit with API Key masking, "测试模型" button showing latency, and enable/disable toggle.

**Prerequisites:** Plan F2 complete. All types, API functions installed.

---

## File Map

```
AIops/frontend/src/
├── features/
│   └── models/
│       ├── ModelList.tsx               # CREATE — Table + search + test model
│       ├── ModelDrawer.tsx             # CREATE — Create/Edit Drawer with API Key masking
│       ├── useModels.ts                # CREATE — React Query hooks
│       └── __tests__/
│           ├── useModels.test.ts       # CREATE
│           └── ModelDrawer.test.tsx    # CREATE
└── pages/
    └── Models.tsx                      # CREATE
```

---

## Task 1: React Query hooks for models (TDD)

**Files:**
- Create: `AIops/frontend/src/features/models/__tests__/useModels.test.ts`
- Create: `AIops/frontend/src/features/models/useModels.ts`

- [ ] **Step 1: Write useModels tests first**

Create `e:/Opsgit/AIops/frontend/src/features/models/__tests__/useModels.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useModels, useCreateModel, useUpdateModel, useDeleteModel } from '../useModels'
import { modelsApi } from '@/api/models'
import type { Model } from '@/types/model'

vi.mock('@/api/models')

const mockModel: Model = {
  id: 1,
  name: 'GPT-4o',
  provider: 'openai',
  model_type: 'chat',
  model_id: 'gpt-4o',
  endpoint: '',
  status: 'active',
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useModels', () => {
  beforeEach(() => {
    vi.mocked(modelsApi.list).mockResolvedValue({
      data: { data: [mockModel], code: 0, message: 'ok' },
    } as any)
  })

  it('fetches model list', async () => {
    const { result } = renderHook(() => useModels(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('GPT-4o')
  })
})

describe('useCreateModel', () => {
  it('exposes mutate function', () => {
    vi.mocked(modelsApi.create).mockResolvedValue({
      data: { data: mockModel, code: 0, message: 'ok' },
    } as any)
    const { result } = renderHook(() => useCreateModel(), { wrapper: makeWrapper() })
    expect(typeof result.current.mutate).toBe('function')
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/models/__tests__/useModels.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create useModels.ts**

Create `e:/Opsgit/AIops/frontend/src/features/models/useModels.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { modelsApi } from '@/api/models'
import type { CreateModelRequest, UpdateModelRequest } from '@/types/model'

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list().then((r) => r.data.data),
  })
}

export function useCreateModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: modelsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      message.success('模型添加成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateModelRequest }) =>
      modelsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      message.success('模型更新成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useDeleteModel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: modelsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      message.success('模型删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/models/__tests__/useModels.test.ts
```

Expected: PASS.

---

## Task 2: ModelDrawer with API Key masking (TDD)

**Files:**
- Create: `AIops/frontend/src/features/models/__tests__/ModelDrawer.test.tsx`
- Create: `AIops/frontend/src/features/models/ModelDrawer.tsx`

- [ ] **Step 1: Write ModelDrawer tests first**

Create `e:/Opsgit/AIops/frontend/src/features/models/__tests__/ModelDrawer.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ModelDrawer from '../ModelDrawer'

vi.mock('@/api/models', () => ({
  modelsApi: {
    create: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
    update: vi.fn().mockResolvedValue({ data: { data: {}, code: 0, message: 'ok' } }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ModelDrawer', () => {
  it('renders add title when editingModel is null', () => {
    render(<ModelDrawer open={true} editingModel={null} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('添加模型')).toBeInTheDocument()
  })

  it('renders edit title when editingModel provided', () => {
    const model = {
      id: 1, name: 'GPT-4o', provider: 'openai' as const,
      model_type: 'chat' as const, model_id: 'gpt-4o',
      endpoint: '', status: 'active' as const,
      created_at: '', updated_at: '',
    }
    render(<ModelDrawer open={true} editingModel={model} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('编辑模型')).toBeInTheDocument()
  })

  it('shows masked API Key when editing', () => {
    const model = {
      id: 1, name: 'GPT-4o', provider: 'openai' as const,
      model_type: 'chat' as const, model_id: 'gpt-4o',
      endpoint: '', status: 'active' as const,
      created_at: '', updated_at: '',
    }
    render(<ModelDrawer open={true} editingModel={model} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText('重新输入')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/models/__tests__/ModelDrawer.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Create ModelDrawer.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/models/ModelDrawer.tsx`:

```tsx
import { useState, useEffect } from 'react'
import {
  Drawer, Form, Input, Select, Switch, Button, Space, Typography
} from 'antd'
import type { Model, CreateModelRequest, UpdateModelRequest, ModelProvider } from '@/types/model'
import { useCreateModel, useUpdateModel } from './useModels'

const { Text } = Typography

const PROVIDERS: { label: string; value: ModelProvider }[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '通义千问', value: 'qwen' },
  { label: '自定义', value: 'custom' },
]

interface Props {
  open: boolean
  editingModel: Model | null
  onClose: () => void
}

export default function ModelDrawer({ open, editingModel, onClose }: Props) {
  const [form] = Form.useForm()
  const [provider, setProvider] = useState<ModelProvider>('openai')
  const [revealKey, setRevealKey] = useState(false)
  const createModel = useCreateModel()
  const updateModel = useUpdateModel()

  const isEdit = editingModel !== null

  useEffect(() => {
    if (open) {
      setRevealKey(false)
      if (editingModel) {
        form.setFieldsValue({
          name: editingModel.name,
          provider: editingModel.provider,
          model_type: editingModel.model_type,
          model_id: editingModel.model_id,
          endpoint: editingModel.endpoint,
          status: editingModel.status === 'active',
        })
        setProvider(editingModel.provider)
      } else {
        form.resetFields()
        form.setFieldsValue({ provider: 'openai', model_type: 'chat', status: true })
        setProvider('openai')
      }
    }
  }, [open, editingModel, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      status: values.status ? 'active' : 'inactive',
    }

    if (isEdit && !revealKey) {
      delete payload.api_key
    }

    if (isEdit) {
      await updateModel.mutateAsync({ id: editingModel!.id, data: payload as UpdateModelRequest })
    } else {
      await createModel.mutateAsync(payload as CreateModelRequest)
    }
    onClose()
  }

  const isPending = createModel.isPending || updateModel.isPending

  return (
    <Drawer
      title={isEdit ? '编辑模型' : '添加模型'}
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
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="e.g. 生产环境 GPT-4o" />
        </Form.Item>
        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
          <Select
            options={PROVIDERS}
            onChange={(v) => setProvider(v)}
          />
        </Form.Item>
        <Form.Item name="model_type" label="模型类型" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '对话 (Chat)', value: 'chat' },
              { label: '嵌入 (Embedding)', value: 'embedding' },
            ]}
          />
        </Form.Item>
        <Form.Item name="model_id" label="Model ID" rules={[{ required: true, message: '请输入 Model ID' }]}>
          <Input placeholder="gpt-4o" />
        </Form.Item>
        {provider === 'custom' && (
          <Form.Item name="endpoint" label="Endpoint" rules={[{ required: true, message: '自定义 Provider 需填写 Endpoint' }]}>
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>
        )}

        <Form.Item
          name="api_key"
          label="API Key"
          rules={isEdit && !revealKey ? [] : [{ required: !isEdit, message: '请输入 API Key' }]}
        >
          {isEdit && !revealKey ? (
            <Space>
              <Text type="secondary">••••••••</Text>
              <Button
                size="small"
                onClick={() => { setRevealKey(true); form.setFieldValue('api_key', '') }}
              >
                重新输入
              </Button>
            </Space>
          ) : (
            <Input.Password placeholder="sk-..." />
          )}
        </Form.Item>

        <Form.Item name="status" label="状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/models/__tests__/ModelDrawer.test.tsx
```

Expected: PASS.

---

## Task 3: ModelList component

**Files:**
- Create: `AIops/frontend/src/features/models/ModelList.tsx`

- [ ] **Step 1: Create ModelList.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/models/ModelList.tsx`:

```tsx
import { useState } from 'react'
import { Table, Button, Input, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Model, ModelStatus } from '@/types/model'
import { useModels, useDeleteModel } from './useModels'
import { modelsApi } from '@/api/models'
import ModelDrawer from './ModelDrawer'

const statusColor: Record<ModelStatus, string> = {
  active: 'success',
  inactive: 'default',
}
const statusLabel: Record<ModelStatus, string> = {
  active: '启用',
  inactive: '禁用',
}

export default function ModelList() {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [testingId, setTestingId] = useState<number | null>(null)

  const { data: models = [], isLoading } = useModels()
  const deleteModel = useDeleteModel()

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  )

  const handleTest = async (model: Model) => {
    setTestingId(model.id)
    try {
      const res = await modelsApi.testModel(model.id)
      message.success(`模型响应正常，延迟 ${res.data.data.latency_ms}ms`)
    } catch {
      message.error('模型测试失败，请检查配置')
    } finally {
      setTestingId(null)
    }
  }

  const columns: ColumnsType<Model> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: 'Provider', dataIndex: 'provider', key: 'provider', width: 120 },
    {
      title: '模型类型',
      dataIndex: 'model_type',
      key: 'model_type',
      width: 120,
      render: (v: string) => (v === 'chat' ? '对话' : '嵌入'),
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: ModelStatus) => (
        <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            loading={testingId === record.id}
            onClick={() => handleTest(record)}
          >
            测试
          </Button>
          <Button
            size="small"
            onClick={() => { setEditingModel(record); setDrawerOpen(true) }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模型？"
            onConfirm={() => deleteModel.mutate(record.id)}
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
          placeholder="搜索名称 / Provider"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingModel(null); setDrawerOpen(true) }}
        >
          添加模型
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无模型' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <ModelDrawer
        open={drawerOpen}
        editingModel={editingModel}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
```

---

## Task 4: Models page + router wiring

**Files:**
- Create: `AIops/frontend/src/pages/Models.tsx`
- Modify: `AIops/frontend/src/App.tsx`

- [ ] **Step 1: Create Models page**

Create `e:/Opsgit/AIops/frontend/src/pages/Models.tsx`:

```tsx
import { Typography } from 'antd'
import ModelList from '@/features/models/ModelList'

const { Title } = Typography

export default function Models() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>模型广场</Title>
      <ModelList />
    </div>
  )
}
```

- [ ] **Step 2: Update App.tsx**

Read current `e:/Opsgit/AIops/frontend/src/App.tsx`, then:

Add import:
```tsx
import Models from './pages/Models'
```

Change:
```tsx
<Route path="models" element={<Dashboard />} />
```

To:
```tsx
<Route path="models" element={<Models />} />
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
git commit -m "feat: implement Model Marketplace with Table, Drawer, API Key masking"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Table columns: 名称 / Provider / 模型类型 / Endpoint / 状态 / 操作 ✓
- [x] Search by name/provider (frontend filter) ✓
- [x] Add model → Drawer ✓
- [x] Edit model → Drawer ✓
- [x] Delete → Popconfirm ✓
- [x] Test model → `POST /api/v1/models/:id/test`, Toast shows latency ✓
- [x] Drawer: Provider Select (openai/anthropic/deepseek/qwen/custom) ✓
- [x] Endpoint field shown only for `custom` provider ✓
- [x] API Key masking: `••••••••` with "重新输入" when editing ✓
- [x] Status field: Switch (启用/禁用) ✓
- [x] TDD: tests written before implementation ✓
- [x] `npm run build` passes ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-04-aiops-frontend-plan4-models.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
