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
          <Text type="secondary">此节点无可配置��性</Text>
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
