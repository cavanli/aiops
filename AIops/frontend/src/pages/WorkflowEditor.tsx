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
