import { useState } from 'react'
import { Table, Button, Drawer, Form, Input, Space, Tag, Popconfirm, Typography, Badge } from 'antd'
import { PlusOutlined, EditOutlined, PlayCircleOutlined, DeleteOutlined, ClockCircleOutlined, ApartmentOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Workflow, WorkflowStatus } from '@/types/workflow'
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow, useExecuteWorkflow } from './useWorkflows'

const { Text } = Typography

const statusColor: Record<WorkflowStatus, string> = {
  draft: 'default',
  active: 'success',
}
const statusLabel: Record<WorkflowStatus, string> = {
  draft: '草稿',
  active: '已发布',
}

export default function WorkflowList() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const { data: workflows = [], isLoading } = useWorkflows()
  const createWorkflow = useCreateWorkflow()
  const deleteWorkflow = useDeleteWorkflow()
  const executeWorkflow = useExecuteWorkflow()

  const handleCreate = async () => {
    const values = await form.validateFields()
    const result = await createWorkflow.mutateAsync(values)
    setDrawerOpen(false)
    form.resetFields()
    navigate(`/workflows/${result.data.data.id}/edit`)
  }

  const columns: ColumnsType<Workflow> = [
    {
      title: '工作流名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{name}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: WorkflowStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    {
      title: '节点数',
      dataIndex: 'node_count',
      key: 'node_count',
      width: 100,
      render: (n: number) => (
        <Space size={4}>
          <ApartmentOutlined style={{ color: '#6366F1' }} />
          <Text>{n ?? 0} 个节点</Text>
        </Space>
      ),
    },
    {
      title: '最近执行',
      dataIndex: 'last_executed_at',
      key: 'last_executed_at',
      width: 160,
      render: (t: string | null) =>
        t ? (
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#64748B' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>从未执行</Text>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (t: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(t).toLocaleDateString('zh-CN')}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/workflows/${record.id}/edit`)}
          >
            设计
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<PlayCircleOutlined />}
            onClick={() => executeWorkflow.mutate(record.id)}
            disabled={record.status !== 'active'}
            loading={executeWorkflow.isPending}
          >
            执行
          </Button>
          <Popconfirm
            title="确定删除此工作流？"
            onConfirm={() => deleteWorkflow.mutate(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const activeCount = workflows.filter((w) => w.status === 'active').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Text type="secondary">共 {workflows.length} 个工作流</Text>
          {activeCount > 0 && (
            <Badge count={activeCount} style={{ backgroundColor: '#22C55E' }}>
              <Tag color="success" style={{ margin: 0 }}>已发布</Tag>
            </Badge>
          )}
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
        >
          新建工作流
        </Button>
      </div>

      <Table
        dataSource={workflows}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无工作流，点击右上角新建' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        rowClassName={() => 'workflow-row'}
      />

      <Drawer
        title="新建工作流"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields() }}
        width={400}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => { setDrawerOpen(false); form.resetFields() }}>取消</Button>
            <Button type="primary" loading={createWorkflow.isPending} onClick={handleCreate}>
              创建并进入编辑器
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入工作流名称' }]}>
            <Input placeholder="例：部署前检查流程" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="可选：描述此工作流的用途" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
