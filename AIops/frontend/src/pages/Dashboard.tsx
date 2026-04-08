import { useState } from 'react'
import { Row, Col, Card, Typography, Progress, Button, Space, Tag } from 'antd'
import {
  RocketOutlined,
  ApiOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { deploymentsApi } from '@/api/deployments'
import type { TaskStatus } from '@/types/deployment'
import TaskCreateDrawer from '@/features/deployments/TaskCreateDrawer'

const { Title, Text } = Typography

const MODEL_USAGE = [
  { name: 'DeepSeek-V3', pct: 75, color: '#6366F1' },
  { name: 'GPT-4o', pct: 45, color: '#3B82F6' },
  { name: 'Claude 3.5 Sonnet', pct: 30, color: '#8B5CF6' },
  { name: 'Ollama (本地)', pct: 15, color: '#94A3B8' },
]

const ACTIVITY_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  running: { label: '进行中', color: '#3B82F6', dot: '#3B82F6' },
  success: { label: '成功', color: '#16A34A', dot: '#22C55E' },
  failed: { label: '失败', color: '#DC2626', dot: '#EF4444' },
  pending: { label: '等待中', color: '#94A3B8', dot: '#94A3B8' },
  cancelled: { label: '已取消', color: '#94A3B8', dot: '#94A3B8' },
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

const STAT_CARDS = [
  {
    key: 'servers',
    label: '活跃服务器',
    value: '124',
    icon: <RocketOutlined style={{ fontSize: 22, color: '#6366F1' }} />,
    iconBg: '#EEF2FF',
  },
  {
    key: 'agents',
    label: '运行中智能体',
    value: '12',
    icon: <ApiOutlined style={{ fontSize: 22, color: '#8B5CF6' }} />,
    iconBg: '#F5F3FF',
  },
  {
    key: 'success_rate',
    label: '部署成功率',
    value: '99.2%',
    icon: <SafetyCertificateOutlined style={{ fontSize: 22, color: '#16A34A' }} />,
    iconBg: '#F0FDF4',
  },
  {
    key: 'load',
    label: '系统负载',
    value: '24%',
    icon: <DashboardOutlined style={{ fontSize: 22, color: '#D97706' }} />,
    iconBg: '#FFFBEB',
  },
]

export default function Dashboard() {
  const [deployOpen, setDeployOpen] = useState(false)

  const { data: recentTasks } = useQuery({
    queryKey: ['deployments', 'tasks', 'recent'],
    queryFn: () => deploymentsApi.listTasks().then((r) => r.data.data.items.slice(0, 6)),
  })

  // Build activity feed: real tasks + static fallback items when empty
  const activities = recentTasks && recentTasks.length > 0
    ? recentTasks.map((t) => ({
        id: t.id,
        title: `部署任务 #${t.id}`,
        subtitle: `模板 ${t.template_id} · ${timeAgo(t.created_at)}`,
        status: t.status as TaskStatus,
      }))
    : [
        { id: 1, title: 'K8s 集群部署', subtitle: '管理员 · 2 分钟前', status: 'running' as TaskStatus },
        { id: 2, title: 'Nginx 技能已更新', subtitle: '系统 · 15 分钟前', status: 'success' as TaskStatus },
        { id: 3, title: 'MCP 服务: Postgres 已启动', subtitle: '运维开发 · 1 小时前', status: 'success' as TaskStatus },
        { id: 4, title: '安全补丁应用失败', subtitle: '智能体-01 · 3 小时前', status: 'failed' as TaskStatus },
      ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>基础设施概览</Title>
        <Button
          type="primary"
          icon={<CodeOutlined />}
          size="large"
          onClick={() => setDeployOpen(true)}
          style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }}
        >
          新建部署
        </Button>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {STAT_CARDS.map((card) => (
          <Col key={card.key} xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: card.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>过去 24 小时</Text>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 6, color: '#0F172A' }}>
                {card.value}
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>{card.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Activity + Model usage */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            title={
              <Space>
                <span style={{ color: '#6366F1', fontWeight: 700, fontSize: 16 }}>&gt;_</span>
                <Text strong>最近动态</Text>
              </Space>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activities.map((item, idx) => {
                const st = ACTIVITY_STATUS[item.status] ?? ACTIVITY_STATUS.pending
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: idx < activities.length - 1 ? '1px solid #F1F5F9' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: st.dot,
                        flexShrink: 0,
                        marginRight: 14,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.subtitle}</Text>
                      </div>
                    </div>
                    <Text style={{ fontSize: 13, color: st.color, fontWeight: 500 }}>{st.label}</Text>
                  </div>
                )
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            title={
              <Space>
                <ApiOutlined style={{ color: '#6366F1' }} />
                <Text strong>模型使用分布</Text>
              </Space>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {MODEL_USAGE.map((m) => (
                <div key={m.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13 }}>{m.name}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>{m.pct}%</Text>
                  </div>
                  <Progress
                    percent={m.pct}
                    showInfo={false}
                    strokeColor={m.color}
                    trailColor="#F1F5F9"
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <TaskCreateDrawer open={deployOpen} onClose={() => setDeployOpen(false)} />
    </div>
  )
}
