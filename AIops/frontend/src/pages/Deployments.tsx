import { Tabs, Typography } from 'antd'
import TemplateList from '@/features/deployments/TemplateList'
import TaskList from '@/features/deployments/TaskList'

const { Title } = Typography

export default function Deployments() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>部署执行</Title>
      <Tabs
        items={[
          {
            key: 'templates',
            label: '部署模板',
            children: <TemplateList />,
          },
          {
            key: 'tasks',
            label: '部署任务',
            children: <TaskList />,
          },
        ]}
      />
    </div>
  )
}
