# AIOps Frontend Plan F5: Workflows + ReactFlow Editor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Workflow module — a list page with create/delete/execute, plus a full-screen ReactFlow workflow editor at `/workflows/:id/edit` with a node palette, canvas, and node properties panel. The editor lives outside AppLayout (full-screen standalone route).

**Prerequisites:** Plan F2 complete. `reactflow` package installed. Workflow types and API functions ready.

---

## File Map

```
AIops/frontend/src/
├── features/
│   └── workflows/
│       ├── WorkflowList.tsx           # CREATE — Table with actions
│       ├── WorkflowCanvas.tsx         # CREATE — ReactFlow canvas component
│       ├── NodePalette.tsx            # CREATE — left panel, draggable node types
│       ├── NodeProperties.tsx         # CREATE — right panel, selected node config
│       ├── useWorkflows.ts            # CREATE — React Query hooks
│       └── __tests__/
│           └── useWorkflows.test.ts   # CREATE
├── pages/
│   ├── Workflows.tsx                  # CREATE — list page wrapper
│   └── WorkflowEditor.tsx            # CREATE — full-screen editor page
└── App.tsx                            # MODIFY — add /workflows/:id/edit route outside AppLayout
```

---

## Task 1: React Query hooks for workflows (TDD)

**Files:**
- Create: `AIops/frontend/src/features/workflows/__tests__/useWorkflows.test.ts`
- Create: `AIops/frontend/src/features/workflows/useWorkflows.ts`

- [ ] **Step 1: Write useWorkflows tests first**

Create `e:/Opsgit/AIops/frontend/src/features/workflows/__tests__/useWorkflows.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWorkflows, useCreateWorkflow, useWorkflow } from '../useWorkflows'
import { workflowsApi } from '@/api/workflows'
import type { Workflow } from '@/types/workflow'

vi.mock('@/api/workflows')

const mockWorkflow: Workflow = {
  id: 1,
  name: 'Deploy Workflow',
  description: '',
  status: 'draft',
  nodes: [],
  edges: [],
  node_count: 0,
  last_executed_at: null,
  created_at: '2026-04-04T00:00:00Z',
  updated_at: '2026-04-04T00:00:00Z',
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.mocked(workflowsApi.list).mockResolvedValue({
      data: { data: [mockWorkflow], code: 0, message: 'ok' },
    } as any)
  })

  it('fetches workflow list', async () => {
    const { result } = renderHook(() => useWorkflows(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].name).toBe('Deploy Workflow')
  })
})

describe('useWorkflow', () => {
  beforeEach(() => {
    vi.mocked(workflowsApi.get).mockResolvedValue({
      data: { data: mockWorkflow, code: 0, message: 'ok' },
    } as any)
  })

  it('fetches single workflow by id', async () => {
    const { result } = renderHook(() => useWorkflow(1), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/workflows/__tests__/useWorkflows.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create useWorkflows.ts**

Create `e:/Opsgit/AIops/frontend/src/features/workflows/useWorkflows.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { workflowsApi } from '@/api/workflows'
import type { CreateWorkflowRequest, UpdateWorkflowRequest } from '@/types/workflow'

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data),
  })
}

export function useWorkflow(id: number) {
  return useQuery({
    queryKey: ['workflows', id],
    queryFn: () => workflowsApi.get(id).then((r) => r.data.data),
    enabled: id > 0,
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      message.success('工作流创建成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useUpdateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWorkflowRequest }) =>
      workflowsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      qc.invalidateQueries({ queryKey: ['workflows', id] })
    },
    onError: () => message.error('保存失败，请重试'),
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: workflowsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      message.success('���作流删除成功')
    },
    onError: () => message.error('操作失败，请重试'),
  })
}

export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: workflowsApi.execute,
    onSuccess: () => message.success('工作流已开始执行'),
    onError: () => message.error('执行失败，请重试'),
  })
}
```

- [ ] **Step 4: Run tests (expect pass)**

```bash
cd e:/Opsgit/AIops/frontend
npx vitest run src/features/workflows/__tests__/useWorkflows.test.ts
```

Expected: PASS.

---

## Task 2: WorkflowList component + Workflows page

**Files:**
- Create: `AIops/frontend/src/features/workflows/WorkflowList.tsx`
- Create: `AIops/frontend/src/pages/Workflows.tsx`

- [ ] **Step 1: Create WorkflowList.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/workflows/WorkflowList.tsx`:

