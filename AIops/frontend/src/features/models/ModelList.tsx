import { useState } from 'react'
import { Table, Button, Input, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Model, ModelStatus } from '@/types/model'
import { useModels, useDeleteModel } from './useModels'
import { modelsApi } from '@/api/models'
import ModelDrawer from './ModelDrawer'

const statusColor: Record<ModelStatus, string> = {
  active: 'success',
  inactive: 'default',
}
const statusLabel: Record<ModelStatus, string> = {
  active: '启用',
  inactive: '禁用',
}

export default function ModelList() {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [testingId, setTestingId] = useState<number | null>(null)

  const { data: models = [], isLoading } = useModels()
  const deleteModel = useDeleteModel()

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  )

  const handleTest = async (model: Model) => {
    setTestingId(model.id)
    try {
      const res = await modelsApi.testModel(model.id)
      message.success(`模型响应正常，延迟 ${res.data.data.latency_ms}ms`)
    } catch {
      message.error('模型测试失败，请检查配置')
    } finally {
      setTestingId(null)
    }
  }

  const columns: ColumnsType<Model> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: 'Provider', dataIndex: 'provider', key: 'provider', width: 120 },
    {
      title: '模型类型',
      dataIndex: 'model_type',
      key: 'model_type',
      width: 120,
      render: (v: string) => (v === 'chat' ? '对话' : '嵌入'),
    },
    {
      title: 'API Endpoint',
      dataIndex: 'api_endpoint',
      key: 'api_endpoint',
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: ModelStatus) => (
        <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>
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
            loading={testingId === record.id}
            onClick={() => handleTest(record)}
          >
            测试
          </Button>
          <Button
            size="small"
            onClick={() => { setEditingModel(record); setDrawerOpen(true) }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模型？"
            onConfirm={() => deleteModel.mutate(record.id)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input
          placeholder="搜索名称 / Provider"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingModel(null); setDrawerOpen(true) }}
        >
          添加模型
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无模型' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <ModelDrawer
        open={drawerOpen}
        editingModel={editingModel}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
