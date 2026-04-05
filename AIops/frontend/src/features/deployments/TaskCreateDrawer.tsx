import { Drawer, Form, Select, Switch, Button, Space } from 'antd'
import { useTemplates, useCreateTask } from './useDeployments'
import { useHosts } from '@/features/hosts/useHosts'

interface Props {
  open: boolean
  onClose: () => void
}

export default function TaskCreateDrawer({ open, onClose }: Props) {
  const [form] = Form.useForm()
  const { data: templates = [] } = useTemplates()
  const { data: hosts = [] } = useHosts()
  const createTask = useCreateTask()

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await createTask.mutateAsync({
      template_id: values.template_id,
      host_ids: values.host_ids,
      fail_fast: values.fail_fast ?? true,
    })
    form.resetFields()
    onClose()
  }

  return (
    <Drawer
      title="新建部署"
      open={open}
      onClose={() => { form.resetFields(); onClose() }}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={() => { form.resetFields(); onClose() }}>取消</Button>
          <Button type="primary" loading={createTask.isPending} onClick={handleSubmit}>
            开始部署
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ fail_fast: true }}>
        <Form.Item name="template_id" label="部署模板" rules={[{ required: true, message: '请选择模板' }]}>
          <Select
            placeholder="选择部署模板"
            options={templates.map((t) => ({ label: `${t.name} (${t.type})`, value: t.id }))}
          />
        </Form.Item>
        <Form.Item name="host_ids" label="目标主机" rules={[{ required: true, message: '请选择至少一台主机' }]}>
          <Select
            mode="multiple"
            placeholder="选择目标主机（可多选）"
            options={hosts.map((h) => ({ label: `${h.name} (${h.ip})`, value: h.id }))}
          />
        </Form.Item>
        <Form.Item name="fail_fast" label="失败策略" valuePropName="checked">
          <Switch checkedChildren="遇错即止" unCheckedChildren="继续执行" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
