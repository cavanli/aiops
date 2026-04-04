import { Typography } from 'antd';

const { Title, Text } = Typography;

export default function Dashboard() {
  return (
    <div>
      <Title level={4}>概览</Title>
      <Text type="secondary">欢迎使用 AIOps 部署中台</Text>
    </div>
  );
}
