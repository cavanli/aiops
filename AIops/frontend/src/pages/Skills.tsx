import { useState } from 'react'
import {
  Card, Row, Col, Button, Input, Tag, Typography, Space,
  Drawer, Form, Select, Modal, Spin, Empty, Tabs, Tooltip,
} from 'antd'
import {
  SearchOutlined, PlusOutlined, ThunderboltOutlined,
  EditOutlined, DeleteOutlined, DownloadOutlined,
  SafetyCertificateOutlined, TeamOutlined, StarOutlined, UserOutlined,
} from '@ant-design/icons'
import { useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill } from '@/features/skills/useSkills'
import type { Skill, SkillCategory, SkillSource, CreateSkillRequest } from '@/types/skill'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const CATEGORY_LABELS: Record<string, string> = {
  env_setup: '环境配置',
  deployment: '部署实施',
  testing: '测试验证',
  security: '安全合规',
}

const CATEGORY_COLORS: Record<string, string> = {
  env_setup: 'blue',
  deployment: 'green',
  testing: 'orange',
  security: 'red',
}

const SOURCE_CONFIG: Record<SkillSource, { label: string; color: string; icon: React.ReactNode }> = {
  official: { label: '官方', color: '#2563EB', icon: <StarOutlined /> },
  community: { label: '社区', color: '#16A34A', icon: <TeamOutlined /> },
  security_team: { label: '安全团队', color: '#DC2626', icon: <SafetyCertificateOutlined /> },
  custom: { label: '自定义', color: '#94A3B8', icon: <UserOutlined /> },
}

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'env_setup', label: '环境配置' },
  { value: 'deployment', label: '部署实施' },
  { value: 'testing', label: '测试验证' },
  { value: 'security', label: '安全合规' },
]

// Marketplace demo skills — shown as importable from the marketplace tab
const MARKETPLACE_SKILLS = [
  { id: 'm1', name: 'Kubernetes 健康检查', category: 'testing', description: '自动巡检 K8s 集群节点状态、Pod 异常及资源使用率，输出健康报告。', author: 'AIops官方', source: 'official' as SkillSource, script_type: 'shell' },
  { id: 'm2', name: 'Nginx 安全加固', category: 'security', description: '按 CIS Benchmark 规范对 Nginx 配置进行安全基线检查与自动修复。', author: '安全团队', source: 'security_team' as SkillSource, script_type: 'shell' },
  { id: 'm3', name: 'MySQL 慢查询分析', category: 'testing', description: '解析 MySQL 慢查询日志，输出 Top 10 耗时 SQL 及优化建议。', author: 'AIops官方', source: 'official' as SkillSource, script_type: 'python' },
  { id: 'm4', name: 'Docker 镜像清理', category: 'env_setup', description: '清理未使用的 Docker 镜像、停止的容器及悬空卷，释放磁盘空间。', author: 'community', source: 'community' as SkillSource, script_type: 'shell' },
  { id: 'm5', name: 'Redis 内存分析', category: 'testing', description: '分析 Redis 大 Key、热点 Key，输出内存占用分布报告。', author: 'AIops官方', source: 'official' as SkillSource, script_type: 'python' },
  { id: 'm6', name: 'SSL 证书到期检查', category: 'security', description: '批量检查指定域名 SSL 证书有效期，提前 30 天预警即将到期的证书。', author: '安全团队', source: 'security_team' as SkillSource, script_type: 'shell' },
  { id: 'm7', name: 'Ansible 环境初始化', category: 'env_setup', description: '使用 Ansible playbook 批量初始化目标主机：用户、目录、基础软件包、时间同步。', author: 'community', source: 'community' as SkillSource, script_type: 'ansible' },
  { id: 'm8', name: '日志目录清理', category: 'env_setup', description: '按策略清理 /var/log 下超过 N 天的日志文件，支持 dry-run 模式预览。', author: 'community', source: 'community' as SkillSource, script_type: 'shell' },
]

function SourceTag({ source }: { source?: SkillSource }) {
  if (!source) return null
  const cfg = SOURCE_CONFIG[source]
  return (
    <Tag
      icon={cfg.icon}
      style={{
        color: cfg.color,
        borderColor: cfg.color,
        background: `${cfg.color}15`,
        fontSize: 11,
      }}
    >
      {cfg.label}
    </Tag>
  )
}

function SkillCard({
  skill,
  onEdit,
  onDelete,
  isMarketplace = false,
}: {
  skill: Skill | typeof MARKETPLACE_SKILLS[0]
  onEdit?: () => void
  onDelete?: () => void
  isMarketplace?: boolean
}) {
  return (
    <Card hoverable style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14, flex: 1, marginRight: 8 }}>{skill.name}</Text>
        <Tag color={CATEGORY_COLORS[skill.category]}>{CATEGORY_LABELS[skill.category] ?? skill.category}</Tag>
      </div>

      <div style={{ marginBottom: 8 }}>
        <SourceTag source={skill.source} />
        <Tag style={{ fontSize: 11 }}>{skill.script_type?.toUpperCase()}</Tag>
      </div>

      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }} ellipsis={{ rows: 2 }}>
        {skill.description || '暂无描述'}
      </Paragraph>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>来自 {skill.author || '未知'}</Text>
        <Space size={4}>
          {isMarketplace ? (
            <Tooltip title="导入到技能库">
              <Button size="small" type="primary" ghost icon={<DownloadOutlined />}>
                导入
              </Button>
            </Tooltip>
          ) : (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={onEdit} />
              <Button size="small" icon={<ThunderboltOutlined />} title="使用" />
              <Button size="small" danger icon={<DeleteOutlined />} onClick={onDelete} />
            </>
          )}
        </Space>
      </div>
    </Card>
  )
}