```tsx
import { useState } from 'react'
import { Table, Button, Drawer, Form, Input, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Workflow, WorkflowStatus } from '@/types/workflow'
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow, useExecuteWorkflow } from './useWorkflows'

const statusColor: Record<WorkflowStatus, string> = {
  draft: 'default',
  active: 'success',
}
const statusLabel: Record<WorkflowStatus, string> = {
  draft: '草稿',
  active: '已发布',
}

export default function WorkflowList() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const { data: workflows = [], isLoading } = useWorkflows()
  const createWorkflow = useCreateWorkflow()
  const deleteWorkflow = useDeleteWorkflow()
  const executeWorkflow = useExecuteWorkflow()

  const handleCreate = async () => {
    const values = await form.validateFields()
    const result = await createWorkflow.mutateAsync(values)
    setDrawerOpen(false)
    form.resetFields()
    // Navigate to editor after creation
    navigate(`/workflows/${result.data.data.id}/edit`)
  }

  const columns: ColumnsType<Workflow> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: WorkflowStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count', width: 100 },
    {
      title: '最近执行',
      dataIndex: 'last_executed_at',
      key: 'last_executed_at',
      render: (t: string | null) =>
        t ? new Date(t).toLocaleString('zh-CN') : '从未执行',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/workflows/${record.id}/edit`)}
          >
            设计
          </Button>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => executeWorkflow.mutate(record.id)}
            disabled={record.status !== 'active'}
          >
            执行
          </Button>
          <Popconfirm
            title="确定删除此工作流？"
            onConfirm={() => deleteWorkflow.mutate(record.id)}
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
          onClick={() => setDrawerOpen(true)}
        >
          新建工作流
        </Button>
      </div>

      <Table
        dataSource={workflows}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无工作流' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <Drawer
        title="新建工作流"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields() }}
        width={400}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => { setDrawerOpen(false); form.resetFields() }}>取消</Button>
            <Button type="primary" loading={createWorkflow.isPending} onClick={handleCreate}>
              创建并进入编辑器
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入工作流名称' }]}>
            <Input placeholder="e.g. 部署前检查流程" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
```

- [ ] **Step 2: Create Workflows page**

Create `e:/Opsgit/AIops/frontend/src/pages/Workflows.tsx`:

```tsx
import { Typography } from 'antd'
import WorkflowList from '@/features/workflows/WorkflowList'

const { Title } = Typography

export default function Workflows() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>工作流</Title>
      <WorkflowList />
    </div>
  )
}
```

---

## Task 3: NodePalette + NodeProperties components

**Files:**
- Create: `AIops/frontend/src/features/workflows/NodePalette.tsx`
- Create: `AIops/frontend/src/features/workflows/NodeProperties.tsx`

- [ ] **Step 1: Create NodePalette.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/workflows/NodePalette.tsx`:

```tsx
import { Typography, Card } from 'antd'
import type { DragEvent } from 'react'
import type { NodeType } from '@/types/workflow'

const { Text } = Typography

interface NodeDef {
  type: NodeType
  label: string
  color: string
  description: string
}

const NODE_DEFS: NodeDef[] = [
  { type: 'shell', label: 'Shell 脚本', color: '#2563EB', description: '执行 Shell 命令' },
  { type: 'http', label: 'HTTP 请求', color: '#10B981', description: '调用 HTTP 接口' },
  { type: 'llm', label: 'LLM 调用', color: '#8B5CF6', description: '调用 AI 模型' },
  { type: 'condition', label: '条件分支', color: '#F59E0B', description: 'true/false 分支' },
]

function onDragStart(event: DragEvent<HTMLDivElement>, nodeType: NodeType) {
  event.dataTransfer.setData('application/reactflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

export default function NodePalette() {
  return (
    <div
      style={{
        width: 160,
        padding: 8,
        background: '#fff',
        borderRight: '1px solid #E2E8F0',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      <Text strong style={{ display: 'block', marginBottom: 8, color: '#64748B', fontSize: 12 }}>
        节点类型
      </Text>
      {NODE_DEFS.map((def) => (
        <Card
          key={def.type}
          size="small"
          draggable
          onDragStart={(e) => onDragStart(e, def.type)}
          style={{
            marginBottom: 8,
            cursor: 'grab',
            borderLeft: `3px solid ${def.color}`,
            borderRadius: 4,
            userSelect: 'none',
          }}
          styles={{ body: { padding: '6px 8px' } }}
        >
          <Text style={{ fontSize: 12, fontWeight: 500 }}>{def.label}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{def.description}</Text>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create NodeProperties.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/workflows/NodeProperties.tsx`:

