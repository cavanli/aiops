import { Typography } from 'antd'
import ModelList from '@/features/models/ModelList'

const { Title } = Typography

export default function Models() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>模型广场</Title>
      <ModelList />
    </div>
  )
}