export default function Skills() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Skill | null>(null)
  const [form] = Form.useForm()
  const [marketplaceSource, setMarketplaceSource] = useState<string>('all')

  const { data, isLoading } = useSkills(activeCategory || undefined)
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()
  const deleteSkill = useDeleteSkill()

  const skills = data?.items ?? []

  const filtered = skills.filter((s) => {
    if (!search) return true
    return s.name.includes(search) || s.description.includes(search)
  })

  const marketplaceFiltered = MARKETPLACE_SKILLS.filter((s) => {
    const matchSearch = !search || s.name.includes(search) || s.description.includes(search)
    const matchSource = marketplaceSource === 'all' || s.source === marketplaceSource
    return matchSearch && matchSource
  })

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setDrawerOpen(true)
  }

  function openEdit(skill: Skill) {
    setEditing(skill)
    form.setFieldsValue({
      name: skill.name,
      category: skill.category,
      description: skill.description,
      script_type: skill.script_type,
      script_content: skill.script_content,
      author: skill.author,
      source: skill.source ?? 'custom',
    })
    setDrawerOpen(true)
  }

  async function handleSubmit() {
    const values = await form.validateFields()
    const payload: CreateSkillRequest = {
      name: values.name,
      category: values.category as SkillCategory,
      description: values.description,
      script_type: values.script_type,
      script_content: values.script_content,
      author: values.author,
      source: values.source as SkillSource,
    }
    if (editing) {
      await updateSkill.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createSkill.mutateAsync(payload)
    }
    setDrawerOpen(false)
  }

  function confirmDelete(skill: Skill) {
    Modal.confirm({
      title: `删除技能 "${skill.name}"？`,
      content: '此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteSkill.mutateAsync(skill.id),
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>技能库</Typography.Title>
          <Text type="secondary">为基础设施提供原子化自动化能力</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建新技能</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Input
          placeholder="搜索技能名称或描述"
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <Tabs
        defaultActiveKey="mine"
        items={[
          {
            key: 'mine',
            label: `我的技能库 (${skills.length})`,
            children: (
              <div>
                <Space wrap style={{ marginBottom: 16 }}>
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      type={activeCategory === cat.value ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setActiveCategory(cat.value)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </Space>

                <Spin spinning={isLoading}>
                  <Row gutter={[16, 16]}>
                    {filtered.map((skill) => (
                      <Col key={skill.id} xs={24} sm={12} lg={8}>
                        <SkillCard
                          skill={skill}
                          onEdit={() => openEdit(skill)}
                          onDelete={() => confirmDelete(skill)}
                        />
                      </Col>
                    ))}
                    {!isLoading && filtered.length === 0 && (
                      <Col span={24}>
                        <Empty description="暂无技能，点击右上角创建或从技能市场导入" style={{ padding: '40px 0' }} />
                      </Col>
                    )}
                  </Row>
                </Spin>
              </div>
            ),
          },
          {
            key: 'marketplace',
            label: '技能市场',
            children: (
              <div>
                <Space wrap style={{ marginBottom: 16 }}>
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'official', label: '官方' },
                    { value: 'community', label: '社区' },
                    { value: 'security_team', label: '安全团队' },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      type={marketplaceSource === opt.value ? 'primary' : 'default'}
                      size="small"
                      onClick={() => setMarketplaceSource(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </Space>

                <Row gutter={[16, 16]}>
                  {marketplaceFiltered.map((skill) => (
                    <Col key={skill.id} xs={24} sm={12} lg={8}>
                      <SkillCard skill={skill as Skill} isMarketplace />
                    </Col>
                  ))}
                  {marketplaceFiltered.length === 0 && (
                    <Col span={24}>
                      <Empty description="没有找到匹配的技能" style={{ padding: '40px 0' }} />
                    </Col>
                  )}
                </Row>
              </div>
            ),
          },
        ]}
      />

      <Drawer
        title={editing ? '编辑技能' : '创建新技能'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button
              type="primary"
              loading={createSkill.isPending || updateSkill.isPending}
              onClick={handleSubmit}
            >
              {editing ? '保存' : '创建'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="技能名称" rules={[{ required: true, message: '请输入技能名称' }]}>
            <Input placeholder="例：Nginx 安全加固" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择分类">
              <Select.Option value="env_setup">环境配置</Select.Option>
              <Select.Option value="deployment">部署实施</Select.Option>
              <Select.Option value="testing">测试验证</Select.Option>
              <Select.Option value="security">安全合规</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="source" label="来源" initialValue="custom">
            <Select>
              <Select.Option value="official">官方</Select.Option>
              <Select.Option value="community">社区</Select.Option>
              <Select.Option value="security_team">安全团队</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="技能功能描述" />
          </Form.Item>
          <Form.Item name="script_type" label="脚本类型" initialValue="shell">
            <Select>
              <Select.Option value="shell">Shell</Select.Option>
              <Select.Option value="python">Python</Select.Option>
              <Select.Option value="ansible">Ansible</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="script_content" label="脚本内容">
            <TextArea rows={8} placeholder="在此输入脚本内容..." style={{ fontFamily: 'monospace', fontSize: 13 }} />
          </Form.Item>
          <Form.Item name="author" label="作者">
            <Input placeholder="例：官方" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
