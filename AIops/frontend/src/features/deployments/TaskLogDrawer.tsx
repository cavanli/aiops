import { useEffect, useRef } from 'react'
import { Drawer, Tag, Spin, Typography, Space } from 'antd'
import type { TaskStatus } from '@/types/deployment'
import { useTaskPolling } from './useDeployments'

const { Text } = Typography

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

interface Props {
  open: boolean
  taskId: number
  onClose: () => void
}

export default function TaskLogDrawer({ open, taskId, onClose }: Props) {
  const { data: task, isLoading } = useTaskPolling(open ? taskId : 0)
  const logRef = useRef<HTMLPreElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [task?.logs])

  const isActive = task?.status === 'running' || task?.status === 'pending'

  return (
    <Drawer
      title={
        <Space>
          <span>部署日志</span>
          {task && (
            <Tag color={statusColor[task.status]}>{statusLabel[task.status]}</Tag>
          )}
          {isActive && <Spin size="small" />}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={640}
    >
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
          <Spin />
        </div>
      ) : (
        <>
          {task && (
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                模板：{task.template_name} &nbsp;|&nbsp;
                主机：{task.target_hosts.join(', ')}
                {task.started_at && (
                  <> &nbsp;|&nbsp; 开始：{new Date(task.started_at).toLocaleString('zh-CN')}</>
                )}
              </Text>
            </div>
          )}
          <pre
            ref={logRef}
            style={{
              background: '#1E293B',
              color: '#E2E8F0',
              padding: 16,
              borderRadius: 8,
              height: 'calc(100vh - 200px)',
              overflowY: 'auto',
              fontSize: 13,
              fontFamily: 'Consolas, "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {task?.logs || (isActive ? '等待日志输出...' : '暂无日志')}
          </pre>
        </>
      )}
    </Drawer>
  )
}
