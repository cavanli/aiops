import { useState, useEffect } from 'react'
import {
  Drawer, Form, Input, InputNumber, Select, Button, Space, Typography, Tag
} from 'antd'
import type { Host, CreateHostRequest, UpdateHostRequest } from '@/types/host'
import { useCreateHost, useUpdateHost } from './useHosts'

const { Text } = Typography

interface Props {
  open: boolean
  editingHost: Host | null
  onClose: () => void
}

export default function HostDrawer({ open, editingHost, onClose }: Props) {
  const [form] = Form.useForm()
  const [revealSecret, setRevealSecret] = useState(false)
  const createHost = useCreateHost()
  const updateHost = useUpdateHost()

  const isEdit = editingHost !== null

  useEffect(() => {
    if (open) {
      setRevealSecret(false)
      if (editingHost) {
        form.setFieldsValue({
          name: editingHost.name,
          ip: editingHost.ip,
          port: editingHost.port,
          ssh_user: editingHost.ssh_user,
          env: editingHost.env || undefined,
          tags: editingHost.tags || [],
          description: editingHost.description,
        })
      } else {
        form.resetFields()
        form.setFieldValue('port', 22)
      }
    }
  }, [open, editingHost, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload: CreateHostRequest | UpdateHostRequest = { ...values }

    // If editing and secret not revealed, remove ssh_key from payload
    if (isEdit && !revealSecret) {
      delete (payload as UpdateHostRequest).ssh_key
    }

    if (isEdit) {
      await updateHost.mutateAsync({ id: editingHost!.id, data: payload as UpdateHostRequest })
    } else {
      await createHost.mutateAsync(payload as CreateHostRequest)
    }
    onClose()
  }

  const isPending = createHost.isPending || updateHost.isPending

  return (
    <Drawer
      title={isEdit ? '编辑主机' : '添加主机'}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isEdit ? '保存' : '添加'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="主机名" rules={[{ required: true, message: '请输入主机名' }]}>
          <Input placeholder="e.g. prod-web-01" />
        </Form.Item>
        <Form.Item name="ip" label="IP 地址" rules={[{ required: true, message: '请输入 IP 地址' }]}>
          <Input placeholder="192.168.1.100" />
        </Form.Item>
        <Form.Item name="port" label="SSH 端口" rules={[{ required: true }]}>
          <InputNumber min={1} max={65535} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="ssh_user" label="SSH 用户" rules={[{ required: true, message: '请输入 SSH 用户名' }]}>
          <Input placeholder="root" />
        </Form.Item>

        <Form.Item
          name="ssh_key"
          label={
            <Space>
              <span>SSH 密钥/密码</span>
              <Tag color="blue">支持密码或私钥</Tag>
            </Space>
          }
          rules={isEdit && !revealSecret ? [] : [{ required: !isEdit, message: '请输入 SSH 密码或私钥' }]}
        >
          {isEdit && !revealSecret ? (
            <Space>
              <Text type="secondary">••••••••</Text>
              <Button size="small" onClick={() => { setRevealSecret(true); form.setFieldValue('ssh_key', '') }}>
                重新输入
              </Button>
            </Space>
          ) : (
            <Input.TextArea
              rows={4}
              placeholder="输入 SSH 密码或私钥（-----BEGIN OPENSSH PRIVATE KEY-----）"
            />
          )}
        </Form.Item>

        <Form.Item name="env" label="环境">
          <Select
            allowClear
            placeholder="选择环境"
            options={[
              { label: '生产环境', value: 'production' },
              { label: '预发布', value: 'staging' },
              { label: '开发环境', value: 'dev' },
            ]}
          />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            placeholder="输入标签后按回车"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
