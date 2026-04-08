import { Form, Input, Select, Typography, Empty, Divider, Tag } from 'antd'
import type { Node } from 'reactflow'
import type { NodeType } from '@/types/workflow'

const { Text, Title } = Typography

interface NodeMeta {
  label: string
  color: string
}

const NODE_META: Record<NodeType, NodeMeta> = {
  start:        { label: '开始',     color: '#16A34A' },
  end:          { label: '结束',     color: '#DC2626' },
  env_check:    { label: '环境检测', color: '#2563EB' },
  ai_decision:  { label: 'AI 分析',  color: '#7C3AED' },
  condition:    { label: '条件判断', color: '#D97706' },
  skill:        { label: '技能执行', color: '#4F46E5' },
  blue_green:   { label: '蓝绿部署', color: '#0891B2' },
  rollback:     { label: '回滚操作', color: '#E11D48' },
  notification: { label: '发送通知', color: '#64748B' },
  shell:        { label: 'Shell 脚本', color: '#2563EB' },
  http:         { label: 'HTTP 请求', color: '#0D9488' },
  llm:          { label: 'LLM 调用', color: '#7C3AED' },
}

interface Props {
  selectedNode: Node | null
  onChange: (nodeId: string, data: Record<string, unknown>) => void
}

export default function NodeProperties({ selectedNode, onChange }: Props) {
  if (!selectedNode) {
    return (
      <div style={{ padding: 16, width: 240, borderLeft: '1px solid #E2E8F0', height: '100%', background: '#fff' }}>
        <Empty description="点击节点查看属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const nodeType = selectedNode.type as NodeType
  const data = selectedNode.data as Record<string, unknown>
  const meta = NODE_META[nodeType] ?? { label: nodeType, color: '#94A3B8' }

  const update = (key: string, value: unknown) => {
    onChange(selectedNode.id, { ...data, [key]: value })
  }

  return (
    <div
      style={{
        width: 260,
        padding: 16,
        background: '#fff',
        borderLeft: '1px solid #E2E8F0',
        overflowY: 'auto',
        height: '100%',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div
          style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0 }}
        />
        <Title level={5} style={{ margin: 0 }}>
          {meta.label}
        </Title>
      </div>
      <Tag style={{ fontSize: 11, marginBottom: 4 }}>{nodeType}</Tag>
      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
        ID: {selectedNode.id}
      </Text>
      <Divider style={{ margin: '12px 0' }} />

      <Form layout="vertical" size="small">
        {/* No config for start/end */}
        {(nodeType === 'start' || nodeType === 'end') && (
          <Text type="secondary">此节点无可配置属性</Text>
        )}

        {/* Label field shared by most editable nodes */}
        {!['start', 'end'].includes(nodeType) && (
          <Form.Item label="节点名称">
            <Input
              value={data.label as string ?? ''}
              onChange={(e) => update('label', e.target.value)}
              placeholder={meta.label}
            />
          </Form.Item>
        )}

        {nodeType === 'env_check' && (
          <>
            <Form.Item label="目标环境">
              <Select
                value={data.env as string ?? 'prod'}
                onChange={(v) => update('env', v)}
                options={[
                  { label: '生产集群', value: 'prod' },
                  { label: '预发集群', value: 'staging' },
                  { label: '开发集群', value: 'dev' },
                ]}
              />
            </Form.Item>
            <Form.Item label="检测项">
              <Select
                mode="multiple"
                value={data.checks as string[] ?? []}
                onChange={(v) => update('checks', v)}
                options={[
                  { label: '节点就绪', value: 'node_ready' },
                  { label: 'Pod 健康', value: 'pod_health' },
                  { label: '磁盘空间', value: 'disk' },
                  { label: '网络连通', value: 'network' },
                ]}
                placeholder="选择检测项"
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'ai_decision' && (
          <>
            <Form.Item label="模型">
              <Select
                value={data.model as string ?? 'deepseek-v3'}
                onChange={(v) => update('model', v)}
                options={[
                  { label: 'DeepSeek-V3', value: 'deepseek-v3' },
                  { label: 'GPT-4o', value: 'gpt-4o' },
                  { label: 'Claude 3.5', value: 'claude-3-5-sonnet' },
                ]}
              />
            </Form.Item>
            <Form.Item label="决策 Prompt">
              <Input.TextArea
                rows={5}
                value={data.prompt as string ?? ''}
                onChange={(e) => update('prompt', e.target.value)}
                placeholder="根据环境检测报告，分析是否可以安全部署..."
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'condition' && (
          <>
            <Form.Item label="条件表达式 (JS)">
              <Input.TextArea
                rows={4}
                value={data.expression as string ?? ''}
                onChange={(e) => update('expression', e.target.value)}
                placeholder="ctx.aiResult === 'proceed'"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
            <Form.Item label="true 分支标签">
              <Input
                value={data.trueLabel as string ?? '通过'}
                onChange={(e) => update('trueLabel', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="false 分支标签">
              <Input
                value={data.falseLabel as string ?? '不通过'}
                onChange={(e) => update('falseLabel', e.target.value)}
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'skill' && (
          <>
            <Form.Item label="技能 ID / 名称">
              <Input
                value={data.skillId as string ?? ''}
                onChange={(e) => update('skillId', e.target.value)}
                placeholder="nginx-security-hardening"
              />
            </Form.Item>
            <Form.Item label="超时 (秒)">
              <Input
                type="number"
                value={data.timeout as string ?? '300'}
                onChange={(e) => update('timeout', e.target.value)}
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'blue_green' && (
          <>
            <Form.Item label="服务名称">
              <Input
                value={data.service as string ?? ''}
                onChange={(e) => update('service', e.target.value)}
                placeholder="nginx"
              />
            </Form.Item>
            <Form.Item label="新版本镜像">
              <Input
                value={data.image as string ?? ''}
                onChange={(e) => update('image', e.target.value)}
                placeholder="nginx:1.27"
              />
            </Form.Item>
            <Form.Item label="流量切换策略">
              <Select
                value={data.strategy as string ?? 'canary10'}
                onChange={(v) => update('strategy', v)}
                options={[
                  { label: '金丝雀 10%', value: 'canary10' },
                  { label: '金丝雀 50%', value: 'canary50' },
                  { label: '全量切换', value: 'full' },
                ]}
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'rollback' && (
          <>
            <Form.Item label="回滚目标版本">
              <Input
                value={data.targetVersion as string ?? ''}
                onChange={(e) => update('targetVersion', e.target.value)}
                placeholder="上一个稳定版本"
              />
            </Form.Item>
            <Form.Item label="回滚原因">
              <Input.TextArea
                rows={3}
                value={data.reason as string ?? ''}
                onChange={(e) => update('reason', e.target.value)}
                placeholder="部署健康检查失败"
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'notification' && (
          <>
            <Form.Item label="通知渠道">
              <Select
                mode="multiple"
                value={data.channels as string[] ?? ['dingtalk']}
                onChange={(v) => update('channels', v)}
                options={[
                  { label: '钉钉', value: 'dingtalk' },
                  { label: '企业微信', value: 'wecom' },
                  { label: '邮件', value: 'email' },
                  { label: 'Slack', value: 'slack' },
                ]}
              />
            </Form.Item>
            <Form.Item label="消息模板">
              <Input.TextArea
                rows={4}
                value={data.template as string ?? ''}
                onChange={(e) => update('template', e.target.value)}
                placeholder="【AIOps】{{workflow.name}} 部署{{status}}"
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'shell' && (
          <>
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
                placeholder="https://api.example.com/deploy"
              />
            </Form.Item>
          </>
        )}

        {nodeType === 'llm' && (
          <>
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
      </Form>
    </div>
  )
}
