import { useState } from 'react'
import { Table, Button, Drawer, Form, Input, Space, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Workflow, WorkflowStatus } from '@/types/workflow'
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow, useExecuteWorkflow } from './useWorkflows'

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
    // Navigate to editor after creation
    navigate(`/workflows/${result.data.data.id}/edit`)
  }

  const columns: ColumnsType<Workflow> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: WorkflowStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count', width: 100 },
    {
      title: '最近执行',
      dataIndex: 'last_executed_at',
      key: 'last_executed_at',
      render: (t: string | null) =>
        t ? new Date(t).toLocaleString('zh-CN') : '从未执行',
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
            icon={<PlayCircleOutlined />}
            onClick={() => executeWorkflow.mutate(record.id)}
            disabled={record.status !== 'active'}
          >
            执行
          </Button>
          <Popconfirm
            title="确定删除此工作流？"
            onConfirm={() => deleteWorkflow.mutate(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
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
        locale={{ emptyText: '暂无工作流' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
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
            <Input placeholder="e.g. 部署前检查流程" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
