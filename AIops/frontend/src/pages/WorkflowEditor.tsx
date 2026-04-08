import { useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Breadcrumb, Spin, message, Typography, Tag, Select } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import type { Node } from 'reactflow'
import { useWorkflow, useUpdateWorkflow } from '@/features/workflows/useWorkflows'
import WorkflowCanvas from '@/features/workflows/WorkflowCanvas'
import NodePalette from '@/features/workflows/NodePalette'
import NodeProperties from '@/features/workflows/NodeProperties'
import type { WorkflowNode, WorkflowEdge } from '@/types/workflow'
import { useClusterStore, CLUSTER_LABELS, type ClusterEnv } from '@/store/clusterStore'

const { Text } = Typography

/**
 * Default deployment flow template — mirrors the screenshot:
 * 开始 → 环境检测 → AI分析 → 条件判断 → 蓝绿部署 / 回滚 → 发送通知 → 结束
 */
const DEFAULT_NODES: WorkflowNode[] = [
  { id: 'n1', type: 'start',        position: { x: 280, y: 20  }, data: { label: '开始' } },
  { id: 'n2', type: 'env_check',    position: { x: 250, y: 120 }, data: { label: '环境检测', env: 'prod', checks: ['node_ready', 'disk'] } },
  { id: 'n3', type: 'ai_decision',  position: { x: 248, y: 230 }, data: { label: 'AI 分析', model: 'deepseek-v3', prompt: '根据环境检测报告，判断是否可以安全部署，输出 proceed 或 rollback' } },
  { id: 'n4', type: 'condition',    position: { x: 220, y: 340 }, data: { label: '选择部署策略', expression: "ctx.aiResult === 'proceed'", trueLabel: '通过', falseLabel: '不通过' } },
  { id: 'n5', type: 'blue_green',   position: { x: 80,  y: 480 }, data: { label: '蓝绿部署', service: 'nginx', image: 'nginx:latest', strategy: 'canary10' } },
  { id: 'n6', type: 'rollback',     position: { x: 380, y: 480 }, data: { label: '回滚操作', reason: 'AI 分析评估不通过' } },
  { id: 'n7', type: 'notification', position: { x: 248, y: 600 }, data: { label: '发送通知', channels: ['dingtalk'], template: '【AIOps】{{workflow.name}} 部署{{status}}' } },
  { id: 'n8', type: 'end',          position: { x: 280, y: 700 }, data: { label: '结束' } },
]

const DEFAULT_EDGES: WorkflowEdge[] = [
  { id: 'e1', source: 'n1', target: 'n2', animated: true },
  { id: 'e2', source: 'n2', target: 'n3', animated: true },
  { id: 'e3', source: 'n3', target: 'n4', animated: true },
  { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'true',  label: '通过', animated: true },
  { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'false', label: '不通过', animated: true },
  { id: 'e6', source: 'n5', target: 'n7', animated: true },
  { id: 'e7', source: 'n6', target: 'n7', animated: true },
  { id: 'e8', source: 'n7', target: 'n8', animated: true },
]

const CLUSTER_COLORS: Record<ClusterEnv, string> = {
  prod:    '#DC2626',
  staging: '#D97706',
  dev:     '#16A34A',
}

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>()
  const workflowId = parseInt(id ?? '0', 10)
  const navigate = useNavigate()
  const { env, setEnv } = useClusterStore()

  const { data: workflow, isLoading } = useWorkflow(workflowId)
  const updateWorkflow = useUpdateWorkflow()

  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const getFlowDataRef = useRef<() => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }>(
    () => ({ nodes: [], edges: [] })
  )
  const nodeDataChangeRef = useRef<(nodeId: string, data: Record<string, unknown>) => void>(
    () => {}
  )

  const registerGetFlowData = useCallback(
    (fn: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => {
      getFlowDataRef.current = fn
    },
    []
  )

  const registerNodeDataChange = useCallback(
    (fn: (nodeId: string, data: Record<string, unknown>) => void) => {
      nodeDataChangeRef.current = fn
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

  // Use saved nodes/edges if they exist, otherwise show the default deployment template
  const initialNodes = workflow.nodes && workflow.nodes.length > 0 ? workflow.nodes : DEFAULT_NODES
  const initialEdges = workflow.edges && workflow.edges.length > 0 ? workflow.edges : DEFAULT_EDGES

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
          {/* Cluster environment badge */}
          <Tag
            color={CLUSTER_COLORS[env]}
            style={{ fontWeight: 600, cursor: 'default' }}
          >
            {CLUSTER_LABELS[env]}
          </Tag>
        </div>

        <Space>
          {/* Inline cluster switcher */}
          <Select
            size="small"
            value={env}
            onChange={(v) => setEnv(v as ClusterEnv)}
            style={{ width: 110 }}
            options={[
              { label: '生产集群', value: 'prod' },
              { label: '预发集群', value: 'staging' },
              { label: '开发集群', value: 'dev' },
            ]}
          />
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
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onSelectionChange={setSelectedNode}
          getFlowData={() => ({ nodes: [], edges: [] })}
          registerGetFlowData={registerGetFlowData}
          registerNodeDataChange={registerNodeDataChange}
        />
        <NodeProperties
          selectedNode={selectedNode}
          onChange={(nodeId, data) => nodeDataChangeRef.current(nodeId, data)}
        />
      </div>
    </div>
  )
}
