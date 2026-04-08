import { useCallback, useRef, useMemo } from 'react'
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
import { NODE_TYPES } from './CustomNodes'

let nodeIdCounter = 100

const DEFAULT_LABEL_MAP: Record<string, string> = {
  start:        '开始',
  end:          '结束',
  env_check:    '环境检测',
  ai_decision:  'AI 分析',
  condition:    '条件判断',
  skill:        '技能执行',
  blue_green:   '蓝绿部署',
  rollback:     '回滚操作',
  notification: '发送通知',
  shell:        'Shell 脚本',
  http:         'HTTP 请求',
  llm:          'LLM 调用',
}

interface Props {
  initialNodes: WorkflowNode[]
  initialEdges: WorkflowEdge[]
  onSelectionChange: (node: Node | null) => void
  getFlowData: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
  registerGetFlowData: (fn: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void
  registerNodeDataChange: (fn: (nodeId: string, data: Record<string, unknown>) => void) => void
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
    sourceHandle: we.sourceHandle,
    label: we.label,
    animated: we.animated,
    style: we.animated ? { stroke: '#6366F1' } : undefined,
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
    sourceHandle: e.sourceHandle ?? undefined,
    label: e.label as string | undefined,
    animated: e.animated,
  }
}

export default function WorkflowCanvas({
  initialNodes,
  initialEdges,
  onSelectionChange,
  registerGetFlowData,
  registerNodeDataChange,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.map(toRFNode))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toRFEdge))
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null)

  // Stable nodeTypes reference — required by React Flow to avoid re-renders
  const nodeTypes = useMemo(() => NODE_TYPES, [])

  // Register a getter so parent can call to get current flow data
  registerGetFlowData(() => ({
    nodes: nodes.map(fromRFNode),
    edges: edges.map(fromRFEdge),
  }))

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge({ ...connection, animated: true, style: { stroke: '#6366F1' } }, eds)
      ),
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
        data: { label: DEFAULT_LABEL_MAP[type] ?? type },
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
    },
    [setNodes]
  )

  // Register handler so parent can wire NodeProperties.onChange → canvas
  registerNodeDataChange(handleNodeDataChange)

  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={(instance) => { rfInstanceRef.current = instance }}
        fitView
        deleteKeyCode="Delete"
      >
        <Background color="#E2E8F0" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const colorMap: Record<string, string> = {
              start: '#16A34A', end: '#DC2626', env_check: '#2563EB',
              ai_decision: '#7C3AED', condition: '#D97706', skill: '#4F46E5',
              blue_green: '#0891B2', rollback: '#E11D48', notification: '#64748B',
              shell: '#2563EB', http: '#0D9488', llm: '#7C3AED',
            }
            return colorMap[n.type ?? ''] ?? '#94A3B8'
          }}
          style={{ borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  )
}
