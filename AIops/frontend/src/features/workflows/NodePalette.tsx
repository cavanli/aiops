import { Typography } from 'antd'
import type { DragEvent } from 'react'
import type { NodeType } from '@/types/workflow'

const { Text } = Typography

interface NodeDef {
  type: NodeType
  label: string
  color: string
  description: string
}

interface NodeGroup {
  title: string
  nodes: NodeDef[]
}

const NODE_GROUPS: NodeGroup[] = [
  {
    title: '流程控制',
    nodes: [
      { type: 'start', label: '开始节点', color: '#16A34A', description: '工作流入口' },
      { type: 'end', label: '结束节点', color: '#DC2626', description: '工作流出口' },
      { type: 'condition', label: '条件判断', color: '#D97706', description: '多分支条件' },
    ],
  },
  {
    title: '部署操作',
    nodes: [
      { type: 'env_check', label: '环境检测', color: '#2563EB', description: '检测目标环境状态' },
      { type: 'blue_green', label: '蓝绿部署', color: '#0891B2', description: '零停机蓝绿切换' },
      { type: 'rollback', label: '回滚操作', color: '#E11D48', description: '回退到上一版本' },
      { type: 'skill', label: '技能执行', color: '#4F46E5', description: '调用技能库脚本' },
    ],
  },
  {
    title: 'AI 决策',
    nodes: [
      { type: 'ai_decision', label: 'AI 分析', color: '#7C3AED', description: '调用 LLM 做决策' },
      { type: 'llm', label: 'LLM 调用', color: '#7C3AED', description: '调用 AI 模型' },
    ],
  },
  {
    title: '集成',
    nodes: [
      { type: 'notification', label: '发送通知', color: '#64748B', description: '钉钉 / 企微 / 邮件' },
      { type: 'shell', label: 'Shell 脚本', color: '#2563EB', description: '执行任意 Shell' },
      { type: 'http', label: 'HTTP 请求', color: '#0D9488', description: '调用外部接口' },
    ],
  },
]

function onDragStart(event: DragEvent<HTMLDivElement>, nodeType: NodeType) {
  event.dataTransfer.setData('application/reactflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

export default function NodePalette() {
  return (
    <div
      style={{
        width: 176,
        padding: '12px 8px',
        background: '#fff',
        borderRight: '1px solid #E2E8F0',
        overflowY: 'auto',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {NODE_GROUPS.map((group) => (
        <div key={group.title} style={{ marginBottom: 16 }}>
          <Text
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            {group.title}
          </Text>
          {group.nodes.map((def) => (
            <div
              key={def.type}
              draggable
              onDragStart={(e) => onDragStart(e, def.type)}
              style={{
                marginBottom: 6,
                cursor: 'grab',
                padding: '6px 8px',
                borderLeft: `3px solid ${def.color}`,
                borderRadius: 4,
                background: '#F8FAFC',
                userSelect: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = '#F1F5F9'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 500, display: 'block' }}>
                {def.label}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {def.description}
              </Text>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
