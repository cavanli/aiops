import { useState } from 'react'
import { Card, Button, Row, Col, Tag, Space, Modal, Drawer, Form, Input, Select, Spin, Empty, Typography, Badge } from 'antd'
import { PlusOutlined, PlayCircleOutlined, StopOutlined, ReloadOutlined, DeleteOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useMcpServers, useCreateMcpServer, useDeleteMcpServer, useStartMcpServer, useStopMcpServer, useRestartMcpServer } from '../features/mcp/useMcp'
import type { McpServer, McpStatus } from '../types/mcp'

const { Text } = Typography

const statusMap: Record<McpStatus, { color: 'success' | 'error' | 'default'; text: string; tagColor: string }> = {
  running: { color: 'success', text: '运行中', tagColor: 'green' },
  stopped: { color: 'default', text: '已停止', tagColor: 'default' },
  error: { color: 'error', text: '错误', tagColor: 'red' },
}

function formatUptime(seconds?: number): string {
  if (!seconds) return '0 秒'
  if (seconds < 60) return `${seconds} 秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分钟`
  return `${Math.floor(seconds / 86400)} 天 ${Math.floor((seconds % 86400) / 3600)} 小时`
}

export default function McpCenter() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form] = Form.useForm()

  const { data, isLoading } = useMcpServers()
  const createMutation = useCreateMcpServer()
  const deleteMutation = useDeleteMcpServer()
  const startMutation = useStartMcpServer()
  const stopMutation = useStopMcpServer()
  const restartMutation = useRestartMcpServer()

  const servers = data?.items ?? []

  const handleCreate = () => {
    form.resetFields()
    setDrawerOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    createMutation.mutate(values, {
      onSuccess: () => setDrawerOpen(false),
    })
  }

  const handleDelete = (server: McpServer) => {
    Modal.confirm({
      title: `删除 "${server.name}"？`,
      content: '此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutate(server.id),
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>MCP 中心</Typography.Title>
          <Text type="secondary">管理模型上下文协议 (MCP) 服务与工具包</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          启动新 MCP
        </Button>
      </div>

      <Spin spinning={isLoading}>
        <Row gutter={[16, 16]}>
          {servers.map((server) => {
            const st = statusMap[server.status] ?? statusMap.stopped
            return (
              <Col key={server.id} xs={24} sm={12} lg={12}>
                <Card hoverable>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: server.status === 'running' ? '#DCFCE7' : '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ThunderboltOutlined
                        style={{
                          fontSize: 22,
                          color: server.status === 'running' ? '#16A34A' : '#94A3B8',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 15 }}>{server.name}</Text>
                        <Tag color={st.tagColor}>{st.text}</Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {server.tools_count} 个可用工具 · 运行时间: {formatUptime(server.uptime_seconds)}
                      </Text>
                    </div>

                    <Space>
                      {server.status === 'running' ? (
                        <>
                          <Button
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={() => restartMutation.mutate(server.id)}
                            loading={restartMutation.isPending}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<StopOutlined />}
                            onClick={() => stopMutation.mutate(server.id)}
                            loading={stopMutation.isPending}
                          />
                        </>
                      ) : (
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => startMutation.mutate(server.id)}
                          loading={startMutation.isPending}
                        />
                      )}
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(server)}
                      />
                    </Space>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      borderRadius: 6,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: '#475569',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    $ {server.command}
                  </div>
                </Card>
              </Col>
            )
          })}

          {!isLoading && servers.length === 0 && (
            <Col span={24}>
              <Empty description="暂无 MCP 服务" style={{ padding: '40px 0' }} />
            </Col>
          )}
        </Row>
      </Spin>

      <Drawer
        title="启动新 MCP 服务"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={createMutation.isPending}
              onClick={handleSubmit}
            >
              创建
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="例：Postgres MCP" />
          </Form.Item>

          <Form.Item
            name="command"
            label="启动命令"
            rules={[{ required: true, message: '请输入启动命令' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="例：npx @modelcontextprotocol/server-postgres --db-url=..."
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>

          <Form.Item name="transport" label="传输协议" initialValue="stdio">
            <Select>
              <Select.Option value="stdio">stdio</Select.Option>
              <Select.Option value="sse">SSE</Select.Option>
              <Select.Option value="http">HTTP</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