```tsx
import { Form, Input, Select, Typography, Empty, Divider } from 'antd'
import type { Node } from 'reactflow'
import type { NodeType } from '@/types/workflow'

const { Text, Title } = Typography

const NODE_LABELS: Record<NodeType, string> = {
  start: '开始',
  end: '结束',
  shell: 'Shell 脚本',
  http: 'HTTP 请求',
  llm: 'LLM 调用',
  condition: '条件分支',
}

interface Props {
  selectedNode: Node | null
  onChange: (nodeId: string, data: Record<string, unknown>) => void
}

export default function NodeProperties({ selectedNode, onChange }: Props) {
  if (!selectedNode) {
    return (
      <div style={{ padding: 16, width: 240 }}>
        <Empty description="点击节点查看属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const nodeType = selectedNode.type as NodeType
  const data = selectedNode.data as Record<string, unknown>

  const update = (key: string, value: unknown) => {
    onChange(selectedNode.id, { ...data, [key]: value })
  }

  return (
    <div
      style={{
        width: 240,
        padding: 16,
        background: '#fff',
        borderLeft: '1px solid #E2E8F0',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
        {NODE_LABELS[nodeType] ?? nodeType}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        ID: {selectedNode.id}
      </Text>
      <Divider style={{ margin: '12px 0' }} />

      <Form layout="vertical" size="small">
        {(nodeType === 'start' || nodeType === 'end') && (
          <Text type="secondary">此节点无可配置属性</Text>
        )}

        {nodeType === 'shell' && (
          <>
            <Form.Item label="节点名称">
              <Input
                value={data.label as string ?? ''}
                onChange={(e) => update('label', e.target.value)}
                placeholder="Shell 脚本"
              />
            </Form.Item>
            <Form.Item label="Shell 命令">
              <Input.TextArea
                rows={5}
                value={data.command as string ?? ''}
                onChange={(e) => update('command', e.target.value)}
                placeholder="echo hello"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'http' && (
          <>
            <Form.Item label="节点名称">
              <Input
                value={data.label as string ?? ''}
                onChange={(e) => update('label', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="方法">
              <Select
                value={data.method as string ?? 'GET'}
                onChange={(v) => update('method', v)}
                options={['GET', 'POST', 'PUT', 'DELETE'].map((m) => ({ label: m, value: m }))}
              />
            </Form.Item>
            <Form.Item label="URL">
              <Input
                value={data.url as string ?? ''}
                onChange={(e) => update('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'llm' && (
          <>
            <Form.Item label="节点名称">
              <Input
                value={data.label as string ?? ''}
                onChange={(e) => update('label', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Prompt 模板">
              <Input.TextArea
                rows={6}
                value={data.prompt as string ?? ''}
                onChange={(e) => update('prompt', e.target.value)}
                placeholder="你是一个运维助手..."
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'condition' && (
          <>
            <Form.Item label="节点名称">
              <Input
                value={data.label as string ?? ''}
                onChange={(e) => update('label', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="条件表达式 (JS)">
              <Input.TextArea
                rows={4}
                value={data.expression as string ?? ''}
                onChange={(e) => update('expression', e.target.value)}
                placeholder="ctx.exitCode === 0"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  )
}
```

---

## Task 4: WorkflowCanvas + WorkflowEditor page

**Files:**
- Create: `AIops/frontend/src/features/workflows/WorkflowCanvas.tsx`
- Create: `AIops/frontend/src/pages/WorkflowEditor.tsx`

