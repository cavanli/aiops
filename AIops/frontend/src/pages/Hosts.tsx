import { Typography } from 'antd'
import HostList from '@/features/hosts/HostList'

const { Title } = Typography

export default function Hosts() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>主机管理</Title>
      <HostList />
    </div>
  )
}
