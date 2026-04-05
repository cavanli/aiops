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
  registerGetFlowData,
  registerNodeDataChange,
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
