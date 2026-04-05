import { Row, Col, Card, Statistic, Table, Tag, Typography } from 'antd'
import {
  CloudServerOutlined,
  ApiOutlined,
  RocketOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { hostsApi } from '@/api/hosts'
import { modelsApi } from '@/api/models'
import { workflowsApi } from '@/api/workflows'
import { deploymentsApi } from '@/api/deployments'
import type { TaskStatus } from '@/types/deployment'

const { Title } = Typography

const statusColor: Record<TaskStatus, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  cancelled: 'warning',
}

const statusLabel: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '进行中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
}

const activityColumns = [
  { title: '模板名称', dataIndex: 'template_name', key: 'template_name' },
  {
    title: '目标主机',
    dataIndex: 'target_hosts',
    key: 'target_hosts',
    render: (hosts: string[]) => hosts?.join(', ') ?? '-',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (s: TaskStatus) => (
      <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (t: string) => new Date(t).toLocaleString('zh-CN'),
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: hosts } = useQuery({
    queryKey: ['hosts'],
    queryFn: () => hostsApi.list().then((r) => r.data.data),
  })

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelsApi.list().then((r) => r.data.data),
  })

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data),
  })

  const { data: recentTasks } = useQuery({
    queryKey: ['deployments', 'tasks', 'recent'],
    queryFn: () => deploymentsApi.listTasks().then((r) => r.data.data.items.slice(0, 10)),
  })

  const runningCount =
    recentTasks?.filter((t) => t.status === 'running').length ?? 0

  const statCards = [
    {
      title: '主机总数',
      value: hosts?.length ?? 0,
      icon: <CloudServerOutlined style={{ color: '#2563EB' }} />,
    },
    {
      title: '模型接入数',
      value: models?.length ?? 0,
      icon: <ApiOutlined style={{ color: '#10B981' }} />,
    },
    {
      title: '进行中部署',
      value: runningCount,
      icon: <RocketOutlined style={{ color: '#F59E0B' }} />,
    },
    {
      title: '工作流数',
      value: workflows?.length ?? 0,
      icon: <ApartmentOutlined style={{ color: '#8B5CF6' }} />,
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        概览
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 8 }}>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="最近部署活动"
        bordered={false}
        style={{ borderRadius: 8 }}
      >
        <Table
          dataSource={recentTasks ?? []}
          columns={activityColumns}
          rowKey="id"
          size="small"
          pagination={false}
          onRow={(_record) => ({
            onClick: () => navigate(`/deployments`),
            style: { cursor: 'pointer' },
          })}
          locale={{ emptyText: '暂无部署记录' }}
        />
      </Card>
    </div>
  )
}