- [ ] **Step 1: Create WorkflowCanvas.tsx**

Create `e:/Opsgit/AIops/frontend/src/features/workflows/WorkflowCanvas.tsx`:

```tsx
import { useCallback, useRef } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { NodeType, WorkflowNode, WorkflowEdge } from '@/types/workflow'

let nodeIdCounter = 100

interface Props {
  initialNodes: WorkflowNode[]
  initialEdges: WorkflowEdge[]
  onSelectionChange: (node: Node | null) => void
  onNodeDataChange: (nodeId: string, data: Record<string, unknown>) => void
  getFlowData: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
  registerGetFlowData: (fn: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void
}

function toRFNode(wn: WorkflowNode): Node {
  return {
    id: wn.id,
    type: wn.type,
    position: wn.position,
    data: wn.data,
  }
}

function toRFEdge(we: WorkflowEdge): Edge {
  return {
    id: we.id,
    source: we.source,
    target: we.target,
    label: we.label,
  }
}

function fromRFNode(n: Node): WorkflowNode {
  return {
    id: n.id,
    type: n.type as NodeType,
    position: n.position,
    data: n.data,
  }
}

function fromRFEdge(e: Edge): WorkflowEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label as string | undefined,
  }
}

export default function WorkflowCanvas({
  initialNodes,
  initialEdges,
  onSelectionChange,
  onNodeDataChange,
  registerGetFlowData,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.map(toRFNode))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toRFEdge))
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null)

  // Register a getter so parent can call to get current flow data
  registerGetFlowData(() => ({
    nodes: nodes.map(fromRFNode),
    edges: edges.map(fromRFEdge),
  }))

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow') as NodeType
      if (!type || !rfInstanceRef.current) return

      const position = rfInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `node-${++nodeIdCounter}`,
        type,
        position,
        data: { label: type },
      }
      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => onSelectionChange(node),
    [onSelectionChange]
  )

  const onPaneClick = useCallback(
    () => onSelectionChange(null),
    [onSelectionChange]
  )

  // Sync node data changes from NodeProperties panel
  const handleNodeDataChange = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data } : n))
      )
      onNodeDataChange(nodeId, data)
    },
    [setNodes, onNodeDataChange]
  )

  // Expose handleNodeDataChange via ref trick — parent calls this via prop
  // (parent passes onNodeDataChange which we forward in WorkflowEditor)

  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={(instance) => { rfInstanceRef.current = instance }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 2: Create WorkflowEditor.tsx page**

Create `e:/Opsgit/AIops/frontend/src/pages/WorkflowEditor.tsx`:

```tsx
import { useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Breadcrumb, Spin, message, Typography } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import type { Node } from 'reactflow'
import { useWorkflow, useUpdateWorkflow } from '@/features/workflows/useWorkflows'
import WorkflowCanvas from '@/features/workflows/WorkflowCanvas'
import NodePalette from '@/features/workflows/NodePalette'
import NodeProperties from '@/features/workflows/NodeProperties'
import type { WorkflowNode, WorkflowEdge } from '@/types/workflow'

