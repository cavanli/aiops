import { useState } from 'react'
import { Card, Button, Table, Tag, Space, Modal, Drawer, Form, Input, Select, message, Spin, Empty } from 'antd'
import { PlusOutlined, SyncOutlined, DeleteOutlined, EditOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons'
import { useDataSources, useCreateDataSource, useUpdateDataSource, useDeleteDataSource, useSyncDataSource, useVectorSearch } from '../features/rag/useRag'
import type { DataSource, DataSourceType, VectorSearchResult } from '../types/rag'

const dataSourceTypeMap: Record<DataSourceType, string> = {
  confluence: 'Confluence 文档',
  github_wiki: 'GitHub Wiki',
  local_pdf: '本地 PDF 手册',
  database: '历史故障日志',
}

const statusColorMap = {
  connected: 'green',
  disconnected: 'default',
  syncing: 'orange',
}

const statusTextMap = {
  connected: '已连接',
  disconnected: '未连接',
  syncing: '同步中',
}

export default function RagKnowledge() {
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<DataSource | null>(null)
  const [searchResults, setSearchResults] = useState<VectorSearchResult[]>([])
  const [searchVisible, setSearchVisible] = useState(false)

  const { data, isLoading } = useDataSources()
  const createMutation = useCreateDataSource()
  const updateMutation = useUpdateDataSource()
  const deleteMutation = useDeleteDataSource()
  const syncMutation = useSyncDataSource()
  const searchMutation = useVectorSearch()

  const handleCreate = () => {
    setEditingSource(null)
    form.resetFields()
    setDrawerOpen(true)
  }

  const handleEdit = (source: DataSource) => {
    setEditingSource(source)
    form.setFieldsValue(source)
    setDrawerOpen(true)
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后数据源及其索引将无法恢复，确定继续？',
      onOk: () => deleteMutation.mutate(id),
    })
  }

  const handleSync = (id: number) => {
    syncMutation.mutate(id)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editingSource) {
      updateMutation.mutate({ id: editingSource.id, data: values }, {
        onSuccess: () => setDrawerOpen(false),
      })
    } else {
      createMutation.mutate(values, {
        onSuccess: () => setDrawerOpen(false),
      })
    }
  }

  const handleSearch = async () => {
    const values = await searchForm.validateFields()
    searchMutation.mutate(values, {
      onSuccess: (results) => {
        setSearchResults(results)
        setSearchVisible(true)
      },
    })
  }

  const columns = [
    {
      title: '数据源名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: DataSourceType) => dataSourceTypeMap[type],
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColorMap) => (
        <Tag color={statusColorMap[status]}>{statusTextMap[status]}</Tag>
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'last_sync',
      key: 'last_sync',
      render: (time: string) => time || '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: DataSource) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleSync(record.id)}
            loading={syncMutation.isPending}
          >
            同步
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={
          <div>
            <FileTextOutlined style={{ marginRight: 8 }} />
            RAG 知识库
          </div>
        }
        extra={
          <Space>
            <Button icon={<SearchOutlined />} onClick={() => setSearchVisible(true)}>
              向量搜索预览
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              上传文档
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          通过基础设施文档增强 AI 能力
        </div>

        {isLoading ? (
          <Spin />
        ) : !data?.items?.length ? (
          <Empty description="暂无数据源" />
        ) : (
          <Table
            dataSource={data.items}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Drawer
        title={editingSource ? '编辑数据源' : '创建数据源'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="数据源名称"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="例如：Confluence 文档" />
          </Form.Item>

          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="选择数据源类型">
              <Select.Option value="confluence">Confluence 文档</Select.Option>
              <Select.Option value="github_wiki">GitHub Wiki</Select.Option>
              <Select.Option value="local_pdf">本地 PDF 手册</Select.Option>
              <Select.Option value="database">历史故障日志</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="位置"
            rules={[{ required: true, message: '请输入位置' }]}
          >
            <Input placeholder="URL 或文件路径" />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="向量搜索预览"
        open={searchVisible}
        onCancel={() => setSearchVisible(false)}
        width={800}
        footer={null}
      >
        <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
          <Form.Item
            name="query"
            label="搜索问题"
            rules={[{ required: true, message: '请输入搜索内容' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="询问关于基础设施的任何问题..."
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              loading={searchMutation.isPending}
              block
            >
              搜索
            </Button>
          </Form.Item>
        </Form>

        {searchResults.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>AI 回答</div>
            {searchResults.map((result, idx) => (
              <Card key={idx} size="small" style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>
                  来源: {result.source} · 相关度: {(result.score * 100).toFixed(1)}%
                </div>
                <div>{result.content}</div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
