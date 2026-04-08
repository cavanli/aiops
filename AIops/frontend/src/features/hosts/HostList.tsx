import { useState } from 'react'
import { Table, Button, Input, Space, Tag, Popconfirm, message, Tooltip } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Host, HostStatus } from '@/types/host'
import { useHosts, useDeleteHost } from './useHosts'
import { hostsApi } from '@/api/hosts'
import HostDrawer from './HostDrawer'

const statusColor: Record<HostStatus, string> = {
  online: 'success',
  offline: 'error',
  unknown: 'default',
}

const statusLabel: Record<HostStatus, string> = {
  online: '在线',
  offline: '离线',
  unknown: '未知',
}

export default function HostList() {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingHost, setEditingHost] = useState<Host | null>(null)
  const [testingId, setTestingId] = useState<number | null>(null)

  const { data: hosts = [], isLoading } = useHosts()
  const deleteHost = useDeleteHost()

  const filtered = hosts.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.ip.includes(search)
  )

  const handleTest = async (host: Host) => {
    setTestingId(host.id)
    try {
      const res = await hostsApi.testConnection(host.id)
      message.success(`连接成功，延迟 ${res.data.data.latency_ms}ms`)
    } catch {
      message.error('连接失败，请检查主机配置')
    } finally {
      setTestingId(null)
    }
  }

  const columns: ColumnsType<Host> = [
    { title: '主机名', dataIndex: 'name', key: 'name' },
    { title: 'IP 地址', dataIndex: 'ip', key: 'ip' },
    { title: 'SSH 端口', dataIndex: 'port', key: 'port', width: 100 },
    { title: 'SSH 用户', dataIndex: 'ssh_user', key: 'ssh_user', width: 100 },
    {
      title: '环境',
      dataIndex: 'env',
      key: 'env',
      width: 100,
      render: (v: string) => {
        const envMap: Record<string, { label: string; color: string }> = {
          production: { label: '生产', color: 'red' },
          staging: { label: '预发布', color: 'orange' },
          dev: { label: '开发', color: 'blue' },
        }
        return v && envMap[v] ? <Tag color={envMap[v].color}>{envMap[v].label}</Tag> : '-'
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (s: HostStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="测试连接">
            <Button
              size="small"
              loading={testingId === record.id}
              onClick={() => handleTest(record)}
            >
              测试
            </Button>
          </Tooltip>
          <Button
            size="small"
            onClick={() => { setEditingHost(record); setDrawerOpen(true) }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此主机？"
            onConfirm={() => deleteHost.mutate(record.id)}
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
          placeholder="搜索主机名 / IP"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingHost(null); setDrawerOpen(true) }}
        >
          添加主机
        </Button>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无主机' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <HostDrawer
        open={drawerOpen}
        editingHost={editingHost}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
