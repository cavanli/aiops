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