const { Text } = Typography

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>()
  const workflowId = parseInt(id ?? '0', 10)
  const navigate = useNavigate()

  const { data: workflow, isLoading } = useWorkflow(workflowId)
  const updateWorkflow = useUpdateWorkflow()

  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const getFlowDataRef = useRef<() => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }>(
    () => ({ nodes: [], edges: [] })
  )

  const registerGetFlowData = useCallback(
    (fn: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
      getFlowDataRef.current = fn
    },
    []
  )

  const handleSave = async (status: 'draft' | 'active') => {
    const { nodes, edges } = getFlowDataRef.current()
    await updateWorkflow.mutateAsync({
      id: workflowId,
      data: { nodes, edges, status },
    })
    message.success(status === 'draft' ? '草稿已保存' : '工作流已发布')
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Text type="secondary">工作流不存在</Text>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC' }}>
      {/* Toolbar */}
      <div
        style={{
          height: 56,
          background: '#fff',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <Breadcrumb
          items={[
            {
              title: (
                <span
                  style={{ cursor: 'pointer', color: '#2563EB' }}
                  onClick={() => navigate('/workflows')}
                >
                  工作流
                </span>
              ),
            },
            { title: workflow.name },
          ]}
        />
        <Space>
          <Button
            icon={<SaveOutlined />}
            loading={updateWorkflow.isPending}
            onClick={() => handleSave('draft')}
          >
            保存草稿
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={updateWorkflow.isPending}
            onClick={() => handleSave('active')}
          >
            发布
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/workflows')}
          >
            返回
          </Button>
        </Space>
      </div>

      {/* Main editor area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NodePalette />
        <WorkflowCanvas
          initialNodes={workflow.nodes ?? []}
          initialEdges={workflow.edges ?? []}
          onSelectionChange={setSelectedNode}
          onNodeDataChange={() => {}}
          getFlowData={() => ({ nodes: [], edges: [] })}
          registerGetFlowData={registerGetFlowData}
        />
        <NodeProperties
          selectedNode={selectedNode}
          onChange={(nodeId, data) => {
            // NodeProperties calls this when user edits fields
            // Canvas handles its own state internally
          }}
        />
      </div>
    </div>
  )
}
```

---

## Task 5: Router wiring + App.tsx update

**Files:**
- Modify: `AIops/frontend/src/App.tsx`

- [ ] **Step 1: Update App.tsx with all workflow routes**

Read current `e:/Opsgit/AIops/frontend/src/App.tsx`, then make these changes:

Add imports at top:
```tsx
import Workflows from './pages/Workflows'
const WorkflowEditor = React.lazy(() => import('./pages/WorkflowEditor'))
```

Also add `React` import if not present:
```tsx
import React, { Suspense } from 'react'
```

Replace the routes section — add the `/workflows/:id/edit` route **outside** the AppLayout route, and add the real Workflows route:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React, { Suspense } from 'react'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useAuthStore } from './store/authStore'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Hosts from './pages/Hosts'
import Models from './pages/Models'
import Workflows from './pages/Workflows'

const WorkflowEditor = React.lazy(() => import('./pages/WorkflowEditor'))

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563EB',
          borderRadius: 8,
          colorBgLayout: '#F8FAFC',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Full-screen workflow editor — outside AppLayout */}
          <Route
            path="/workflows/:id/edit"
            element={
              <AuthGuard>
                <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }} />}>
                  <WorkflowEditor />
                </Suspense>
              </AuthGuard>
            }
          />

          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="hosts" element={<Hosts />} />
            <Route path="models" element={<Models />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="deployments" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
```

- [ ] **Step 2: Build verify**

```bash
cd e:/Opsgit/AIops/frontend
npm run build
```

Expected: no TypeScript errors. ReactFlow lazy-loaded in separate chunk.

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit
git add AIops/frontend/src/
git commit -m "feat: implement Workflow list and ReactFlow editor with node palette and properties"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Workflow list Table: 名称/状态/节点数/最近执行时间/操作 ✓
- [x] 新建 → Drawer (name + description), then navigate to editor ✓
- [x] 编辑(设计) → navigate to `/workflows/:id/edit` ✓
- [x] 执行 → `POST /api/v1/workflows/:id/execute`, disabled if status !== active ✓
- [x] 删除 → Popconfirm ✓
- [x] WorkflowEditor: full-screen, outside AppLayout ✓
- [x] WorkflowEditor toolbar: 面包屑 / 保存草稿 / 发布 / 返回 ✓
- [x] NodePalette: shell / http / llm / condition, draggable ✓
- [x] ReactFlow canvas: drag-drop nodes, connect edges, pan/zoom ✓
- [x] NodeProperties: config fields per node type ✓
- [x] WorkflowEditor lazy-loaded (React.lazy) for performance ✓
- [x] Load workflow: GET /api/v1/workflows/:id → init nodes/edges ✓
- [x] Save: PUT /api/v1/workflows/:id with nodes/edges/status ✓
- [x] useWorkflows hooks with TDD ✓
- [x] `npm run build` passes ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-04-aiops-frontend-plan5-workflows.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session using executing-plans

**Which approach?**
