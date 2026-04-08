import { useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DeploymentTask, TaskStatus, DeployStrategy } from '@/types/deployment'
import { useTasks, useCancelTask } from './useDeployments'
import TaskCreateDrawer from './TaskCreateDrawer'
import TaskLogDrawer from './TaskLogDrawer'

const statusColor: Record<TaskStatus, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  cancelled: 'warning',
}
const statusLabel: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '执行中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
}
const strategyLabel: Record<DeployStrategy, string> = {
  fail_fast: '遇错即止',
  continue_on_failure: '继续执行',
}

function duration(task: DeploymentTask): string {
  if (!task.start_time) return '-'
  const end = task.end_time ? new Date(task.end_time) : new Date()
  const secs = Math.round((end.getTime() - new Date(task.start_time).getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

export default function TaskList() {
  const [createOpen, setCreateOpen] = useState(false)
  const [logTaskId, setLogTaskId] = useState<number>(0)

  const { data: tasks = [], isLoading } = useTasks()
  const cancelTask = useCancelTask()

  const columns: ColumnsType<DeploymentTask> = [
    { title: '任务 ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '模板 ID', dataIndex: 'template_id', key: 'template_id', width: 90 },
    {
      title: '目标主机',
      dataIndex: 'host_ids',
      key: 'host_ids',
      render: (ids: number[]) => ids?.join(', ') ?? '-',
    },
    {
      title: '策略',
      dataIndex: 'strategy',
      key: 'strategy',
      width: 100,
      render: (s: DeployStrategy) => strategyLabel[s] ?? s,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: TaskStatus) => <Tag color={statusColor[s]}>{statusLabel[s]}</Tag>,
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (t: string | null) =>
        t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '耗时',
      key: 'duration',
      width: 80,
      render: (_, record) => duration(record),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看日志">
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => setLogTaskId(record.id)}
            >
              日志
            </Button>
          </Tooltip>
          {(record.status === 'pending' || record.status === 'running') && (
            <Popconfirm
              title="确定取消此部署任务？"
              onConfirm={() => cancelTask.mutate(record.id)}
              okText="取消任务"
              cancelText="保留"
            >
              <Button size="small" danger>取消</Button>
            </Popconfirm>
          )}
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
          onClick={() => setCreateOpen(true)}
        >
          新建部署
        </Button>
      </div>
      <Table
        dataSource={tasks}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: '暂无部署任务' }}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />
      <TaskCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <TaskLogDrawer
        open={logTaskId > 0}
        taskId={logTaskId}
        onClose={() => setLogTaskId(0)}
      />
    </div>
  )
}
