import { useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DeploymentTemplate, ScriptType } from '@/types/deployment'
import { useTemplates, useDeleteTemplate } from './useDeployments'
import TemplateDrawer from './TemplateDrawer'

const typeColor: Record<ScriptType, string> = {
  shell: 'blue',
  python: 'green',
  helm: 'purple',
  'docker-compose': 'cyan',
}

const typeLabel: Record<ScriptType, string> = {
  shell: 'Shell',
  python: 'Python',
  helm: 'Helm',
  'docker-compose': 'Docker Compose',
}

export default function TemplateList() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DeploymentTemplate | null>(null)

  const { data: templates = [], isLoading } = useTemplates()
  const deleteTemplate = useDeleteTemplate()

  const columns: ColumnsType<DeploymentTemplate> = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'script_type',
      key: 'script_type',
      width: 140,
      render: (t: ScriptType) => <Tag color={typeColor[t]}>{typeLabel[t]}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => { setEditingTemplate(record); setDrawerOpen(true) }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模板？"
            onConfirm={() => deleteTemplate.mutate(record.id)}
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
          onClick={() => { setEditingTemplate(null); setDrawerOpen(true) }}
        >
          新建模板
        </Button>
      </div>
      <Table
        dataSource={templates}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无部署模板' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
      <TemplateDrawer
        open={drawerOpen}
        editingTemplate={editingTemplate}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
