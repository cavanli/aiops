import { Typography } from 'antd'
import WorkflowList from '@/features/workflows/WorkflowList'

const { Title } = Typography

export default function Workflows() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>工作流</Title>
      <WorkflowList />
    </div>
  )
}
