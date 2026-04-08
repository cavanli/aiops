/**
 * Custom React Flow node renderers for deployment workflow node types.
 *
 * Color palette (matching screenshot):
 *   start        — green   #16A34A
 *   end          — red     #DC2626
 *   env_check    — blue    #2563EB
 *   ai_decision  — purple  #7C3AED
 *   condition    — orange  #D97706  (diamond shape via rotate)
 *   skill        — indigo  #4F46E5
 *   blue_green   — cyan    #0891B2
 *   rollback     — rose    #E11D48
 *   notification — slate   #64748B
 *   shell        — blue    #2563EB
 *   http         — teal    #0D9488
 *   llm          — violet  #7C3AED
 */

import { Handle, Position, type NodeProps } from 'reactflow'

const BASE_NODE: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  minWidth: 130,
  textAlign: 'center',
  position: 'relative',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  border: '2px solid transparent',
}

function labelFor(data: Record<string, unknown>, fallback: string): string {
  return (data.label as string) || fallback
}

function StdNode({
  data,
  fallback,
  bg,
  borderColor,
  hasTarget = true,
  hasSource = true,
}: {
  data: Record<string, unknown>
  fallback: string
  bg: string
  borderColor: string
  hasTarget?: boolean
  hasSource?: boolean
}) {
  return (
    <div style={{ ...BASE_NODE, background: bg, borderColor }}>
      {hasTarget && <Handle type="target" position={Position.Top} />}
      {labelFor(data, fallback)}
      {hasSource && <Handle type="source" position={Position.Bottom} />}
    </div>
  )
}

export function StartNode({ data }: NodeProps) {
  return (
    <div
      style={{
        ...BASE_NODE,
        background: '#16A34A',
        borderColor: '#15803D',
        borderRadius: 24,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <Handle type="source" position={Position.Bottom} />
      {labelFor(data, '开始')}
    </div>
  )
}

export function EndNode({ data }: NodeProps) {
  return (
    <div
      style={{
        ...BASE_NODE,
        background: '#DC2626',
        borderColor: '#B91C1C',
        borderRadius: 24,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <Handle type="target" position={Position.Top} />
      {labelFor(data, '结束')}
    </div>
  )
}

export function EnvCheckNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="环境检测" bg="#2563EB" borderColor="#1D4ED8" />
  )
}

export function AiDecisionNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="AI 分析" bg="#7C3AED" borderColor="#6D28D9" />
  )
}

export function ConditionNode({ data }: NodeProps) {
  const label = labelFor(data, '条件判断')
  return (
    <div
      style={{
        width: 120,
        height: 60,
        background: '#D97706',
        borderColor: '#B45309',
        border: '2px solid #B45309',
        transform: 'rotate(45deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ transform: 'rotate(-45deg)', top: -6, left: '50%' }}
      />
      <span
        style={{
          transform: 'rotate(-45deg)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ transform: 'rotate(-45deg)', bottom: -6, left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ transform: 'rotate(-45deg)', right: -6, top: '50%' }}
      />
    </div>
  )
}

export function SkillNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="技能执行" bg="#4F46E5" borderColor="#4338CA" />
  )
}

export function BlueGreenNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="蓝绿部署" bg="#0891B2" borderColor="#0E7490" />
  )
}

export function RollbackNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="回滚操作" bg="#E11D48" borderColor="#BE123C" />
  )
}

export function NotificationNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="发送通知" bg="#64748B" borderColor="#475569" />
  )
}

export function ShellNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="Shell 脚本" bg="#2563EB" borderColor="#1D4ED8" />
  )
}

export function HttpNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="HTTP 请求" bg="#0D9488" borderColor="#0F766E" />
  )
}

export function LlmNode({ data }: NodeProps) {
  return (
    <StdNode data={data} fallback="LLM 调用" bg="#7C3AED" borderColor="#6D28D9" />
  )
}

/** Map passed to ReactFlow `nodeTypes` prop */
export const NODE_TYPES = {
  start: StartNode,
  end: EndNode,
  env_check: EnvCheckNode,
  ai_decision: AiDecisionNode,
  condition: ConditionNode,
  skill: SkillNode,
  blue_green: BlueGreenNode,
  rollback: RollbackNode,
  notification: NotificationNode,
  shell: ShellNode,
  http: HttpNode,
  llm: LlmNode,
}
