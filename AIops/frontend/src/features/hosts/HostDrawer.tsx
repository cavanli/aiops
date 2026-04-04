import { useState, useEffect } from 'react'
import {
  Drawer, Form, Input, InputNumber, Select, Button, Space, Typography
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
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password')
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
          auth_method: editingHost.auth_method,
          username: editingHost.username,
          description: editingHost.description,
        })
        setAuthMethod(editingHost.auth_method)
      } else {
        form.resetFields()
        form.setFieldValue('port', 22)
        form.setFieldValue('auth_method', 'password')
        setAuthMethod('password')
      }
    }
  }, [open, editingHost, form])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload: CreateHostRequest | UpdateHostRequest = { ...values }

    // If editing and secret not revealed, remove secret fields from payload
    if (isEdit && !revealSecret) {
      delete (payload as UpdateHostRequest).password
      delete (payload as UpdateHostRequest).private_key
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
        <Form.Item name="auth_method" label="认证方式" rules={[{ required: true }]}>
          <Select
            onChange={(v) => { setAuthMethod(v); setRevealSecret(false) }}
            options={[
              { label: '密码', value: 'password' },
              { label: 'SSH Key', value: 'key' },
            ]}
          />
        </Form.Item>
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input placeholder="root" />
        </Form.Item>

        {authMethod === 'password' && (
          <Form.Item
            name="password"
            label="密码"
            rules={isEdit && !revealSecret ? [] : [{ required: !isEdit, message: '请输入密码' }]}
          >
            {isEdit && !revealSecret ? (
              <Space>
                <Text type="secondary">••••••••</Text>
                <Button size="small" onClick={() => { setRevealSecret(true); form.setFieldValue('password', '') }}>
                  重新输入
                </Button>
              </Space>
            ) : (
              <Input.Password placeholder="SSH 密码" />
            )}
          </Form.Item>
        )}

        {authMethod === 'key' && (
          <Form.Item
            name="private_key"
            label="SSH 私钥"
            rules={isEdit && !revealSecret ? [] : [{ required: !isEdit, message: '请输入 SSH 私钥' }]}
          >
            {isEdit && !revealSecret ? (
              <Space>
                <Text type="secondary">••••••••</Text>
                <Button size="small" onClick={() => { setRevealSecret(true); form.setFieldValue('private_key', '') }}>
                  重新输入
                </Button>
              </Space>
            ) : (
              <Input.TextArea rows={6} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
            )}
          </Form.Item>
        )}

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
