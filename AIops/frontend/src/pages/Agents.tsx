import { useState } from 'react'
import {
  Card, Row, Col, Button, Space, Tag, Typography, Badge, Avatar,
  Drawer, Form, Input, Select, Modal, Spin, Empty,
} from 'antd'
import { PlusOutlined, RobotOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from '@/features/agents/useAgents'
import type { Agent, CreateAgentRequest } from '@/types/agent'

const { Text } = Typography

const STATUS_MAP = {
  active: { color: 'success' as const, label: '活跃', tagColor: 'green' },
  inactive: { color: 'default' as const, label: '空闲', tagColor: 'default' },
}

export default function Agents() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Agent | null>(null)
  const [form] = Form.useForm()

  const { data, isLoading } = useAgents()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()

  const agents = data?.items ?? []

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setDrawerOpen(true)
  }

  function openEdit(agent: Agent) {
    setEditing(agent)
    form.setFieldsValue({
      name: agent.name,
      role: agent.role,
      status: agent.status,
      model_name: agent.model_name,
      focus: agent.focus,
    })
    setDrawerOpen(true)
  }

  async function handleSubmit() {
    const values = await form.validateFields()
    const payload: CreateAgentRequest = {
      name: values.name,
      role: values.role,
      status: values.status,
      model_name: values.model_name,
      focus: values.focus,
    }
    if (editing) {
      await updateAgent.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createAgent.mutateAsync(payload)
    }
    setDrawerOpen(false)
  }

  function confirmDelete(agent: Agent) {
    Modal.confirm({
      title: `删除智能体 "${agent.name}"？`,
      content: '此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteAgent.mutateAsync(agent.id),
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>智能体</Typography.Title>
          <Text type="secondary">监控并管理您的服务器集群的自主智能实体</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>派生智能体</Button>
      </div>

      <Spin spinning={isLoading}>
        <Row gutter={[16, 16]}>
          {agents.map((agent) => {
            const st = STATUS_MAP[agent.status] ?? STATUS_MAP.inactive
            return (
              <Col key={agent.id} xs={24} lg={12}>
                <Card
                  hoverable
                  extra={
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(agent)}>编辑</Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(agent)}>删除</Button>
                    </Space>
                  }
                >
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Badge status={st.color} offset={[-4, 52]}>
                      <Avatar
                        size={64}
                        icon={<RobotOutlined />}
                        style={{ background: '#2563EB', flexShrink: 0 }}
                      />
                    </Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 15 }}>{agent.name}</Text>
                        <Tag
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                            background: '#F1F5F9',
                            border: 'none',
                            color: '#475569',
                          }}
                        >
                          {agent.model_name || '未配置模型'}
                        </Tag>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>{agent.role || '未设置角色'}</Text>
                        <Tag color={st.tagColor} style={{ margin: 0 }}>{st.label}</Tag>
                      </div>
                      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>任务数</div>
                          <Text strong>{agent.task_count}</Text>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>当前关注</div>
                          <Text style={{ fontSize: 13 }} ellipsis>{agent.focus || '暂无'}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            )
          })}
          {!isLoading && agents.length === 0 && (
            <Col span={24}>
              <Empty description="暂无智能体" style={{ padding: '40px 0' }} />
            </Col>
          )}
        </Row>
      </Spin>

      <Drawer
        title={editing ? '编辑智能体' : '派生智能体'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={createAgent.isPending || updateAgent.isPending}
              onClick={handleSubmit}
            >
              {editing ? '保存' : '创建'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="智能体名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例：哨兵-Alpha" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Input placeholder="例：监控与自愈" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="inactive">
            <Select>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">空闲</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="model_name" label="使用模型">
            <Input placeholder="例：DeepSeek-V3" />
          </Form.Item>
          <Form.Item name="focus" label="当前关注">
            <Input.TextArea rows={3} placeholder="智能体当前关注的任务或目标" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
