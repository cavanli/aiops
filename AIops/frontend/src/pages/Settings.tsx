import { Typography, Card, Form, Input, Select, Button, Divider, Space } from 'antd'

const { Title, Text } = Typography

export default function Settings() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>系统设置</Title>

      <Card title="基本配置" bordered={false} style={{ marginBottom: 16, maxWidth: 640 }}>
        <Form layout="vertical">
          <Form.Item label="平台名称">
            <Input defaultValue="AIOps部署平台" />
          </Form.Item>
          <Form.Item label="默认集群">
            <Select defaultValue="prod">
              <Select.Option value="prod">生产集群</Select.Option>
              <Select.Option value="staging">预发集群</Select.Option>
              <Select.Option value="dev">开发集群</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary">保存</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="关于" bordered={false} style={{ maxWidth: 640 }}>
        <Space direction="vertical">
          <Text type="secondary">版本：v1.0.0</Text>
          <Text type="secondary">后端：Go + Gin</Text>
          <Text type="secondary">前端：React + Vite + Ant Design</Text>
        </Space>
      </Card>
    </div>
  )
}
